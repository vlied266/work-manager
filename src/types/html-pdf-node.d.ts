declare module 'html-pdf-node' {
  export interface PdfOptions {
    format?: string;
    border?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    type?: string;
    quality?: string;
    renderDelay?: number;
  }

  export interface PdfFile {
    content: string;
  }

  export function generatePdf(file: PdfFile, options?: PdfOptions): Promise<Buffer>;
}

