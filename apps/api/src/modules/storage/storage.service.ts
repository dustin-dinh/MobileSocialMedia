import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import {
    CreateBucketCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
    keyFromStoredUrl,
    privateKeyFromStoredUrl,
    privateStorageBucket,
    publicEndpoint,
    s3Client,
    storageBucket,
    storedPrivateUrl,
    storedUrl,
} from './media-url';

const UPLOAD_URL_TTL_SECONDS = 600;

// Kho tệp theo chuẩn S3: MinIO trong Docker khi phát triển, S3/R2/... khi triển khai (chỉ đổi biến môi trường).
@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private readonly bucket = storageBucket();
    private readonly privateBucket = privateStorageBucket();
    private readonly client = s3Client(
        process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    );

    // Tạo bucket đọc công khai và bucket riêng tư nếu chưa có. Kho tệp chưa bật thì API vẫn chạy,
    // chỉ việc tải tệp báo lỗi.
    async onModuleInit(): Promise<void> {
        try {
            try {
                await this.client.send(
                    new HeadBucketCommand({ Bucket: this.privateBucket }),
                );
            } catch {
                // Không gắn policy: chỉ đọc được bằng URL có chữ ký.
                await this.client.send(
                    new CreateBucketCommand({ Bucket: this.privateBucket }),
                );
                this.logger.log(`Created private bucket "${this.privateBucket}"`);
            }

            try {
                await this.client.send(
                    new HeadBucketCommand({ Bucket: this.bucket }),
                );
            } catch {
                await this.client.send(
                    new CreateBucketCommand({ Bucket: this.bucket }),
                );
                await this.client.send(
                    new PutBucketPolicyCommand({
                        Bucket: this.bucket,
                        Policy: JSON.stringify({
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Principal: '*',
                                    Action: ['s3:GetObject'],
                                    Resource: [`arn:aws:s3:::${this.bucket}/*`],
                                },
                            ],
                        }),
                    }),
                );
                this.logger.log(`Created public bucket "${this.bucket}"`);
            }
        } catch (error) {
            this.logger.warn(
                `Storage is not reachable (${(error as Error).message}). ` +
                    'Start it with "docker compose up -d" at the repository root.',
            );
        }
    }

    // Trả về giá trị để lưu vào database ("s3:<key>", hoặc "s3p:<key>" khi riêng tư), không phải URL đầy đủ.
    async upload(
        file: Express.Multer.File,
        storagePath: string,
        options: { private?: boolean } = {},
    ): Promise<string> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: options.private ? this.privateBucket : this.bucket,
                    Key: storagePath,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }),
            );
        } catch (error) {
            throw new InternalServerErrorException(
                `Storage upload failed: ${(error as Error).message}`,
            );
        }

        return options.private ? storedPrivateUrl(storagePath) : storedUrl(storagePath);
    }

    // URL có chữ ký để điện thoại PUT tệp thẳng vào kho, không đi qua API.
    // Chữ ký gắn với host, nên phải ký đúng địa chỉ mà client sẽ gọi.
    async createUploadUrl(
        storagePath: string,
        contentType: string,
        requestHost?: string,
    ): Promise<string> {
        return getSignedUrl(
            s3Client(publicEndpoint(requestHost)),
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: storagePath,
                ContentType: contentType,
            }),
            { expiresIn: UPLOAD_URL_TTL_SECONDS },
        );
    }

    // Kích thước và loại tệp thật trong kho; null khi tệp không tồn tại.
    async head(
        storagePath: string,
    ): Promise<{ size: number; contentType: string } | null> {
        try {
            const object = await this.client.send(
                new HeadObjectCommand({ Bucket: this.bucket, Key: storagePath }),
            );

            return {
                size: object.ContentLength ?? 0,
                contentType: object.ContentType ?? '',
            };
        } catch {
            return null;
        }
    }

    // Xóa theo giá trị đã lưu; bỏ qua URL ngoài kho (ảnh Google, ảnh cũ trên Supabase) và lỗi storage.
    async removeByUrls(urls: (string | null | undefined)[]): Promise<void> {
        const removals = urls.flatMap((url) => {
            const key = keyFromStoredUrl(url);
            const privateKey = privateKeyFromStoredUrl(url);

            if (key) {
                return [this.remove(key)];
            }

            return privateKey ? [this.remove(privateKey, this.privateBucket)] : [];
        });

        await Promise.allSettled(removals);
    }

    async remove(storagePath: string, bucket = this.bucket): Promise<void> {
        try {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: bucket, Key: storagePath }),
            );
        } catch (error) {
            throw new InternalServerErrorException(
                `Storage delete failed: ${(error as Error).message}`,
            );
        }
    }
}
