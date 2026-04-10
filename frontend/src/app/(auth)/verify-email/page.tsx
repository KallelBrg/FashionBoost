"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="w-full max-w-md text-center">
      <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl font-bold block mb-16">
        Fashion<span className="text-[#D4AF37]">Boost</span>
      </Link>

      {status === "loading" && (
        <>
          <div className="flex justify-center mb-6">
            <Loader size={32} strokeWidth={1.5} className="text-[#D4AF37] animate-spin" />
          </div>
          <p className="text-white/40 text-sm">Verificando seu e-mail...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border border-green-500/20 flex items-center justify-center">
              <CheckCircle size={28} strokeWidth={1.5} className="text-green-400" />
            </div>
          </div>
          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-2">Confirmado</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-4">
            E-mail verificado!
          </h1>
          <p className="text-white/40 text-sm mb-10">
            Sua conta está ativa. Faça login para acessar o painel.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#D4AF37] text-black text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#F0D060] transition-colors"
          >
            Fazer Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border border-red-500/20 flex items-center justify-center">
              <XCircle size={28} strokeWidth={1.5} className="text-red-400" />
            </div>
          </div>
          <p className="text-red-400 text-xs tracking-[0.3em] uppercase mb-2">Erro</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-4">
            Link inválido
          </h1>
          <p className="text-white/40 text-sm mb-10">
            O link de verificação é inválido ou já foi utilizado.<br />
            Tente se cadastrar novamente.
          </p>
          <Link
            href="/register"
            className="inline-block border border-white/10 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 hover:border-white/30 transition-colors"
          >
            Voltar ao Cadastro
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-8">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-white/30">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
