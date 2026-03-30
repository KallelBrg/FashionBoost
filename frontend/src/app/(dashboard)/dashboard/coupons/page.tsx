"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, X, Ticket, Search, CheckCircle } from "lucide-react";

interface Customer { id: string; name: string; cpf: string; loyalty?: { currentPoints: number } }
interface Coupon {
  id: string;
  code: string;
  type: "fixed_discount" | "percentage_discount" | "gift";
  rewardDescription?: string;
  pointsUsed: number;
  discountValue?: number;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  customer: Customer;
}

interface RedeemForm {
  customerId: string;
  pointsUsed: string;
  type: "fixed_discount" | "percentage_discount" | "gift";
  rewardDescription: string;
  discountValue: string;
}

const emptyForm: RedeemForm = {
  customerId: "",
  pointsUsed: "",
  type: "fixed_discount",
  rewardDescription: "",
  discountValue: "",
};

const TYPE_LABEL: Record<string, string> = {
  fixed_discount: "Desconto Fixo",
  percentage_discount: "Desconto %",
  gift: "Brinde",
};

function couponStatus(coupon: Coupon): "active" | "used" | "expired" {
  if (coupon.isUsed) return "used";
  if (new Date() > new Date(coupon.expiresAt)) return "expired";
  return "active";
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  used: "bg-white/5 text-white/30",
  expired: "bg-red-500/10 text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  used: "Utilizado",
  expired: "Expirado",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RedeemForm>(emptyForm);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [useModal, setUseModal] = useState<Coupon | null>(null);

  async function fetchData() {
    try {
      const [couponsRes, custRes] = await Promise.all([
        api.get("/coupons"),
        api.get("/customers"),
      ]);
      setCoupons(couponsRes.data);
      setFiltered(couponsRes.data);
      setCustomers(custRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      coupons.filter((c) =>
        c.code.toLowerCase().includes(q) ||
        c.customer?.name?.toLowerCase().includes(q)
      )
    );
  }, [search, coupons]);

  function openModal() {
    setForm(emptyForm);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setError("");
  }

  async function handleRedeem() {
    if (!selectedCustomer) { setError("Selecione um cliente."); return; }
    if (!form.pointsUsed || parseInt(form.pointsUsed) <= 0) { setError("Informe os pontos a resgatar."); return; }
    if (!form.rewardDescription.trim()) { setError("Descreva o benefício do cupom."); return; }

    setSaving(true);
    setError("");
    try {
      await api.post("/coupons/redeem", {
        customerId: selectedCustomer.id,
        pointsUsed: parseInt(form.pointsUsed),
        type: form.type,
        rewardDescription: form.rewardDescription.trim(),
        discountValue: form.discountValue ? parseFloat(form.discountValue) : undefined,
      });
      await fetchData();
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Erro ao gerar cupom.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUseCoupon() {
    if (!useModal) return;
    try {
      await api.post(`/coupons/${useModal.code}/use`);
      await fetchData();
    } finally {
      setUseModal(null);
    }
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.cpf.includes(customerSearch)
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Gamificação</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Cupons</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie os cupons gerados para seus clientes.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Gerar Cupom
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou cliente..."
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
          <Ticket size={32} strokeWidth={1} />
          <p className="text-sm">{search ? "Nenhum cupom encontrado." : "Nenhum cupom gerado ainda."}</p>
        </div>
      ) : (
        <div className="border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-3 font-normal">Código</th>
                <th className="text-left px-6 py-3 font-normal">Cliente</th>
                <th className="text-left px-6 py-3 font-normal">Tipo</th>
                <th className="text-left px-6 py-3 font-normal">Benefício</th>
                <th className="text-right px-6 py-3 font-normal">Pontos</th>
                <th className="text-center px-6 py-3 font-normal">Validade</th>
                <th className="text-center px-6 py-3 font-normal">Status</th>
                <th className="text-right px-6 py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coupon) => {
                const status = couponStatus(coupon);
                return (
                  <tr key={coupon.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-accent tracking-widest text-xs bg-accent/5 px-2 py-1">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/70">{coupon.customer?.name || "—"}</td>
                    <td className="px-6 py-4 text-white/50 text-xs">{TYPE_LABEL[coupon.type]}</td>
                    <td className="px-6 py-4 text-white/50 max-w-[200px] truncate">{coupon.rewardDescription || "—"}</td>
                    <td className="px-6 py-4 text-right text-accent">{coupon.pointsUsed}</td>
                    <td className="px-6 py-4 text-center text-white/40 text-xs">
                      {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2 py-1 ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {status === "active" && (
                        <button
                          onClick={() => setUseModal(coupon)}
                          className="flex items-center gap-1 text-xs text-white/40 hover:text-green-400 transition-colors ml-auto"
                        >
                          <CheckCircle size={13} />
                          Usar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Gerar Cupom Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">Gerar Cupom</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Cliente *</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-white/5 border border-accent/30 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                      <p className="text-xs text-white/40">
                        {selectedCustomer.loyalty?.currentPoints ?? 0} pontos disponíveis
                      </p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-white/30 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div className="border border-white/5 max-h-36 overflow-y-auto">
                      {filteredCustomers.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <p className="text-sm">{c.name}</p>
                          <p className="text-xs text-white/30">{c.loyalty?.currentPoints ?? 0} pts disponíveis</p>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <p className="text-center text-white/30 text-xs py-4">Nenhum cliente encontrado.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Tipo de Cupom *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as RedeemForm["type"] }))}
                  className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50"
                >
                  <option value="fixed_discount">Desconto Fixo (R$)</option>
                  <option value="percentage_discount">Desconto Percentual (%)</option>
                  <option value="gift">Brinde</option>
                </select>
              </div>

              {/* Pontos + Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Pontos a Resgatar *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.pointsUsed}
                    onChange={(e) => setForm((p) => ({ ...p, pointsUsed: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                    placeholder="Ex: 100"
                  />
                </div>
                {form.type !== "gift" && (
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
                      {form.type === "fixed_discount" ? "Valor (R$)" : "Percentual (%)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={form.type === "fixed_discount" ? "0.01" : "1"}
                      value={form.discountValue}
                      onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                      placeholder={form.type === "fixed_discount" ? "0,00" : "0"}
                    />
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Descrição do Benefício *</label>
                <input
                  type="text"
                  value={form.rewardDescription}
                  onChange={(e) => setForm((p) => ({ ...p, rewardDescription: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="Ex: R$20 de desconto na próxima compra"
                />
              </div>

              <p className="text-white/20 text-xs">O cupom gerado terá validade de 30 dias.</p>

              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleRedeem}
                disabled={saving}
                className="flex-1 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Gerando..." : "Gerar Cupom"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usar Cupom Modal */}
      {useModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm p-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Marcar como utilizado?</h2>
            <p className="text-white/40 text-sm mb-2">Cupom <span className="font-mono text-accent">{useModal.code}</span></p>
            <p className="text-white/40 text-sm mb-8">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setUseModal(null)} className="flex-1 border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
                Cancelar
              </button>
              <button onClick={handleUseCoupon} className="flex-1 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2.5 text-sm hover:bg-green-500/20 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
