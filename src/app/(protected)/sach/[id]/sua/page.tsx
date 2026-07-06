"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { BookForm, BookData } from "@/components/book/BookForm";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BookData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      const res = await api.get(`/books/${id}`);
      if (res.success) {
        const b = res.data;
        setData({ id: b.id, title: b.title || "", price: b.price || "", highlight: !!b.highlight, orderIndex: b.orderIndex || 0, isPublished: !!b.isPublished });
      } else setErr(res.message || "Không tải được");
    })();
  }, [id]);
  if (err) return <div className="mx-auto max-w-[640px] card text-sm text-red-600">{err}</div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  return <BookForm initial={data} mode="edit" />;
}