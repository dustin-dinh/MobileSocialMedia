// Tải mô hình nhận diện ảnh nhạy cảm dùng để làm mờ ảnh trong tin nhắn.
//
//   node scripts/download-moderation-model.cjs
//
// Mô hình: AdamCodd/vit-base-nsfw-detector (Hugging Face), bản ONNX lượng tử hóa (~88 MB),
// giấy phép Apache-2.0: được dùng thương mại và phân phối lại, phải giữ kèm giấy phép và ghi
// nguồn (xem docs/moderation/MODERATION_PLAN.md, mục "Giấy phép mô hình").
// Không có tệp này thì API vẫn chạy, chỉ không làm mờ ảnh (xem IMAGE_MODERATION_REQUIRED).
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');

const REPO = 'AdamCodd/vit-base-nsfw-detector';
const REVISION = 'main';
const FILES = [
  ['onnx/model_quantized.onnx', 'model.onnx'],
  ['config.json', 'config.json'],
  ['preprocessor_config.json', 'preprocessor_config.json'],
];
const target = path.join(__dirname, '..', 'models', 'nsfw-vit');

(async () => {
  fs.mkdirSync(target, { recursive: true });

  for (const [remote, local] of FILES) {
    const destination = path.join(target, local);

    if (fs.existsSync(destination)) {
      console.log(`skip ${local} (already there)`);
      continue;
    }

    const url = `https://huggingface.co/${REPO}/resolve/${REVISION}/${remote}`;
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`${url} -> HTTP ${response.status}`);
    }

    const partial = `${destination}.part`;
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(partial));
    fs.renameSync(partial, destination);
    console.log(`saved ${local} (${fs.statSync(destination).size} bytes)`);
  }

  fs.writeFileSync(
    path.join(target, 'SOURCE.txt'),
    `${REPO} @ ${REVISION}\nhttps://huggingface.co/${REPO}\nLicense: Apache-2.0\n`,
  );
  console.log(`model ready in ${target}`);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
