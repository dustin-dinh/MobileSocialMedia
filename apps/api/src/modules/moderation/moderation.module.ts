import { Global, Module } from '@nestjs/common';

import { ImageModerationService } from './image-moderation.service';

// Global: một phiên ONNX dùng chung cho mọi module (nạp mô hình một lần).
@Global()
@Module({
    providers: [ImageModerationService],
    exports: [ImageModerationService],
})
export class ModerationModule { }
