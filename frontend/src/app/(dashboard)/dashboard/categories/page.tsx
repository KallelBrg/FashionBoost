"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchCategories() {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setError("");
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}`, { name: name.trim() });
      } else {
        await api.post("/categories", { name: name.trim() });
      }
      await fetchCategories();
      closeModal();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-1">Gestão</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Categorias</h1>
          <p className="text-white/40 text-sm mt-1">Organize seus produtos por categoria.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2.5 text-sm font-medium hover:bg-[#c4a030] transition-colors"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
          <Tag size={32} strokeWidth={1} />
          <p className="text-sm">Nenhuma categoria cadastrada.</p>
        </div>
      ) : (
        <div className="border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-3 font-normal">Nome</th>
                <th className="text-right px-6 py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 text-white/40 hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">
                {editing ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Ex: Camisetas, Calças..."
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#D4AF37] text-black px-4 py-2.5 text-sm font-medium hover:bg-[#c4a030] transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm p-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Excluir categoria?</h2>
            <p className="text-white/40 text-sm mb-8">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 text-sm hover:bg-red-500/20 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
