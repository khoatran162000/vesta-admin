// FILE: src/components/EditableHtmlCalendar.tsx — Lịch HTML dán vào: gõ trực tiếp + tự lưu server + in PDF + làm mới
"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Check, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

// Chèn "cầu nối": thay localStorage bằng bản đồng bộ về server (iframe vẫn cách ly)
function injectShim(template: string, store: Record<string, string>) {
  const seedJson = JSON.stringify(store || {}).replace(/<\/(script)/gi, "<\\/$1");
  const shim = `<script>
(function(){
  var store = ${seedJson};
  function emit(){ try{ parent.postMessage({ __lscal: true, store: store }, "*"); }catch(e){} }
  var fake = {
    getItem: function(k){ k=String(k); return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null; },
    setItem: function(k,v){ store[String(k)]=String(v); emit(); },
    removeItem: function(k){ delete store[String(k)]; emit(); },
    clear: function(){ Object.keys(store).forEach(function(k){ delete store[k]; }); emit(); },
    key: function(i){ return Object.keys(store)[i] || null; }
  };
  try{ Object.defineProperty(fake,"length",{ get:function(){ return Object.keys(store).length; } }); }catch(e){}
  try{ Object.defineProperty(window,"localStorage",{ configurable:true, value: fake }); }
  catch(e){ try{ window.localStorage = fake; }catch(_){} }
})();
</script>`;
  if (/<head[^>]*>/i.test(template)) return template.replace(/<head[^>]*>/i, function (m) { return m + shim; });
  if (/<html[^>]*>/i.test(template)) return template.replace(/<html[^>]*>/i, function (m) { return m + shim; });
  return shim + template;
}

type Props = {
  dataEndpoint: string;        // "/personal-calendar" | "/work-calendar"
  templateKey?: string;
  initialTemplate?: string;
  emptyHint?: string;
};

export default function EditableHtmlCalendar({ dataEndpoint, templateKey, initialTemplate, emptyHint }: Props) {
  const [tpl, setTpl] = useState<string | null | undefined>(undefined);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [nonce, setNonce] = useState(0); // đổi để buộc iframe nạp lại
  const storeRef = useRef<Record<string, string>>({});
  const tplRef = useRef<string>("");
  const timerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        let template = initialTemplate || "";
        if (!template && templateKey) {
          const tplRes = await api.get(`/site-content/${templateKey}`).catch(() => null);
          template = (tplRes as any)?.data?.data?.html || "";
        }
        const dataRes = await api.get(dataEndpoint).catch(() => null);
        const store = (dataRes as any)?.data?.store || {};
        storeRef.current = store;
        tplRef.current = template;
        setTpl(template || null);
        if (template) setSrcDoc(injectShim(template, store));
      } catch {
        setTpl(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataEndpoint, templateKey, initialTemplate]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d: any = e.data;
      if (d && d.__lscal && d.store) {
        storeRef.current = d.store;
        setSaveState("saving");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          try {
            await api.put(dataEndpoint, { store: storeRef.current });
            setSaveState("saved");
          } catch {
            setSaveState("idle");
          }
        }, 800);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [dataEndpoint]);

  async function handleReset() {
    if (!confirm("Xóa toàn bộ dữ liệu lịch đã lưu và bắt đầu lại từ mẫu trống?\n(Dùng khi lịch không hiện / bị lỗi. Thao tác này không hoàn tác được.)")) return;
    try {
      await api.put(dataEndpoint, { store: {} });
      storeRef.current = {};
      setSrcDoc(injectShim(tplRef.current || "", {}));
      setNonce((n) => n + 1);
      setSaveState("saved");
    } catch {
      alert("Không xóa được, thử lại giúp em nhé.");
    }
  }

  if (tpl === undefined)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal" size={26} /></div>;

  if (!tpl)
    return (
      <div className="mx-auto max-w-[720px] py-16 text-center text-gray-500">
        <p>{emptyHint || "Chưa có mẫu lịch. Vào Nội dung trang chủ để dán HTML, rồi quay lại đây gõ & lưu."}</p>
      </div>
    );

  if (!srcDoc)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal" size={26} /></div>;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-center justify-end gap-3 py-1.5 text-xs">
        {saveState === "saving" && <span className="flex items-center gap-1 text-amber-600"><Save size={13} /> Đang lưu…</span>}
        {saveState === "saved" && <span className="flex items-center gap-1 text-green-600"><Check size={13} /> Đã lưu</span>}
        <button
          onClick={handleReset}
          title="Xóa dữ liệu đã lưu, nạp lại mẫu trống (dùng khi lịch không hiện)"
          className="flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <RotateCcw size={12} /> Làm mới
        </button>
      </div>
      <iframe
        key={nonce}
        title="calendar"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-popups allow-modals allow-forms"
        className="w-full flex-1 rounded-lg border border-gray-200"
      />
    </div>
  );
}
