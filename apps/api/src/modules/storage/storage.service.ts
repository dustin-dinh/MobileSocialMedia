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