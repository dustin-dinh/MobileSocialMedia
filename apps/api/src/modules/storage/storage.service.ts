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
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
    keyFromStoredUrl,
    publicEndpoint,
    storageBucket,
    storedUrl,
} from './media-url';

const UPLOAD_URL_TTL_SECONDS = 600;

// Kho tệp theo chuẩn S3: MinIO trong Docker khi phát triển, S3/R2/... khi triển khai (chỉ đổi biến môi trường).
@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private readonly bucket = storageBucket();
    private readonly client = this.createClient(
        process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    );

    private createClient(endpoint: string): S3Client {
        return new S3Client({
            endpoint,
            region: process.env.S3_REGION ?? 'us-east-1',
            // MinIO không dùng tên miền theo bucket.
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY ?? '',
                secretAccessKey: process.env.S3_SECRET_KEY ?? '',
            },
        });
    }

    // Tạo bucket đọc công khai nếu chưa có. Kho tệp chưa bật thì API vẫn chạy, chỉ việc tải tệp báo lỗi.
    async onModuleInit(): Promise<void> {
        try {
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

    // Trả về giá trị để lưu vào database ("s3:<key>"), không phải URL đầy đủ.
    async upload(
        file: Express.Multer.File,
        storagePath: string,
    ): Promise<string> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
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

        return storedUrl(storagePath);
    }

    // URL có chữ ký để điện thoại PUT tệp thẳng vào kho, không đi qua API.
    // Chữ ký gắn với host, nên phải ký đúng địa chỉ mà client sẽ gọi.
    async createUploadUrl(
        storagePath: string,
        contentType: string,
        requestHost?: string,
    ): Promise<string> {
        return getSignedUrl(
            this.createClient(publicEndpoint(requestHost)),
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
        const paths = urls
            .map((url) => keyFromStoredUrl(url))
            .filter((path): path is string => path !== null);

        await Promise.allSettled(paths.map((path) => this.remove(path)));
    }

    async remove(storagePath: string): Promise<void> {
        try {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: this.bucket, Key: storagePath }),
            );
        } catch (error) {
            throw new InternalServerErrorException(
                `Storage delete failed: ${(error as Error).message}`,
            );
        }
    }
}
