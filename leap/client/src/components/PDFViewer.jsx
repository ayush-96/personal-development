import { useState } from "react";
import { Document, Page } from "react-pdf";
import "@/lib/pdf-worker";
import { cn } from "@/lib/utils";

export function PDFViewer({ fileUrl, initialScale = 1, className }) {
  const [numPages, setNumPages] = useState(null);

  if (!fileUrl) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center text-muted-foreground", className)}>
        No file selected
      </div>
    );
  }

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
  }

  return (
    <div className={cn("flex flex-col h-full w-full max-w-3xl mx-auto", className)}>
      <div className="flex-1 overflow-auto bg-background">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-4 text-sm text-muted-foreground">Loading PDF…</div>}
          error={<div className="p-4 text-sm text-destructive">Failed to load PDF.</div>}
        >
          {numPages > 0 &&
            Array.from({ length: numPages }).map((_, idx) => (
              <div key={idx} className="flex justify-center my-4">
                <div className="rounded-md shadow-md overflow-hidden max-w-[900px]">
                  <Page
                    pageNumber={idx + 1}
                    scale={initialScale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}