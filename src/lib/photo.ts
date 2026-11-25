import { toast } from "sonner";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Unsupported image")); };
    img.src = url;
  });
}

/** Shrinks a photo to a small JPEG data URL so it can be stored with the record. Falls back when createImageBitmap fails (e.g. some phone formats). */
export async function photoToDataUrl(file: File, max = 900): Promise<string> {
  let src: ImageBitmap | HTMLImageElement;
  try { src = await createImageBitmap(file); } catch { src = await loadImage(file); }
  const w = src.width, h = src.height;
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

/** Same as photoToDataUrl but shows an error message and returns undefined if the photo can't be read. */
export async function safePhoto(file: File | undefined, max = 900): Promise<string | undefined> {
  if (!file) return undefined;
  try { return await photoToDataUrl(file, max); }
  catch { toast.error("Couldn't read that photo. Try a JPG or PNG, or take a new one."); return undefined; }
}
