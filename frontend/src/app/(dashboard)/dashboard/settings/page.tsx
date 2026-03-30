"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Save, Store, Palette } from "lucide-react";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  instagram?: string;
  primaryColor?: string;
}

export default function SettingsPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    instagram: "",
    primaryColor: "#D4AF37",
  });

  useEffect(() => {
    api.get("/stores/me").then((res) => {
      const s = res.data;
      setStore(s);
      setForm({
        name: s.name || "",
        slug: s.slug || "",
        description: s.description || "",
        phone: s.phone || "",
        instagram: s.instagram || "",
        primaryColor: s.primaryColor || "#D4AF37",
      });
    }).finally(() => setLoading(false));
  }, []);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (success) setSuccess(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("O nome da loja é obrigatório."); return; }
    if (!form.slug.trim()) { setError("O slug é obrigatório."); return; }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.patch(`/stores/${store!.id}`, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        primaryColor: form.primaryColor,
      });
      document.documentElement.style.setProperty("--accent", form.primaryColor);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Sistema</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Configurações</h1>
        <p className="text-white/40 text-sm mt-1">Gerencie as informações da sua loja.</p>
      </div>

      {/* Store Info */}
      <div className="bg-[#0d0d0d] border border-white/5 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Store size={16} className="text-accent" strokeWidth={1.5} />
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/60">Informações da Loja</h2>
        </div>

        <div className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Nome da Loja *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
              placeholder="Nome da sua loja"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Slug *</label>
            <div className="flex items-center">
              <span className="bg-white/5 border border-r-0 border-white/10 px-3 py-2.5 text-sm text-white/30 select-none">
                fashionboost.com/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                placeholder="minha-loja"
              />
            </div>
            <p className="text-white/20 text-xs mt-1">Identificador único da loja. Apenas letras, números e hífens.</p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 resize-none"
              placeholder="Fale um pouco sobre sua loja..."
            />
          </div>

          {/* Telefone + Instagram */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Instagram</label>
              <div className="flex items-center">
                <span className="bg-white/5 border border-r-0 border-white/10 px-3 py-2.5 text-sm text-white/30 select-none">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setField("instagram", e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                  placeholder="minhaloja"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-[#0d0d0d] border border-white/5 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette size={16} className="text-accent" strokeWidth={1.5} />
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/60">Aparência</h2>
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-widest mb-3">Cor Principal</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setField("primaryColor", e.target.value)}
                className="w-12 h-10 cursor-pointer bg-transparent border border-white/10 p-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-sm font-mono">{form.primaryColor.toUpperCase()}</span>
            </div>
            <div className="flex gap-2 ml-2">
              {["#D4AF37", "#E63946", "#2EC4B6", "#8B5CF6", "#F97316", "#10B981"].map((color) => (
                <button
                  key={color}
                  onClick={() => setField("primaryColor", color)}
                  title={color}
                  className="w-6 h-6 border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: form.primaryColor === color ? "#fff" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-white/20 text-xs mt-2">Define a cor de destaque do seu painel. A alteração é aplicada imediatamente ao salvar.</p>
        </div>
      </div>

      {/* Feedback */}
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
      {success && (
        <p className="text-green-400 text-xs mb-4">Configurações salvas com sucesso.</p>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-accent text-black px-6 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        <Save size={15} />
        {saving ? "Salvando..." : "Salvar Alterações"}
      </button>
    </div>
  );
}
