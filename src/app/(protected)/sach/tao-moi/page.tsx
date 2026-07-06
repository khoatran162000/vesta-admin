"use client";
import { BookForm, emptyBook } from "@/components/book/BookForm";
export default function CreateBookPage() {
  return <BookForm initial={emptyBook()} mode="create" />;
}