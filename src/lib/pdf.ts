import { PDFDocument } from 'pdf-lib';

export async function detectPageCount(file: File): Promise<number> {
  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    }
    
    // For images, default to 1 page
    if (file.type.startsWith('image/')) {
      return 1;
    }

    // For docx/txt default fallback estimated count
    return 1;
  } catch (err) {
    console.error('Error counting PDF pages:', err);
    return 1;
  }
}

export function parsePageRange(rangeStr: string, maxPages: number): number {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    return maxPages;
  }

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((val) => parseInt(val.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pagesSet.add(pageNum);
      }
    }
  }

  return pagesSet.size > 0 ? pagesSet.size : maxPages;
}
