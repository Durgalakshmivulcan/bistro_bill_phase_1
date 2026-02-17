import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Download } from "lucide-react";

interface BarcodeDisplayProps {
  value: string;
  /** Width of each bar in px (default 2) */
  width?: number;
  /** Height of bars in px (default 60) */
  height?: number;
  /** Show the download button */
  showDownload?: boolean;
  /** Product name used for the downloaded file */
  productName?: string;
}

export default function BarcodeDisplay({
  value,
  width = 2,
  height = 60,
  showDownload = false,
  productName,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: /^\d{13}$/.test(value) ? "EAN13" : "CODE128",
        width,
        height,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    } catch {
      // If the value can't be encoded, clear the SVG
      if (svgRef.current) svgRef.current.innerHTML = "";
    }
  }, [value, width, height]);

  const handleDownload = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      const safeName = (productName || "barcode")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      link.download = `${safeName}_${value}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!value) return null;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg ref={svgRef} />
      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs text-bb-primary hover:underline"
        >
          <Download size={14} />
          Download Barcode
        </button>
      )}
    </div>
  );
}
