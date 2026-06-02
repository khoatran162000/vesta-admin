// FILE: src/app/(protected)/bai-viet/[id]/page.tsx — Chỉnh sửa bài viết
"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ImagePlus, X, Plus, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { api, getImageUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const data = await api.get(`/posts/admin/${id}`);
        if (data.success) {
          const post = data.data;
          setTitle(post.title);
          setExcerpt(post.excerpt || "");
          setContent(post.content);
          setStatus(post.status);
          setSlug(post.slug);
          setTags(Array.isArray(post.tags) ? post.tags : []);
          if (post.thumbnailUrl) {
            setThumbnailPreview(getImageUrl(post.thumbnailUrl));
          }
          setLoaded(true);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput("");
  }
  function removeTag(tag: string) { setTags(tags.filter((t) => t !== tag)); }
  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  }
  function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function removeThumbnail() {
    setNewThumbnailFile(null);
    setThumbnailPreview("");
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("excerpt", excerpt.trim());
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      formData.append("status", status);
      if (newThumbnailFile) formData.append("thumbnail", newThumbnailFile);
      // FormData cần raw fetch
      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        router.push("/bai-viet");
      } else {
        setError(data.message || "Lỗi cập nhật bài viết");
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-royal">Bài viết không tồn tại</h2>
          <p className="mt-2 text-muted">Bài viết với ID &quot;{id}&quot; không được tìm thấy.</p>
          <Link href="/bai-viet" className="btn-primary mt-4"><ArrowLeft size={16} />Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bai-viet" className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal"><ArrowLeft size={20} /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-royal">Chỉnh sửa bài viết</h2>
            <p className="text-xs text-muted">Slug: {slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-lg border border-silver/40 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
          </select>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary">
            <Save size={16} />{saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>

      {error && <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-6">
        <div className="card">
          <label className="mb-1.5 block text-sm font-medium text-royal">Tiêu đề bài viết <span className="text-red-500">*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-silver/40 bg-cream px-4 py-3 text-base outline-none focus:border-gold focus:ring-1 focus:ring-gold/30" />
        </div>

        <div className="card">
          <label className="mb-1.5 block text-sm font-medium text-royal">Mô tả ngắn (excerpt)</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="Tóm tắt nội dung..."
            className="w-full resize-none rounded-lg border border-silver/40 bg-cream px-4 py-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30" />
          <p className="mt-1 text-xs text-muted">{excerpt.length}/300 ký tự</p>
        </div>

        <div className="card">
          <label className="mb-1.5 block text-sm font-medium text-royal">Tags</label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-silver/40 bg-cream px-3 py-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-royal/10 px-3 py-1 text-xs font-semibold text-royal">
                {tag}<button onClick={() => removeTag(tag)} className="ml-0.5 rounded-full p-0.5 hover:bg-royal/20"><X size={12} /></button>
              </span>
            ))}
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
              placeholder="Thêm tag..." className="min-w-[120px] flex-1 border-none bg-transparent py-1 text-sm outline-none" />
            {tagInput.trim() && (
              <button onClick={addTag} className="rounded-full bg-gold/15 p-1.5 text-gold hover:bg-gold/25"><Plus size={14} /></button>
            )}
          </div>
        </div>

        <div className="card">
          <label className="mb-3 block text-sm font-medium text-royal">Ảnh đại diện (thumbnail)</label>
          {thumbnailPreview ? (
            <div className="relative inline-block">
              <img src={thumbnailPreview} alt="Thumbnail" className="h-48 rounded-lg object-cover shadow-sm" />
              <button onClick={removeThumbnail}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:scale-110"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => thumbnailInputRef.current?.click()}
              className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-silver/40 bg-cream hover:border-gold/40 hover:bg-gold/5">
              <div className="text-center">
                <ImagePlus size={32} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-medium text-muted">Bấm để chọn ảnh thumbnail</p>
              </div>
            </button>
          )}
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
        </div>

        <div className="card">
          <label className="mb-3 block text-sm font-medium text-royal">Nội dung bài viết</label>
          {loaded && <RichTextEditor content={content} onChange={setContent} />}
        </div>
      </div>
    </div>
  );
}
