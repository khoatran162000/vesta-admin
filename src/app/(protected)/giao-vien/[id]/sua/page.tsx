"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { TeacherForm, TeacherData } from "@/components/teacher/TeacherForm";

export default function EditTeacherPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TeacherData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      const res = await api.get(`/teachers/${id}`);
      if (res.success) {
        const t = res.data;
        setData({
          id: t.id, name: t.name || "", ma: t.ma || "", subtitle: t.subtitle || "",
          photoUrl: t.photoUrl || null,
          badges: Array.isArray(t.badges) && t.badges.length ? t.badges : [{ num: "", label: "" }],
          credentials: Array.isArray(t.credentials) && t.credentials.length ? t.credentials : [{ icon: "podium", text: "" }],
          orderIndex: t.orderIndex || 0, isPublished: !!t.isPublished,
        });
      } else setErr(res.message || "Không tải được");
    })();
  }, [id]);
  if (err) return <div className="mx-auto max-w-[820px] card text-sm text-red-600">{err}</div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  return <TeacherForm initial={data} mode="edit" />;
}