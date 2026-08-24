// FILE: src/app/(protected)/lich-ca-nhan/page.tsx — Lịch cá nhân (chỉ ADMIN; gõ + tự lưu server)
"use client";
import EditableHtmlCalendar from "@/components/EditableHtmlCalendar";
import { useAuth } from "@/hooks/useAuth";

export default function LichCaNhanPage() {
  const { user } = useAuth();

  if (user && user.role !== "ADMIN")
    return (
      <div className="mx-auto max-w-[600px] py-20 text-center text-gray-500">
        <h2 className="mb-2 font-display text-2xl font-bold text-royal">Lịch cá nhân</h2>
        <p>Trang này chỉ dành cho quản trị.</p>
      </div>
    );

  return (
    <EditableHtmlCalendar
      templateKey="schedule_personal_html"
      dataEndpoint="/personal-calendar"
      emptyHint="Chưa có mẫu lịch. Vào Nội dung trang chủ → Lịch cá nhân (dán HTML) để dán app lịch, rồi quay lại đây gõ & lưu ạ."
    />
  );
}
