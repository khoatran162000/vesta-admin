"use client";
import { CourseForm, emptyCourse } from "@/components/course/CourseForm";
export default function CreateCoursePage() {
  return <CourseForm initial={emptyCourse()} mode="create" />;
}