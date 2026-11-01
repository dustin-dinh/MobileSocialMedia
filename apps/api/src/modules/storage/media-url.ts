import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Tệp mới được lưu trong database dưới dạng "s3:<key>" thay vì URL đầy đủ, vì địa chỉ
// kho lưu trữ đổi theo môi trường (IP máy dev đổi, BlueStacks dùng 10.0.2.2, production dùng tên miền).
// URL đầy đủ chỉ được ghép khi trả về cho client. Ảnh cũ trên Supabase là URL tuyệt đối nên giữ nguyên.
export const MEDIA_PREFIX = 's3:';
// Tệp riêng tư (ảnh tin nhắn): nằm ở bucket không đọc công khai, client chỉ nhận URL có chữ ký, hết hạn.
// Quyền xem do chỗ chọn dữ liệu quyết định (chỉ thành viên hội thoại mới nhận được tin nhắn).
export const PRIVATE_MEDIA_PREFIX = 's3p:';
const PRIVATE_URL_TTL_SECONDS = 3600;

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1'];

export function storageBucket(): string {
    return process.env.S3_BUCKET ?? 'social-media';
}

export function privateStorageBucket(): string {
    // `||`: an empty S3_PRIVATE_BUCKET= line in .env means "use the default".
    return process.env.S3_PRIVATE_BUCKET || `${storageBucket()}-private`;
}

const clients = new Map<string, S3Client>();

export function s3Client(endpoint: string): S3Client {
    let client = clients.get(endpoint);

    if (!client) {
        client = new S3Client({
            endpoint,
            region: process.env.S3_REGION ?? 'us-east-1',
            // MinIO không dùng tên miền theo bucket.
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY ?? '',
                secretAccessKey: process.env.S3_SECRET_KEY ?? '',
            },
        });
        clients.set(endpoint, client);
    }

    return client;
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

export function storedPrivateUrl(key: string): string {
    return PRIVATE_MEDIA_PREFIX + key;
}

export function keyFromStoredUrl(url: string | null | undefined): string | null {
    return url?.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : null;
}

export function privateKeyFromStoredUrl(url: string | null | undefined): string | null {
    return url?.startsWith(PRIVATE_MEDIA_PREFIX)
        ? url.slice(PRIVATE_MEDIA_PREFIX.length)
        : null;
}

function signPrivateUrl(key: string, requestHost?: string): Promise<string> {
    return getSignedUrl(
        s3Client(publicEndpoint(requestHost)),
        new GetObjectCommand({ Bucket: privateStorageBucket(), Key: key }),
        { expiresIn: PRIVATE_URL_TTL_SECONDS },
    );
}

// Đổi mọi trường "...Url"/"url" dạng "s3:<key>" / "s3p:<key>" trong một response thành URL đầy đủ.
// Chỉ xét theo tên trường để nội dung người dùng gõ (ví dụ "s3:abc") không bị đổi.
export async function resolveMediaUrls<T>(value: T, requestHost?: string): Promise<T> {
    const base = publicBase(requestHost);

    const walk = async (node: unknown, key?: string): Promise<unknown> => {
        if (typeof node === 'string') {
            if (!key || !/url$/i.test(key)) {
                return node;
            }

            if (node.startsWith(PRIVATE_MEDIA_PREFIX)) {
                return signPrivateUrl(node.slice(PRIVATE_MEDIA_PREFIX.length), requestHost);
            }

            return node.startsWith(MEDIA_PREFIX)
                ? `${base}/${node.slice(MEDIA_PREFIX.length)}`
                : node;
        }

        if (Array.isArray(node)) {
            return Promise.all(node.map((item) => walk(item, key)));
        }

        // Chỉ đi vào object thuần; Date, Buffer... giữ nguyên.
        if (node && Object.getPrototypeOf(node) === Object.prototype) {
            return Object.fromEntries(
                await Promise.all(
                    Object.entries(node).map(async ([childKey, child]) => [
                        childKey,
                        await walk(child, childKey),
                    ]),
                ),
            );
        }

        return node;
    };

    return (await walk(value)) as T;
}
