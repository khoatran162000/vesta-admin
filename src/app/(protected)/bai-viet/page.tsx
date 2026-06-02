// FILE: src/app/(protected)/bai-viet/page.tsx — Danh sách bài viết Blog
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, Search, Filter, Loader2 } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  status: string;
  createdAt: string;
  author: { fullName: string };
}

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3000";

export default function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await api.get(`/posts/admin/all?${params}`);
      if (data.success) {
        setPosts(data.data);
        setTotal(data.meta?.total || 0);
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const data = await api.delete(`/posts/${id}`);
      if (data.success) {
        setDeleteId(null);
        fetchPosts();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Lỗi kết nối server");
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(s: string) {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-royal">Bài viết Blog</h2>
          <p className="mt-1 text-sm text-muted">{total} bài viết</p>
        </div>
        <Link href="/bai-viet/tao-moi" className="btn-primary">
          <Plus size={16} />Tạo bài viết
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc tag..."
            className="w-full rounded-lg border border-silver/40 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30" />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-silver/40 bg-white px-3">
          <Filter size={14} className="text-muted" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border-none bg-transparent py-2.5 text-sm outline-none">
            <option value="ALL">Tất cả</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-silver/30 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-silver/20 bg-cream">
                <th className="px-5 py-3.5 font-semibold text-royal">Bài viết</th>
                <th className="hidden px-5 py-3.5 font-semibold text-royal md:table-cell">Tags</th>
                <th className="px-5 py-3.5 font-semibold text-royal">Trạng thái</th>
                <th className="hidden px-5 py-3.5 font-semibold text-royal sm:table-cell">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right font-semibold text-royal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-silver/10 hover:bg-cream/50">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {post.thumbnailUrl && (
                        <img src={getImageUrl(post.thumbnailUrl)}
                          alt="" className="hidden h-12 w-20 shrink-0 rounded-lg object-cover sm:block" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#1a1a2e] line-clamp-1">{post.title}</p>
                        <p className="mt-0.5 text-xs text-muted line-clamp-1">{post.excerpt || "Chưa có mô tả"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(post.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-royal/8 px-2 py-0.5 text-[0.65rem] font-semibold text-royal">{tag}</span>
                      ))}
                      {(post.tags || []).length > 2 && <span className="text-[0.65rem] text-muted">+{post.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${post.status === "PUBLISHED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {post.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <p className="text-sm text-[#1a1a2e]">{formatDate(post.createdAt)}</p>
                    <p className="text-xs text-muted">{post.author?.fullName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "PUBLISHED" && (
                        <a href={`${LANDING_URL}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal" title="Xem trên website">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <Link href={`/bai-viet/${post.id}`}
                        className="rounded-lg p-2 text-muted hover:bg-cream-dark hover:text-royal" title="Chỉnh sửa">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => setDeleteId(post.id)}
                        className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" title="Xoá">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && posts.length === 0 && (
          <div className="px-5 py-16 text-center text-muted">
            {search || statusFilter !== "ALL" ? "Không tìm thấy bài viết phù hợp." : 'Chưa có bài viết nào. Bấm "Tạo bài viết" để bắt đầu.'}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold text-royal">Xác nhận xoá</h3>
            <p className="mt-2 text-sm text-muted">
              Bạn có chắc muốn xoá bài viết <strong className="text-[#1a1a2e]">
                &quot;{posts.find((p) => p.id === deleteId)?.title}&quot;
              </strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="btn-secondary">Huỷ</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="btn-danger">
                {deleting ? "Đang xoá..." : "Xoá bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
