/**
 * 前端图片压缩：最长边 800px、JPEG q80
 * - H5：canvas 压缩后输出 dataURL
 * - 微信小程序：uni.compressImage 压缩后读为 base64 dataURL
 */
export function compressImage(src: string): Promise<string> {
  // #ifdef H5
  return compressByCanvas(src);
  // #endif
  // #ifndef H5
  return new Promise<string>((resolve, reject) => {
    uni.compressImage({
      src,
      quality: 80,
      success: (res) => {
        fileToBase64(res.tempFilePath).then(resolve).catch(reject);
      },
      fail: () => {
        fileToBase64(src).then(resolve).catch(reject);
      },
    });
  });
  // #endif
}

// #ifdef H5
function compressByCanvas(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxEdge = 800;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas 不可用'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}
// #endif

// #ifndef H5
function fileToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(`data:image/jpeg;base64,${res.data}`),
      fail: reject,
    });
  });
}
// #endif
