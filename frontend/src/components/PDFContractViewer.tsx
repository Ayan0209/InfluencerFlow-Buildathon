// frontend/src/components/PDFContractViewer.tsx
import { useEffect, useState } from "react";

interface PDFContractViewerProps {
  url?: string;
  blob?: Blob;
}

export default function PDFContractViewer({ url, blob }: PDFContractViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    // If the parent passed a Blob, convert it to an object URL
    if (blob) {
      const newUrl = URL.createObjectURL(blob);
      setObjectUrl(newUrl);

      // Revoke URL when unmounting
      return () => {
        URL.revokeObjectURL(newUrl);
      };
    }
    // If the parent passed a URL, just use that directly
    if (url) {
      setObjectUrl(url);
    }
  }, [url, blob]);

  if (!objectUrl) {
    return <div className="text-gray-500">No contract to display.</div>;
  }

  return (
    <div className="w-full h-[80vh] border">
      <iframe
        src={objectUrl}
        className="w-full h-full"
        frameBorder="0"
      />
      <a
        href={objectUrl}
        download="contract.pdf"
        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
      >
        Download PDF
      </a>
    </div>
  );
}
