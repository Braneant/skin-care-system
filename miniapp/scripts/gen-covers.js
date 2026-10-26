/* eslint-disable */
/** 生成 12 张文章封面（600x338 渐变 PNG）→ src/static/covers/artN.png */
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../server/node_modules/sharp'));

const outDir = path.resolve(__dirname, '../src/static/covers');
fs.mkdirSync(outDir, { recursive: true });

const pairs = [
  ['#f9a8a8', '#f56c6c'],
  ['#a8d8f9', '#6c9cf5'],
  ['#a8f9c8', '#3bb877'],
  ['#f9e0a8', '#e6a23c'],
  ['#d8a8f9', '#9b6cf5'],
  ['#a8f9f0', '#3bc7b8'],
  ['#f9c8d8', '#e07a9a'],
  ['#c8d8f9', '#6a7ce0'],
  ['#f9f0a8', '#c7b83c'],
  ['#d8f9a8', '#7ab83c'],
  ['#f9c8a8', '#e0843c'],
  ['#b8a8f9', '#6c5ce0'],
  ['#a8c8f9', '#5b8def'],
];

(async () => {
  for (let i = 0; i < pairs.length; i++) {
    const [c1, c2] = pairs[i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient></defs>
      <rect width="600" height="338" fill="url(#g)"/>
      <circle cx="505" cy="55" r="95" fill="rgba(255,255,255,0.18)"/>
      <circle cx="85" cy="300" r="130" fill="rgba(255,255,255,0.12)"/>
      <circle cx="330" cy="180" r="60" fill="rgba(255,255,255,0.08)"/>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `art${i + 1}.png`));
    console.log('cover:', `art${i + 1}.png`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
