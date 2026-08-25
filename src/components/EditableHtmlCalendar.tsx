// FILE: src/components/EditableHtmlCalendar.tsx — Lịch HTML: dùng localStorage thật (allow-same-origin) + đồng bộ server
"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Check, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

// App lịch đọc localStorage trực tiếp -> iframe phải có allow-same-origin (nếu không sẽ throw SecurityError).
// Shim: nạp dữ liệu server vào localStorage thật (chỉ key "vesta*"), rồi bọc Storage.prototype để đồng bộ ngược về server.
function injectShim(template: string, store: Record<string, string>) {
  const seedJson = JSON.stringify(store || {}).replace(/<\/(script)/gi, "<\\/$1");
  const shim = `<script>
(function(){
  var SEED = ${seedJson};
  function isApp(k){ return /^vesta/i.test(String(k)); }
  try { Object.keys(SEED).forEach(function(k){ if(isApp(k)){ try{ localStorage.setItem(k, SEED[k]); }catch(e){} } }); } catch(e){}
  function snap(){ var o={}; try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(isApp(k)) o[k]=localStorage.getItem(k); } }catch(e){} return o; }
  var t=null;
  function sync(){ if(t)clearTimeout(t); t=setTimeout(function(){ try{ parent.postMessage({__lscal:true, store:snap()}, "*"); }catch(e){} }, 300); }
  try {
    ["setItem","removeItem","clear"].forEach(function(m){
      var orig = Storage.prototype[m];
      Storage.prototype[m] = function(){ var r = orig.apply(this, arguments); try{ if(this===window.localStorage) sync(); }catch(e){} return r; };
    });
  } catch(e){}
})();
</script>`;
  if (/<head[^>]*>/i.test(template)) return template.replace(/<head[^>]*>/i, function (m) { return m + shim; });
  if (/<html[^>]*>/i.test(template)) return template.replace(/<html[^>]*>/i, function (m) { return m + shim; });
  return shim + template;
}

type Props = {
  dataEndpoint: string;
  templateKey?: string;
  initialTemplate?: string;
  emptyHint?: string;
};

export default function EditableHtmlCalendar({ dataEndpoint, templateKey, initialTemplate, emptyHint }: Props) {
  const [tpl, setTpl] = useState<string | null | undefined>(undefined);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [nonce, setNonce] = useState(0);
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
    if (!confirm("Xóa toàn bộ dữ liệu lịch đã lưu và bắt đầu lại từ mẫu trống?\n(Dùng khi lịch không hiện / bị lỗi. Không hoàn tác được.)")) return;
    try {
      try {
        const rm: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && /^vesta/i.test(k)) rm.push(k);
        }
        rm.forEach((k) => window.localStorage.removeItem(k));
      } catch {}
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
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"
        className="w-full flex-1 rounded-lg border border-gray-200"
      />
    </div>
  );
}
