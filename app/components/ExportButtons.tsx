import { Button } from "@shopify/polaris";
import { DataTableIcon, FileIcon } from "@shopify/polaris-icons";
import styles from "./ExportButtons.module.css";
import Papa from "papaparse";
import { pdf } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";

interface ExportButtonsProps {
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
}

export function ExportButtons({ headers, rows, fileName }: ExportButtonsProps) {
  const handleExportCSV = () => {
    const cleanHeaders = headers.map((h) => h);
    const cleanRows = rows.map((row) => row.map((cell) => cell.toString()));
    const csv = Papa.unparse({
      fields: cleanHeaders,
      data: cleanRows,
    });
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const cleanHeader = (header: string) =>
      header.replace(/^[^\w\d]+/, "").trim();
    const pdfHeaders = (headers?.slice(1) || []).map(cleanHeader);
    const pdfRows = rows?.map((row) => row.slice(1)) || [];
    const doc = <PDFDocument headers={pdfHeaders} rows={pdfRows} />;
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.exportButtons}>
      <Button icon={FileIcon} onClick={handleExportPdf} variant="secondary">
        PDF
      </Button>
      <Button
        icon={DataTableIcon}
        onClick={handleExportCSV}
        variant="secondary"
      >
        CSV
      </Button>
    </div>
  );
}
