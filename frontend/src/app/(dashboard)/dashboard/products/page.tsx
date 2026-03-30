"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Package, ToggleLeft, ToggleRight, ImagePlus } from "lucide-react";

const BACKEND_URL = "http://localhost:3001";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  pointsValue: number;
  stockQuantity: number;
  isActive: boolean;
  sizes: string[];
  imageUrl?: string;
  category: Category;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  pointsValue: string;
  stockQuantity: string;
  categoryId: string;
  sizes: string[];
  isActive: boolean;
}

const ALL_SIZES = ["PP", "P", "M", "G", "GG", "XG", "G2", "G3"];

const emptyForm: FormData = {
  name: "",
  description: "",
  price: "",
  pointsValue: "",
  stockQuantity: "",
  categoryId: "",
  sizes: [],
  isActive: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchData() {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      pointsValue: p.pointsValue.toString(),
      stockQuantity: p.stockQuantity.toString(),
      categoryId: p.category?.id || "",
      sizes: p.sizes || [],
      isActive: p.isActive,
    });
    setImageFile(null);
    setImagePreview(p.imageUrl ? `${BACKEND_URL}${p.imageUrl}` : "");
    setRemoveImage(false);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setError("");
  }

  function setField(key: keyof FormData, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("Preço inválido."); return; }
    if (!form.stockQuantity || isNaN(Number(form.stockQuantity))) { setError("Estoque inválido."); return; }
    if (!form.categoryId) { setError("Selecione uma categoria."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        pointsValue: parseInt(form.pointsValue || "0"),
        stockQuantity: parseInt(form.stockQuantity),
        categoryId: form.categoryId,
        sizes: form.sizes.length > 0 ? form.sizes : undefined,
        isActive: form.isActive,
      };

      let savedProduct: Product;
      if (editing) {
        const res = await api.patch(`/products/${editing.id}`, payload);
        savedProduct = res.data;
      } else {
        const res = await api.post("/products", payload);
        savedProduct = res.data;
      }

      // Remove imagem se solicitado
      if (removeImage && editing) {
        await api.delete(`/products/${savedProduct.id}/image`);
      }

      // Upload da nova imagem se selecionada
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api.post(`/products/${savedProduct.id}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await fetchData();
      closeModal();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Gestão</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Produtos</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie o catálogo de produtos da sua loja.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
          <Package size={32} strokeWidth={1} />
          <p className="text-sm">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-3 font-normal">Produto</th>
                <th className="text-left px-6 py-3 font-normal">Categoria</th>
                <th className="text-right px-6 py-3 font-normal">Preço</th>
                <th className="text-right px-6 py-3 font-normal">Estoque</th>
                <th className="text-right px-6 py-3 font-normal">Pontos</th>
                <th className="text-left px-6 py-3 font-normal">Tamanhos</th>
                <th className="text-center px-6 py-3 font-normal">Status</th>
                <th className="text-right px-6 py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <div className="w-10 h-10 relative flex-shrink-0 bg-white/5">
                          <Image
                            src={`${BACKEND_URL}${p.imageUrl}`}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-white/20" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-white/30 text-xs mt-0.5 truncate max-w-[180px]">{p.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/50">{p.category?.name || "—"}</td>
                  <td className="px-6 py-4 text-right">R$ {parseFloat(p.price as unknown as string).toFixed(2).replace(".", ",")}</td>
                  <td className="px-6 py-4 text-right">{p.stockQuantity}</td>
                  <td className="px-6 py-4 text-right text-accent">{p.pointsValue}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.sizes?.length > 0
                        ? p.sizes.map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 border border-white/10 text-white/50">{s}</span>
                          ))
                        : <span className="text-white/20 text-xs">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 ${p.isActive ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/30"}`}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-white/40 hover:text-white transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-lg p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">
                {editing ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imagem */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Foto do Produto</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer border border-dashed border-white/10 hover:border-accent/40 transition-colors flex items-center justify-center h-36 bg-white/[0.02]"
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="preview" fill className="object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      <ImagePlus size={24} strokeWidth={1} />
                      <span className="text-xs">Clique para selecionar</span>
                      <span className="text-[10px]">JPEG, PNG ou WEBP · máx. 5MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(""); setRemoveImage(true); }}
                    className="text-xs text-white/30 hover:text-red-400 mt-1 transition-colors"
                  >
                    Remover imagem
                  </button>
                )}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="Nome do produto"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 resize-none"
                  placeholder="Descrição opcional"
                />
              </div>

              {/* Preço + Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Preço (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Estoque *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setField("stockQuantity", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Pontos + Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Pontos</label>
                  <input
                    type="number"
                    min="0"
                    value={form.pointsValue}
                    onChange={(e) => setField("pointsValue", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Categoria *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50"
                  >
                    <option value="">Selecionar...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tamanhos */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Tamanhos disponíveis</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const selected = form.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setField(
                            "sizes",
                            selected
                              ? form.sizes.filter((s) => s !== size)
                              : [...form.sizes, size]
                          )
                        }
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          selected
                            ? "border-accent text-accent bg-accent/5"
                            : "border-white/10 text-white/40 hover:border-white/30"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ativo */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white/50">Produto ativo</span>
                <button
                  type="button"
                  onClick={() => setField("isActive", !form.isActive)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {form.isActive
                    ? <ToggleRight size={28} className="text-accent" />
                    : <ToggleLeft size={28} />
                  }
                </button>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
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
                className="flex-1 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
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
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Excluir produto?</h2>
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
