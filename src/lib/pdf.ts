/** Browser-only: renders one page of a PDF drawing to a sharp PNG data URL (loaded lazily). */
export async function pdfPageCount(file: File) {
  const doc = await open(file); const n = doc.numPages; await doc.destroy(); return n;
}
export async function pdfPageToDataUrl(file: File, page = 1, maxPx = 3200) {
  const doc = await open(file);
  const p = await doc.getPage(page);
  const base = p.getViewport({ scale: 1 });
  const vp = p.getViewport({ scale: Math.min(4, maxPx / Math.max(base.width, base.height)) });
  const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
  const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  await p.render({ canvasContext: ctx, viewport: vp }).promise;
  await doc.destroy();
  return c.toDataURL("image/jpeg", 0.85);
}
async function open(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}
