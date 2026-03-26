"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("E-mail ou senha inválidos.");
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
            Bem-vindo<br />de volta.
          </h2>
          <p className="text-white/40">
            Acesse seu painel e gerencie sua loja, clientes e programa de fidelidade.
          </p>
        </div>
        <p className="text-white/20 text-sm">© 2026 FashionBoost</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-[family-name:var(--font-playfair)] text-xl font-bold block mb-12">
            Fashion<span className="text-[#D4AF37]">Boost</span>
          </Link>

          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-2">Acesso</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold mb-10">Entrar na conta</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 tracking-widest uppercase mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="••••••••"
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
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-white/40 text-sm mt-8 text-center">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-[#D4AF37] hover:text-[#F0D060] transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
