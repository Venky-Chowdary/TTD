import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_VERSION = '5.4.624';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  }
  return extractTextFromImage(file);
}

async function extractTextFromImage(image: File | HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create canvas context');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  const text = await extractTextFromImage(canvas);
  return text;
}
