"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, X, Users, Search } from "lucide-react";

interface CustomerLoyalty {
  totalPoints: number;
  loyaltyLevel?: { name: string };
}

interface Customer {
  id: string;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
  createdAt: string;
  loyalty?: CustomerLoyalty;
}

interface FormData {
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

const emptyForm: FormData = { name: "", cpf: "", phone: "", email: "" };

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchCustomers() {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
      setFiltered(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.cpf.includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    );
  }, [search, customers]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      cpf: c.cpf,
      phone: c.phone || "",
      email: c.email || "",
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

  function setField(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.cpf.trim()) { setError("CPF é obrigatório."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        cpf: form.cpf.replace(/\D/g, ""),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      };

      if (editing) {
        await api.patch(`/customers/${editing.id}`, payload);
      } else {
        await api.post("/customers", payload);
      }
      await fetchCustomers();
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Gestão</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Clientes</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie os clientes da sua loja.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone..."
          className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
          <Users size={32} strokeWidth={1} />
          <p className="text-sm">{search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}</p>
        </div>
      ) : (
        <div className="border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-3 font-normal">Nome</th>
                <th className="text-left px-6 py-3 font-normal">CPF</th>
                <th className="text-left px-6 py-3 font-normal">Telefone</th>
                <th className="text-left px-6 py-3 font-normal">E-mail</th>
                <th className="text-center px-6 py-3 font-normal">Nível</th>
                <th className="text-right px-6 py-3 font-normal">Pontos</th>
                <th className="text-right px-6 py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-white/50 font-mono text-xs">
                    {c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                  </td>
                  <td className="px-6 py-4 text-white/50">{c.phone || "—"}</td>
                  <td className="px-6 py-4 text-white/50">{c.email || "—"}</td>
                  <td className="px-6 py-4 text-center">
                    {c.loyalty?.loyaltyLevel?.name ? (
                      <span className="text-xs px-2 py-1 bg-accent/10 text-accent">
                        {c.loyalty?.loyaltyLevel?.name}
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-accent font-medium">
                    {c.loyalty?.totalPoints ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-white/40 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
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
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">
                {editing ? "Editar Cliente" : "Novo Cliente"}
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
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="Nome completo"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">CPF *</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setField("cpf", formatCpf(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 font-mono"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Telefone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setField("phone", formatPhone(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="email@exemplo.com"
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
    </div>
  );
}
