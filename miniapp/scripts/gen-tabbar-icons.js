/* eslint-disable */
/** 生成 tabBar 图标：4 个图标 × 灰(默认)/粉(选中) 两态 → 81x81 PNG */
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../server/node_modules/sharp'));

const outDir = path.resolve(__dirname, '../src/static/tabbar');
fs.mkdirSync(outDir, { recursive: true });

const shapes = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  checkin: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  plan: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
  mine: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
};
const colors = { '': '#999999', '-active': '#f56c6c' };

(async () => {
  for (const [name, inner] of Object.entries(shapes)) {
    for (const [suffix, color] of Object.entries(colors)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
      await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `${name}${suffix}.png`));
      console.log('generated:', `${name}${suffix}.png`);
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
