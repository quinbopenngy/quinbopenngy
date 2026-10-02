/**
 * Compresses and scales an image to an optimal size for OCR (max 1600px dimension).
 * This significantly speeds up upload and inference, prevents network timeouts,
 * and reduces the chance of 503 high-demand spike errors while preserving full OCR text clarity.
 */
export async function optimizeImageForOCR(base64DataUrl: string, maxDim: number = 1600): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If image is already within reasonable bounds, return original
      if (width <= maxDim && height <= maxDim) {
        resolve({ base64: base64DataUrl, mimeType: 'image/jpeg' });
        return;
      }

      // Calculate new scaled dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ base64: base64DataUrl, mimeType: 'image/jpeg' });
        return;
      }

      // Fill white background in case source has transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ base64: optimizedBase64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      // Fallback to original
      resolve({ base64: base64DataUrl, mimeType: 'image/jpeg' });
    };

    img.src = base64DataUrl;
  });
}
