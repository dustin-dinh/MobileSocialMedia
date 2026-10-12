import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';

import { resolveMediaUrls } from './media-url';

// Ghép URL đầy đủ cho mọi tệp trong response, theo host mà client đã dùng để gọi API.
@Injectable()
export class MediaUrlInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const host = context.switchToHttp().getRequest<Request>().hostname;

        return next.handle().pipe(map((body) => resolveMediaUrls(body, host)));
    }
}
