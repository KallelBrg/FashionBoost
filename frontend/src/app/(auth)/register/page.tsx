"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    tenantName: "",
    tenantSlug: "",
    userName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tenantName"
        ? { tenantSlug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
    } catch {
      setError("Erro ao criar conta. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* LEFT — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0d0d0d] border-r border-white/5 p-16">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl font-bold">
          Fashion<span className="text-[#D4AF37]">Boost</span>
        </Link>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight mb-6">
            Comece sua<br />
            <span className="text-[#D4AF37]">jornada.</span>
          </h2>
          <p className="text-white/40">
            Crie sua conta gratuitamente e configure seu programa de fidelidade em minutos.
          </p>
        </div>
        <p className="text-white/20 text-sm">© 2026 FashionBoost</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-[family-name:var(--font-playfair)] text-xl font-bold block mb-12">
            Fashion<span className="text-[#D4AF37]">Boost</span>
          </Link>

          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-2">Cadastro</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold mb-10">Criar conta</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">Nome da Loja</label>
              <input
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Ex: Boutique Elegance"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">
                Slug <span className="normal-case text-white/30">(identificador único)</span>
              </label>
              <input
                name="tenantSlug"
                value={form.tenantSlug}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="boutique-elegance"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">Seu Nome</label>
              <input
                name="userName"
                value={form.userName}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="João Silva"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">E-mail</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">Senha</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black text-xs font-bold tracking-widest uppercase py-4 hover:bg-[#F0D060] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <p className="text-white/40 text-sm mt-8 text-center">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#D4AF37] hover:text-[#F0D060] transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
