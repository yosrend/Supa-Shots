import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { GeneratedImage } from '../types';

export type ImageFormat = 'jpg' | 'png' | 'webp';

export const convertImage = (base64: string, format: ImageFormat): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Conversion failed'));
        }
      }, mimeType, 0.95); // 0.95 quality for jpeg/webp
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export const copyToClipboard = async (base64: string) => {
  try {
    // Clipboard API usually requires PNG for broad support
    const blob = await convertImage(base64, 'png');
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const downloadImage = async (base64: string, filename: string, format: ImageFormat) => {
  try {
    const blob = await convertImage(base64, format);
    // Handle ESM default export which might be the function itself or an object
    const saveAs = (FileSaver as any).saveAs || FileSaver;
    saveAs(blob, `${filename}.${format}`);
  } catch (err) {
    console.error('Failed to download:', err);
  }
};

export const downloadBulkImages = async (
  images: GeneratedImage[], 
  format: ImageFormat, 
  zipFilename: string
) => {
  const zip = new JSZip();
  const folder = zip.folder("shots");

  const promises = images.map(async (img) => {
    if (!img.imageUrl) return;
    try {
      const blob = await convertImage(img.imageUrl, format);
      folder?.file(`${img.shotType}-${img.id}.${format}`, blob);
    } catch (err) {
      console.error(`Failed to process ${img.shotType}`, err);
    }
  });

  await Promise.all(promises);
  
  const content = await zip.generateAsync({ type: "blob" });
  // Handle ESM default export which might be the function itself or an object
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(content, `${zipFilename}.zip`);
};