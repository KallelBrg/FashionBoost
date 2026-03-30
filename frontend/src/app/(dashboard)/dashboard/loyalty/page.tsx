"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Award } from "lucide-react";

interface LoyaltyLevel {
  id: string;
  name: string;
  minimumPoints: number;
  benefitsDescription?: string;
}

interface FormData {
  name: string;
  minimumPoints: string;
  benefitsDescription: string;
}

const emptyForm: FormData = { name: "", minimumPoints: "", benefitsDescription: "" };

export default function LoyaltyPage() {
  const [levels, setLevels] = useState<LoyaltyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyLevel | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchLevels() {
    try {
      const res = await api.get("/loyalty-levels");
      const sorted = [...res.data].sort((a: LoyaltyLevel, b: LoyaltyLevel) => a.minimumPoints - b.minimumPoints);
      setLevels(sorted);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLevels(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(level: LoyaltyLevel) {
    setEditing(level);
    setForm({
      name: level.name,
      minimumPoints: level.minimumPoints.toString(),
      benefitsDescription: level.benefitsDescription || "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.minimumPoints || isNaN(Number(form.minimumPoints))) { setError("Mínimo de pontos inválido."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        minimumPoints: parseInt(form.minimumPoints),
        benefitsDescription: form.benefitsDescription.trim() || undefined,
      };

      if (editing) {
        await api.patch(`/loyalty-levels/${editing.id}`, payload);
      } else {
        await api.post("/loyalty-levels", payload);
      }
      await fetchLevels();
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/loyalty-levels/${id}`);
      setLevels((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeleteId(null);
    }
  }

  // Cores dos níveis por posição
  const levelColors = [
    { bg: "bg-amber-900/20", border: "border-amber-700/30", text: "text-amber-600", label: "Bronze" },
    { bg: "bg-slate-400/10", border: "border-slate-400/30", text: "text-slate-400", label: "Prata" },
    { bg: "bg-accent/10", border: "border-accent/30", text: "text-accent", label: "Ouro" },
    { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", label: "Diamante" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Gamificação</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Níveis de Fidelidade</h1>
          <p className="text-white/40 text-sm mt-1">Configure os níveis que seus clientes podem alcançar.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Novo Nível
        </button>
      </div>

      {/* Levels */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : levels.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
          <Award size={32} strokeWidth={1} />
          <p className="text-sm">Nenhum nível cadastrado.</p>
          <p className="text-xs text-white/20">Crie níveis como Bronze, Prata e Ouro para engajar seus clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {levels.map((level, index) => {
            const color = levelColors[index] ?? levelColors[levelColors.length - 1];
            return (
              <div
                key={level.id}
                className={`border ${color.border} ${color.bg} p-6 relative`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Award size={20} strokeWidth={1.5} className={color.text} />
                    <h3 className={`font-[family-name:var(--font-playfair)] text-lg font-bold ${color.text}`}>
                      {level.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(level)}
                      className="p-1.5 text-white/30 hover:text-white transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteId(level.id)}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Mínimo de pontos</p>
                  <p className={`text-2xl font-bold font-[family-name:var(--font-playfair)] ${color.text}`}>
                    {level.minimumPoints.toLocaleString("pt-BR")}
                    <span className="text-sm font-normal text-white/30 ml-1">pts</span>
                  </p>
                </div>

                {level.benefitsDescription && (
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Benefícios</p>
                    <p className="text-sm text-white/60 leading-relaxed">{level.benefitsDescription}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">
                {editing ? "Editar Nível" : "Novo Nível"}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="Ex: Bronze, Prata, Ouro..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Mínimo de Pontos *</label>
                <input
                  type="number"
                  min="0"
                  value={form.minimumPoints}
                  onChange={(e) => setForm((p) => ({ ...p, minimumPoints: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="Ex: 0, 500, 1000..."
                />
                <p className="text-white/20 text-xs mt-1">Pontos mínimos para atingir este nível.</p>
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Benefícios</label>
                <textarea
                  value={form.benefitsDescription}
                  onChange={(e) => setForm((p) => ({ ...p, benefitsDescription: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 resize-none"
                  placeholder="Descreva os benefícios deste nível..."
                />
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
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Excluir nível?</h2>
            <p className="text-white/40 text-sm mb-8">Clientes neste nível voltarão para sem nível. Esta ação não pode ser desfeita.</p>
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
