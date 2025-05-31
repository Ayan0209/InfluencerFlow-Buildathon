"use client";
import { useEffect, useRef } from "react";

export default function PDFContractViewer({ url, blob }: { url?: string; blob?: Blob }) {
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    if (blob) {
      objectUrl.current = URL.createObjectURL(blob);
      return () => {
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      };
    }
  }, [blob]);

  const src = url || objectUrl.current;
  if (!src) return <div className="text-muted">No contract to display.</div>;
  return (
    <iframe
      src={src}
      title="Contract PDF"
      className="w-full h-full min-h-[600px] border rounded"
      style={{ minHeight: 600 }}
    />
  );
} 