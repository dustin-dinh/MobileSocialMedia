// Kiểm tra nhanh luồng video / Reels và kho tệp S3 trên một API đang chạy.
//
//   docker compose up -d                        (ở thư mục gốc, bật MinIO)
//   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
//   API=http://localhost:3000/api node scripts/reels-smoke.cjs
//   node scripts/seed-test-users.cjs clean
const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!gap';
let failed = 0;

function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
}

async function call(method, path, token, body, form) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}/${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function login(name) {
  const r = await call('POST', 'auth/login', null, { email: `gaptest_${name}@example.invalid`, password: PASSWORD });
  return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id };
}

// Xin URL rồi PUT thẳng vào kho, như điện thoại sẽ làm.
async function upload(token, kind, mimeType, bytes) {
  const r = await call('POST', 'media/upload-url', token, { kind, mimeType, sizeBytes: bytes.length });
  if (r.status >= 300) return { request: r };
  const put = await fetch(r.body.data.uploadUrl, { method: 'PUT', headers: r.body.data.headers, body: bytes });
  return { request: r, putStatus: put.status, key: r.body.data.storageKey };
}

(async () => {
  const a = await login('a');
  const b = await login('b');
  check('login a, b', Boolean(a.token && b.token), { a, b });

  // upload-url validation
  let r = await call('POST', 'media/upload-url', a.token, { kind: 'video', mimeType: 'video/x-msvideo', sizeBytes: 10 });
  check('upload-url rejects unsupported type', r.status === 400, r);
  r = await call('POST', 'media/upload-url', a.token, { kind: 'video', mimeType: 'video/mp4', sizeBytes: 31 * 1024 * 1024 });
  check('upload-url rejects > 30 MB', r.status === 400, r);
  r = await call('POST', 'media/upload-url', null, { kind: 'video', mimeType: 'video/mp4', sizeBytes: 10 });
  check('upload-url needs auth', r.status === 401, r);

  // direct upload
  const video = await upload(a.token, 'video', 'video/mp4', Buffer.alloc(200_000, 7));
  check('video: signed URL + direct PUT', video.putStatus === 200 && video.key?.startsWith(`posts/${a.id}/`), video);
  const thumb = await upload(a.token, 'thumbnail', 'image/jpeg', Buffer.alloc(5_000, 9));
  check('thumbnail: signed URL + direct PUT', thumb.putStatus === 200, thumb);

  // create post validation
  const media = (extra) => [{ type: 'VIDEO', storageKey: video.key, thumbnailKey: thumb.key, width: 720, height: 1280, durationMs: 12_000, ...extra }];
  r = await call('POST', 'posts/media', b.token, { content: 'steal', media: media() });
  check('cannot post with another user\'s storage key', r.status === 400, r);
  r = await call('POST', 'posts/media', a.token, { media: media({ storageKey: `posts/${a.id}/missing.mp4` }) });
  check('missing object -> 400', r.status === 400, r);
  const fake = await upload(a.token, 'thumbnail', 'image/png', Buffer.alloc(100, 1));
  r = await call('POST', 'posts/media', a.token, { media: media({ storageKey: fake.key, thumbnailKey: undefined }) });
  check('non-video object -> 400', r.status === 400, r);
  const long = await upload(a.token, 'video', 'video/mp4', Buffer.alloc(1_000, 1));
  r = await call('POST', 'posts/media', a.token, { media: media({ storageKey: long.key, thumbnailKey: undefined, durationMs: 90_000 }) });
  check('too long -> 400', r.status === 400, r);

  // create the reel
  r = await call('POST', 'posts/media', a.token, { content: 'reel smoke #test', privacy: 'PUBLIC', media: media() });
  const reel = r.body?.data;
  const item = reel?.media?.[0];
  check('create video post', r.status === 201 && item?.type === 'video' && item.durationMs === 12_000 && item.width === 720, r);
  check('media urls are absolute', /^https?:\/\//.test(item?.url ?? '') && /^https?:\/\//.test(item?.thumbnailUrl ?? ''), item);
  const head = item ? await fetch(item.url, { method: 'HEAD' }) : null;
  check('video is publicly readable', head?.status === 200 && head.headers.get('content-type') === 'video/mp4', head?.status);

  // horizontal video: posted, but not a reel
  const wide = await upload(a.token, 'video', 'video/mp4', Buffer.alloc(1_000, 2));
  r = await call('POST', 'posts/media', a.token, { content: 'wide', media: media({ storageKey: wide.key, thumbnailKey: undefined, width: 1280, height: 720 }) });
  const widePost = r.body?.data;
  check('create horizontal video post', r.status === 201, r);

  // feeds
  r = await call('GET', 'posts/feed?limit=20', b.token);
  const inFeed = r.body?.data?.find((p) => p.id === reel?.id);
  check('video post appears in home feed with media fields', Boolean(inFeed?.media?.[0]?.thumbnailUrl), inFeed);
  r = await call('GET', 'reels/feed?limit=20', b.token);
  const ids = r.body?.data?.map((p) => p.id) ?? [];
  check('reels feed has the vertical video, a reason and a requestId', ids.includes(reel?.id) && Boolean(r.body.data[0].reason?.code) && Boolean(r.body.meta?.requestId), r);
  check('reels feed leaves out the horizontal video', !ids.includes(widePost?.id), ids);
  r = await call('GET', `reels/feed?limit=20&exclude=${reel?.id}`, b.token);
  check('exclude removes ids', !r.body.data.some((p) => p.id === reel?.id), r);

  // interactions
  const event = { eventId: `smoke-${Date.now()}`, eventType: 'VIEW', postId: reel?.id, mediaId: item?.id, watchMs: 3000, durationMs: 12_000, position: 0, requestId: 'smoke', surface: 'reels', createdAt: new Date().toISOString() };
  r = await call('POST', 'interactions', b.token, { events: [event, { ...event, eventId: event.eventId + '-ghost', postId: 'does-not-exist' }] });
  check('interactions accepted (unknown post skipped)', r.status === 204, r);
  r = await call('POST', 'interactions', b.token, { events: [event] });
  check('resent batch is not an error', r.status === 204, r);
  r = await call('POST', 'interactions', b.token, { events: [{ ...event, eventType: 'HACK' }] });
  check('unknown event type -> 400', r.status === 400, r);
  // b followed nobody and the reel is seen now: with a second unseen reel it must rank below it.
  const second = await upload(a.token, 'video', 'video/mp4', Buffer.alloc(1_000, 3));
  r = await call('POST', 'posts/media', a.token, { content: 'second reel', media: media({ storageKey: second.key, thumbnailKey: undefined }) });
  const secondPost = r.body?.data;
  r = await call('GET', 'reels/feed?limit=20', b.token);
  const order = r.body.data.map((p) => p.id);
  check('seen reel ranks after unseen reel', order.indexOf(secondPost?.id) < order.indexOf(reel?.id), order);

  // not interested
  r = await call('POST', `posts/${reel?.id}/not-interested`, b.token);
  check('not-interested', r.status === 201 && r.body?.data?.isHidden === true, r);
  r = await call('GET', 'reels/feed?limit=20', b.token);
  check('hidden reel leaves the reels feed', !r.body.data.some((p) => p.id === reel?.id), null);

  // image post still works, now stored in S3
  const form = new FormData();
  form.append('content', 'image smoke');
  form.append('images', new Blob([Buffer.alloc(2_000, 5)], { type: 'image/png' }), 'x.png');
  r = await call('POST', 'posts', a.token, undefined, form);
  const imageUrl = r.body?.data?.media?.[0]?.url;
  check('image post: absolute url', r.status === 201 && /^https?:\/\//.test(imageUrl ?? ''), r);
  check('image is publicly readable', imageUrl ? (await fetch(imageUrl, { method: 'HEAD' })).status === 200 : false, imageUrl);

  // only "...Url" fields are rewritten, never what a user typed
  r = await call('POST', 'posts', a.token, undefined, (() => { const f = new FormData(); f.append('content', 's3:not-a-file'); return f; })());
  check('user text starting with "s3:" is left alone', r.body?.data?.content === 's3:not-a-file', r);

  // host-relative urls: a client that reaches the API by another host gets media urls on that host
  if (BASE.includes('localhost')) {
    const viaIp = await fetch(`${BASE.replace('localhost', '127.0.0.1')}/posts/${reel?.id}`, { headers: { Authorization: `Bearer ${a.token}` } }).then((res) => res.json());
    // GET posts/:id trả thẳng bài viết, không bọc trong { data }.
    check('media url follows the request host', viaIp?.media?.[0]?.url?.includes('//127.0.0.1:'), viaIp?.media?.[0]?.url ?? viaIp);
  }

  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((error) => { console.error('CRASHED', error); process.exit(1); });
