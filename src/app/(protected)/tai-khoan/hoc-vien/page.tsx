// FILE: src/app/(protected)/tai-khoan/hoc-vien/page.tsx — Hoc vien
"use client";
import { UserList } from "@/components/users/UserList";
export default function StudentPage() {
  return <UserList role="STUDENT" roleLabel="Học viên" showImport={true} />;
}