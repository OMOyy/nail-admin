import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  });
}
