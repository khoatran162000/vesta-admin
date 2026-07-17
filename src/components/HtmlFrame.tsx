// FILE: src/components/HtmlFrame.tsx
// Hiện HTML do GV/admin dán vào, CÁCH LY hoàn toàn khỏi giao diện portal.
// Lý do: HTML dán vào có thể là TRANG HOÀN CHỈNH (<!DOCTYPE><html><head><style>)
// chứa selector toàn cục (body, *, :root, table...). Nếu bơm thẳng vào trang bằng
// dangerouslySetInnerHTML, khối <style> đó sẽ áp cho CẢ portal → đổi nền, đổi font,
// đè biến màu. iframe srcDoc chặn đứng chuyện này.
"use client";
import { useEffect, useRef, useState } from "react";

const isFullDoc = (s: string) => /<!doctype|<html[\s>]/i.test(s || "");

// Trang hoàn chỉnh → giữ NGUYÊN, không đụng gì.
// Mảnh HTML rời → bọc khung tối thiểu cho chữ khớp portal (không thì ra Times New Roman).
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

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let ro: ResizeObserver | null = null;

    function measure() {
      try {
        const doc = iframe!.contentDocument;
        if (!doc?.body) return;
        const h = Math.max(doc.documentElement?.scrollHeight || 0, doc.body.scrollHeight || 0);
        if (h > 0) setHeight(h);
      } catch {}
    }
    function onLoad() {
      measure();
      try {
        const doc = iframe!.contentDocument;
        if (doc?.body && typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(measure);   // ảnh tải xong / co giãn → đo lại
          ro.observe(doc.body);
        }
      } catch {}
    }

    iframe.addEventListener("load", onLoad);
    return () => { iframe.removeEventListener("load", onLoad); ro?.disconnect(); };
  }, [html]);

  return (
    <iframe
      ref={ref}
      title="Nội dung"
      srcDoc={toDocument(html)}
      /* KHÔNG có allow-scripts → HTML dán vào không chạy được JS.
         allow-same-origin để trang cha đo được chiều cao thật (tự giãn, không cuộn trong khung). */
      sandbox="allow-same-origin"
      scrolling="no"
      className="w-full border-0 bg-white"
      style={{ height }}
    />
  );
}