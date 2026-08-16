// FILE: src/components/HtmlFrame.tsx
// Hiện HTML do GV/admin dán vào, CÁCH LY khỏi giao diện portal (iframe srcDoc).
// Tự giãn chiều cao; nếu nội dung RỘNG hơn khung thì cho CUỘN NGANG (không cắt mất chữ).
"use client";
import { useEffect, useRef, useState } from "react";
const isFullDoc = (s: string) => /<!doctype|<html[\s>]/i.test(s || "");
function toDocument(html: string) {
  if (isFullDoc(html)) return html;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:14px;line-height:1.65;color:#1a1a2e;}
  img,video{max-width:100%;height:auto;}
  table{max-width:100%;border-collapse:collapse;}
  td,th{overflow-wrap:anywhere;}
</style></head><body>${html}</body></html>`;
}
export default function HtmlFrame({ html, minHeight = 120 }: { html: string; minHeight?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let ro: ResizeObserver | null = null;
    function measure() {
      try {
        const doc = iframe!.contentDocument;
        if (!doc?.body) return;
        const h = Math.max(doc.documentElement?.scrollHeight || 0, doc.body.scrollHeight || 0);
        const w = Math.max(doc.documentElement?.scrollWidth || 0, doc.body.scrollWidth || 0);
        if (h > 0) setHeight(h);
        if (w > 0) setWidth(w);
      } catch {}
    }
    function onLoad() {
      measure();
      try {
        const doc = iframe!.contentDocument;
        if (doc?.body && typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(measure);
          ro.observe(doc.body);
        }
      } catch {}
    }
    iframe.addEventListener("load", onLoad);
    return () => { iframe.removeEventListener("load", onLoad); ro?.disconnect(); };
  }, [html]);
  return (
    <div className="w-full overflow-x-auto bg-white">
      <iframe
        ref={ref}
        title="Nội dung"
        srcDoc={toDocument(html)}
        sandbox="allow-same-origin"
        scrolling="no"
        className="border-0 bg-white"
        style={{ height, width: width > 0 ? width : "100%" }}
      />
    </div>
  );
}
