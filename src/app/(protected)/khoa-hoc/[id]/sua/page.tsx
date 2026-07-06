"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CourseForm, CourseData } from "@/components/course/CourseForm";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CourseData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      const res = await api.get(`/courses/${id}`);
      if (res.success) {
        const c = res.data;
        setData({
          id: c.id, cardType: c.cardType || "FULL",
          title: c.title || "", badge: c.badge || "",
          isSpecial: !!c.isSpecial, badgeOutline: !!c.badgeOutline,
          features: Array.isArray(c.features) && c.features.length ? c.features : [{ icon: "🎯", text: "" }],
          commitment: c.commitment || "", scheduleLabel: c.scheduleLabel || "", schedule: c.schedule || "",
          price: c.price || "", onlinePrice: c.onlinePrice || "", cta: c.cta || "",
          specialPrice: c.specialPrice || "", originalPrice: c.originalPrice || "",
          orderIndex: c.orderIndex || 0, isPublished: !!c.isPublished,
        });
      } else setErr(res.message || "Không tải được");
    })();
  }, [id]);
  if (err) return <div className="mx-auto max-w-[820px] card text-sm text-red-600">{err}</div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  return <CourseForm initial={data} mode="edit" />;
}