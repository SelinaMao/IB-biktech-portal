import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

import { palette } from "@/theme/palette";
import { TransactionDetailsContent } from "../components/TransactionDetails";
import type { TTransactionDetailResponse } from "../account.types";

const LOGO_SRC = "/branding/logo-gold.png";
const GOLD = palette.primary[400];

async function toDataUrl(src: string): Promise<string> {
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function ReceiptTemplate({ transaction, logoSrc }: { transaction: TTransactionDetailResponse; logoSrc: string }) {
  return (
    <div
      style={{
        width: 800,
        minHeight: 1120,
        boxSizing: "border-box",
        background: "#ffffff",
        padding: "56px 64px",
        display: "flex",
        flexDirection: "column",
        color: "#1a1a1a",
      }}
    >
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={96} height={96} alt="" style={{ display: "block" }} />
        <div style={{ marginTop: 24, color: GOLD, fontWeight: 700, fontSize: 20 }}>
          លម្អិតប្រតិបត្តិការ
        </div>
        <div style={{ marginTop: 4, color: GOLD, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
          TRANSACTION DETAILS
        </div>
      </div>

      <div style={{ padding: "16px 0" }}>
        <TransactionDetailsContent transaction={transaction} fromLabel="From Account" toLabel="To Account" />
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 48,
          fontSize: 10,
          lineHeight: 1.6,
          color: palette.slate[400],
        }}
      >
        DISCLAIMER: This document is for informational purpose only and cannot be used as an official proof of financial statement unless affirmed by the bank representative with seal and signature. The Bank is not responsible for any losses or damages whether direct or indirect, which may arise from use of this information/document.

      </div>
    </div>
  );
}

/** Renders the transaction receipt entirely on the client (no API call) and
 *  returns it as a PDF blob, ready for `downloadBlob`. */
export async function generateTransactionReceiptPdf(transaction: TTransactionDetailResponse): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }, logoSrc] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
    toDataUrl(LOGO_SRC),
  ]);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-10000px";
  document.body.appendChild(container);

  const root = createRoot(container);
  try {
    flushSync(() => {
      root.render(<ReceiptTemplate transaction={transaction} logoSrc={logoSrc} />);
    });

    const target = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    return pdf.output("blob");
  } finally {
    root.unmount();
    container.remove();
  }
}
