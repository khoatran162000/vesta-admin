"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Category {
  id: string; name: string; description: string | null; parentId: string | null;
  children: Category[]; _count: { exams: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [flatList, setFlatList] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [tree, flat] = await Promise.all([api.get("/categories"), api.get("/categories/flat")]);
      if (tree.success) setCategories(tree.data);
      if (flat.success) setFlatList(flat.data.map((c: any) => ({ id: c.id, name: c.name })));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate(pId = "") { setEditId(null); setName(""); setDescription(""); setParentId(pId); setShowForm(true); }
  function openEdit(cat: Category) { setEditId(cat.id); setName(cat.name); setDescription(cat.description || ""); setParentId(cat.parentId || ""); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body = { name, description, parentId: parentId || null };
      const data = editId ? await api.put(`/categories/${editId}`, body) : await api.post("/categories", body);
      if (data.success) { setShowForm(false); fetchData(); }
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    const data = await api.delete(`/categories/${id}`);
    if (data.success) { setDeleteId(null); fetchData(); } else { alert(data.message); setDeleteId(null); }
  }

  function renderTree(cats: Category[], depth = 0) {
    return cats.map((cat) => (
      <div key={cat.id}>
        <div className="flex items-center justify-between border-b border-silver/10 px-5 py-3 hover:bg-cream/50"
          style={{ paddingLeft: `${1.25 + depth * 1.5}rem` }}>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-gold" />
            <span className="font-medium text-[#1a1a2e]">{cat.name}</span>
            <span className="text-xs text-muted">({cat._count.exams} đề thi)</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => openCreate(cat.id)} title="Thêm con" className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Plus size={14} /></button>
            <button onClick={() => openEdit(cat)} title="Sửa" className="rounded-lg p-1.5 text-muted hover:bg-cream-dark hover:text-royal"><Pencil size={14} /></button>
            <button onClick={() => setDeleteId(cat.id)} title="Xoá" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        </div>
        {cat.children?.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-royal">Danh mục đề thi</h2>
        <button onClick={() => openCreate()} className="btn-primary"><Plus size={15} />Tạo danh mục</button>
      </div>
      <div className="card !p-0 overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gold" /></div>
          : categories.length === 0 ? <p className="py-12 text-center text-muted">Chưa có danh mục nào.</p>
          : renderTree(categories)}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <form onSubmit={handleSave} className="w-full max-w-md card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">{editId ? "Sửa" : "Tạo"} danh mục</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục *" required className="input-field" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả (tuỳ chọn)" rows={2} className="input-field" />
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input-field">
              <option value="">— Không có danh mục cha (root) —</option>
              {flatList.filter((c) => c.id !== editId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Huỷ</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-sm card space-y-4">
            <h3 className="font-display text-xl font-bold text-royal">Xoá danh mục?</h3>
            <p className="text-sm text-muted">Không thể xoá nếu đang có danh mục con hoặc đề thi.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Huỷ</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
