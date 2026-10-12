import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
    private readonly supabase: SupabaseClient;
    private readonly bucket: string;

    constructor(private readonly config: ConfigService) {
        const supabaseUrl =
            this.config.getOrThrow<string>('SUPABASE_URL');

        const serviceRoleKey =
            this.config.getOrThrow<string>(
                'SUPABASE_SERVICE_ROLE_KEY',
            );

        this.bucket =
            this.config.getOrThrow<string>(
                'SUPABASE_STORAGE_BUCKET',
            );

        this.supabase = createClient(
            supabaseUrl,
            serviceRoleKey,
        );
    }

    async upload(
        file: Express.Multer.File,
        storagePath: string,
    ): Promise<string> {
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw new InternalServerErrorException(
                `Storage upload failed: ${error.message}`,
            );
        }

        return this.getPublicUrl(storagePath);
    }

    getPublicUrl(storagePath: string): string {
        const { data } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(storagePath);

        return data.publicUrl;
    }

    // URL công khai có dạng .../storage/v1/object/public/<bucket>/<path>.
    pathFromPublicUrl(url: string): string | null {
        try {
            const marker = '/storage/v1/object/public/';
            const pathname = new URL(url).pathname;
            const markerIndex = pathname.indexOf(marker);

            if (markerIndex === -1) {
                return null;
            }

            const objectPath = pathname.slice(markerIndex + marker.length);
            const slashIndex = objectPath.indexOf('/');

            if (slashIndex === -1) {
                return null;
            }

            return decodeURIComponent(objectPath.slice(slashIndex + 1)) || null;
        } catch {
            return null;
        }
    }

    // Xóa theo URL; bỏ qua URL không thuộc bucket (ví dụ ảnh Google) và lỗi storage.
    async removeByUrls(urls: (string | null | undefined)[]): Promise<void> {
        const paths = urls
            .map((url) => (url ? this.pathFromPublicUrl(url) : null))
            .filter((path): path is string => path !== null);

        await Promise.allSettled(paths.map((path) => this.remove(path)));
    }

    async remove(storagePath: string): Promise<void> {
        const { error } =
            await this.supabase.storage
                .from(this.bucket)
                .remove([storagePath]);

        if (error) {
            throw new InternalServerErrorException(
                `Storage delete failed: ${error.message}`,
            );
        }
    }
}