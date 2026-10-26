/* eslint-disable */
/**
 * 构建后补丁：修正 mp-weixin 的 project.config.json
 * - libVersion 为空会导致部分微信开发者工具版本的构建服务报
 *   `[Build Service] getRootFactory Not Define`，这里显式指定基础库版本；
 * - 关闭 minified，规避编译器对压缩后 WXSS 的兼容问题。
 */
const fs = require('fs');
const path = require('path');

const targets = [
  path.resolve(__dirname, '../dist/build/mp-weixin/project.config.json'),
  path.resolve(__dirname, '../dist/dev/mp-weixin/project.config.json'),
];

const LIB_VERSION = '3.17.3';

let patched = 0;
for (const p of targets) {
  if (!fs.existsSync(p)) continue;
  try {
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    cfg.libVersion = LIB_VERSION;
    cfg.setting = Object.assign({}, cfg.setting, {
      urlCheck: false,
      es6: true,
      postcss: true,
      minified: false,
      newFeature: true,
      bigPackageSizeSupport: false,
    });
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
    console.log(`[patch-mp-config] patched: ${path.relative(process.cwd(), p)} (libVersion=${LIB_VERSION}, minified=false)`);
    patched++;
  } catch (e) {
    console.warn(`[patch-mp-config] failed: ${p}`, e.message);
  }
}
if (!patched) {
  console.warn('[patch-mp-config] no project.config.json found (build first).');
}
