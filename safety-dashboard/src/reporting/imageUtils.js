/**
 * Resizes an image File/Blob to ≤ 1 MB JPEG using an off-screen canvas.
 * Returns a Blob ready for base64 encoding.
 */
export async function resizeImage(file, maxDim = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width  = maxDim;
        } else {
          width  = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          // Retry at lower quality if still > 1 MB
          if (blob.size > 1_000_000 && quality > 0.4) {
            resolve(resizeImage(file, Math.round(maxDim * 0.85), quality - 0.1));
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/**
 * Converts a Blob/File to a base64 data-URL string.
 * This is used as a free alternative to Firebase Storage —
 * the data-URL is stored directly in RTDB and works as an <img src>.
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result); // "data:image/jpeg;base64,..."
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Returns a preview data-URL for a File (before resize) */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
