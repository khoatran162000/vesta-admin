"use client";
import { TeacherForm, emptyTeacher } from "@/components/teacher/TeacherForm";
export default function CreateTeacherPage() {
  return <TeacherForm initial={emptyTeacher()} mode="create" />;
}