// FILE: src/app/(protected)/lich-ca-nhan/page.tsx — Lịch cá nhân (gõ trực tiếp, tự lưu server, chỉ chủ TK)
"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Chèn "cầu nối": thay localStorage bằng bản đồng bộ về server (giữ iframe cách ly).
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
  if (/<head[^>]*>/i.test(template)) return template.replace(/<head[^>]*>/i, function(m){ return m + shim; });
  if (/<html[^>]*>/i.test(template)) return template.replace(/<html[^>]*>/i, function(m){ return m + shim; });
  return shim + template;
}

export default function LichCaNhanPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tpl, setTpl] = useState<string | null | undefined>(undefined);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const storeRef = useRef<Record<string, string>>({});
  const timerRef = useRef<any>(null);

  // Nạp mẫu HTML (dán ở CMS) + dữ liệu lịch của chính mình
  useEffect(() => {
    if (user && !isAdmin) return;
    if (!user) return;
    (async () => {
      try {
        const [tplRes, dataRes] = await Promise.all([
          api.get("/site-content/schedule_personal_html").catch(() => null),
          api.get("/personal-calendar").catch(() => null),
        ]);
        const template = (tplRes as any)?.data?.data?.html || "";
        const store = (dataRes as any)?.data?.store || {};
        storeRef.current = store;
        setTpl(template || null);
        if (template) setSrcDoc(injectShim(template, store));
      } catch {
        setTpl(null);
      }
    })();
  }, [user, isAdmin]);

  // Nhận thay đổi từ iframe → debounce lưu server
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d: any = e.data;
      if (d && d.__lscal && d.store) {
        storeRef.current = d.store;
        setSaveState("saving");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          try {
            await api.put("/personal-calendar", { store: storeRef.current });
            setSaveState("saved");
          } catch {
            setSaveState("idle");
          }
        }, 800);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  if (user && !isAdmin)
    return (
      <div className="mx-auto max-w-[600px] py-20 text-center text-gray-500">
        <h2 className="mb-2 font-display text-2xl font-bold text-royal">Lịch cá nhân</h2>
        <p>Trang này chỉ dành cho quản trị.</p>
      </div>
    );

  if (tpl === undefined)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal" size={26} /></div>;

  if (!tpl)
    return (
      <div className="mx-auto max-w-[720px] py-16 text-center text-gray-500">
        <h2 className="mb-2 font-display text-2xl font-bold text-royal">Lịch cá nhân</h2>
        <p>Chưa có mẫu lịch. Vào <b>Nội dung trang chủ → Lịch cá nhân (dán HTML)</b> để dán app lịch, rồi quay lại đây gõ &amp; lưu ạ.</p>
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-center justify-end gap-2 py-1.5 text-xs">
        {saveState === "saving" && <span className="flex items-center gap-1 text-amber-600"><Save size={13} /> Đang lưu…</span>}
        {saveState === "saved" && <span className="flex items-center gap-1 text-green-600"><Check size={13} /> Đã lưu</span>}
      </div>
      <iframe title="lich-ca-nhan" srcDoc={srcDoc} sandbox="allow-scripts allow-popups" className="w-full flex-1 rounded-lg border border-gray-200" />
    </div>
  );
}
