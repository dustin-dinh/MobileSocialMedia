// Tệp mới được lưu trong database dưới dạng "s3:<key>" thay vì URL đầy đủ, vì địa chỉ
// kho lưu trữ đổi theo môi trường (IP máy dev đổi, BlueStacks dùng 10.0.2.2, production dùng tên miền).
// URL đầy đủ chỉ được ghép khi trả về cho client. Ảnh cũ trên Supabase là URL tuyệt đối nên giữ nguyên.
export const MEDIA_PREFIX = 's3:';

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1'];

export function storageBucket(): string {
    return process.env.S3_BUCKET ?? 'social-media';
}

// Địa chỉ kho lưu trữ mà client gọi được. MinIO chạy cùng máy với API, nên khi S3_ENDPOINT
// là localhost thì dùng lại đúng host mà client vừa dùng để gọi API.
export function publicEndpoint(requestHost?: string): string {
    const endpoint = new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000');

    if (requestHost && LOOPBACK_HOSTS.includes(endpoint.hostname)) {
        endpoint.hostname = requestHost.split(':')[0];
    }

    return endpoint.origin;
}

// S3_PUBLIC_URL (CDN hoặc tên miền riêng) được ưu tiên khi có.
function publicBase(requestHost?: string): string {
    const fixed = process.env.S3_PUBLIC_URL?.replace(/\/+$/, '');

    return fixed || `${publicEndpoint(requestHost)}/${storageBucket()}`;
}

export function storedUrl(key: string): string {
    return MEDIA_PREFIX + key;
}

export function keyFromStoredUrl(url: string | null | undefined): string | null {
    return url?.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : null;
}

// Đổi mọi trường "...Url"/"url" dạng "s3:<key>" trong một response thành URL đầy đủ.
// Chỉ xét theo tên trường để nội dung người dùng gõ (ví dụ "s3:abc") không bị đổi.
export function resolveMediaUrls<T>(value: T, requestHost?: string): T {
    const base = publicBase(requestHost);

    const walk = (node: unknown, key?: string): unknown => {
        if (typeof node === 'string') {
            return key && /url$/i.test(key) && node.startsWith(MEDIA_PREFIX)
                ? `${base}/${node.slice(MEDIA_PREFIX.length)}`
                : node;
        }

        if (Array.isArray(node)) {
            return node.map((item) => walk(item, key));
        }

        // Chỉ đi vào object thuần; Date, Buffer... giữ nguyên.
        if (node && Object.getPrototypeOf(node) === Object.prototype) {
            return Object.fromEntries(
                Object.entries(node).map(([childKey, child]) => [
                    childKey,
                    walk(child, childKey),
                ]),
            );
        }

        return node;
    };

    return walk(value) as T;
}
