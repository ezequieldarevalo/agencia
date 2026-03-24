"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

export interface DealershipInfo {
  name: string;
  logoUrl?: string | null;
  cuit?: string | null;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  city?: string | null;
  province?: string | null;
}

interface DocumentRendererProps {
  content: string;
  dealership?: DealershipInfo | null;
  className?: string;
}

/** Sanitize HTML — allow safe tags + styles for document formatting */
function sanitize(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u",
      "s", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "img", "blockquote", "a", "sub", "sup",
    ],
    ALLOWED_ATTR: ["style", "src", "alt", "href", "target", "class", "width", "height", "colspan", "rowspan"],
  });
}

export function DocumentRenderer({ content, dealership, className = "" }: DocumentRendererProps) {
  const sanitizedContent = useMemo(() => sanitize(content), [content]);

  return (
    <div className={`bg-white text-gray-900 ${className}`} style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Company Header */}
      {dealership && (
        <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {dealership.logoUrl && (
              <img src={dealership.logoUrl} alt="" style={{ height: 56, width: "auto", objectFit: "contain", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0, letterSpacing: "0.05em" }}>{dealership.name}</h1>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                {(dealership.street || dealership.city) && (
                  <p style={{ margin: "2px 0" }}>{[dealership.street, dealership.streetNumber, dealership.city, dealership.province].filter(Boolean).join(", ")}</p>
                )}
                <p style={{ margin: "2px 0" }}>
                  {dealership.phone && <span>Tel: {dealership.phone} &nbsp;&nbsp;</span>}
                  {dealership.email && <span>{dealership.email} &nbsp;&nbsp;</span>}
                  {dealership.cuit && <span>CUIT: {dealership.cuit}</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML Content */}
      <div
        className="document-body"
        style={{ fontSize: 13, lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generatePrintHTML(content: string, title: string, dealership?: DealershipInfo | null): string {
  const addressParts = [dealership?.street, dealership?.streetNumber, dealership?.city, dealership?.province].filter(Boolean);

  const headerHTML = dealership
    ? `
    <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 16px;">
      ${dealership.logoUrl ? `<img src="${escapeHtml(dealership.logoUrl)}" alt="" style="height: 56px; width: auto; object-fit: contain;" />` : ""}
      <div>
        <h1 style="font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 0.05em;">${escapeHtml(dealership.name)}</h1>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          ${addressParts.length ? `<p style="margin: 2px 0;">${escapeHtml(addressParts.join(", "))}</p>` : ""}
          <p style="margin: 2px 0;">
            ${dealership.phone ? `Tel: ${escapeHtml(dealership.phone)} &nbsp;&nbsp;` : ""}
            ${dealership.email ? escapeHtml(dealership.email) + " &nbsp;&nbsp;" : ""}
            ${dealership.cuit ? `CUIT: ${escapeHtml(dealership.cuit)}` : ""}
          </p>
        </div>
      </div>
    </div>
  `
    : "";

  // Content is already HTML — just sanitize for print
  const safeContent = typeof window !== "undefined" ? sanitize(content) : content;

  return `<!DOCTYPE html>
<html><head>
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 { margin: 0.5em 0 0.3em; }
    h2 { font-size: 18px; }
    h3 { font-size: 15px; }
    p { margin: 0.3em 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
    th { background: #f5f5f5; font-weight: bold; }
    hr { border: none; border-top: 1px solid #999; margin: 16px 0; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #ccc; padding-left: 12px; margin: 12px 0; color: #555; }
    .signature-line { margin-top: 48px; display: inline-block; border-bottom: 1px solid #333; min-width: 200px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head><body>
  ${headerHTML}
  ${safeContent}
</body></html>`;
}
