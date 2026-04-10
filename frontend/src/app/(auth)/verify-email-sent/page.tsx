import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyEmailSentPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-8">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl font-bold block mb-16">
          Fashion<span className="text-[#D4AF37]">Boost</span>
        </Link>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border border-white/10 flex items-center justify-center">
            <Mail size={28} strokeWidth={1.5} className="text-[#D4AF37]" />
          </div>
        </div>

        <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-2">Quase lá</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-4">
          Verifique seu e-mail
        </h1>
        <p className="text-white/40 text-sm leading-relaxed mb-10">
          Enviamos um link de confirmação para o seu e-mail.<br />
          Clique no link para ativar sua conta e acessar o painel.
        </p>

        <p className="text-white/20 text-xs">
          Já verificou?{" "}
          <Link href="/login" className="text-[#D4AF37] hover:text-[#F0D060] transition-colors">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
