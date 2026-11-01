import {
    Injectable,
    Logger,
    OnModuleInit,
    ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as ort from 'onnxruntime-node';
// sharp 0.35 khai báo kiểu theo ESM (default export) nhưng bản CommonJS trả thẳng hàm:
// `import sharp from 'sharp'` biên dịch ra undefined. Dùng require với đúng kiểu đã khai báo.
const sharp = require('sharp') as typeof import('sharp').default;

// Mô hình AdamCodd/vit-base-nsfw-detector (Apache-2.0): ViT 384x384, nhãn 0 = sfw, 1 = nsfw.
// Tải bằng `node scripts/download-moderation-model.cjs`. Chạy ngay trên server: ảnh không rời máy chủ.
const IMAGE_SIZE = 384;
const NSFW_INDEX = 1;

export type ImageVerdict = { sensitive: boolean };
export type ImageModerationStatus = 'ready' | 'unavailable';

// Làm mờ ảnh nhạy cảm trong tin nhắn. Chỉ trả về có/không nhạy cảm; không lưu điểm hay đặc trưng ảnh.
@Injectable()
export class ImageModerationService implements OnModuleInit {
    private readonly logger = new Logger(ImageModerationService.name);
    private readonly modelPath = resolve(
        process.env.IMAGE_MODERATION_MODEL_DIR || 'models/nsfw-vit',
        'model.onnx',
    );
    // Mô hình chủ ý chặt tay ("sexy" cũng là nsfw); làm mờ nhầm thì người nhận chỉ cần chạm để xem.
    private readonly threshold = Number(process.env.IMAGE_MODERATION_THRESHOLD || 0.7);
    // true: không có mô hình thì từ chối ảnh thay vì gửi mà không làm mờ.
    private readonly required = process.env.IMAGE_MODERATION_REQUIRED === 'true';
    private session: ort.InferenceSession | null = null;

    async onModuleInit(): Promise<void> {
        if (!existsSync(this.modelPath)) {
            this.logger.warn(
                `Image moderation model not found at ${this.modelPath}; chat images will not be blurred. ` +
                    'Run "node scripts/download-moderation-model.cjs" in apps/api.',
            );
            return;
        }

        try {
            this.session = await ort.InferenceSession.create(this.modelPath);
            this.logger.log('Image moderation model loaded');
        } catch (error) {
            this.logger.error(`Image moderation model failed to load: ${(error as Error).message}`);
        }
    }

    status(): ImageModerationStatus {
        return this.session ? 'ready' : 'unavailable';
    }

    async classify(image: Buffer): Promise<ImageVerdict> {
        if (!this.session) {
            if (this.required) {
                throw new ServiceUnavailableException('Image checking is unavailable; try again later');
            }

            return { sensitive: false };
        }

        try {
            const pixels = await sharp(image)
                .rotate()
                .removeAlpha()
                .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'fill' })
                .raw()
                .toBuffer();

            // HWC 0..255 -> CHW, chuẩn hóa (x/255 - 0.5) / 0.5 như preprocessor_config.json.
            const area = IMAGE_SIZE * IMAGE_SIZE;
            const input = new Float32Array(3 * area);

            for (let i = 0; i < area; i += 1) {
                for (let c = 0; c < 3; c += 1) {
                    input[c * area + i] = pixels[i * 3 + c] / 127.5 - 1;
                }
            }

            const output = await this.session.run({
                pixel_values: new ort.Tensor('float32', input, [1, 3, IMAGE_SIZE, IMAGE_SIZE]),
            });
            const logits = Array.from(output.logits.data as Float32Array);
            const nsfw = logits[NSFW_INDEX];
            const sfw = logits[1 - NSFW_INDEX];
            const nsfwProbability = 1 / (1 + Math.exp(sfw - nsfw));

            return { sensitive: nsfwProbability >= this.threshold };
        } catch (error) {
            // Ảnh hỏng hoặc định dạng lạ: coi như nhạy cảm để người nhận tự quyết có mở không.
            this.logger.warn(`Image moderation failed: ${(error as Error).message}`);

            return { sensitive: true };
        }
    }
}
