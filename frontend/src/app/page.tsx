import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/5">
        <span className="font-[family-name:var(--font-playfair)] text-xl font-bold">
          Fashion<span className="text-[#D4AF37]">Boost</span>
        </span>
        <div className="hidden md:flex items-center gap-10 text-sm text-white/60 tracking-widest uppercase">
          <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#fidelidade" className="hover:text-white transition-colors">Fidelidade</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
        </div>
        <Link
          href="/register"
          className="bg-[#D4AF37] text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#F0D060] transition-colors"
        >
          Começar
        </Link>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-6">
              Plataforma de Gestão & Fidelidade
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-6xl md:text-7xl font-bold leading-tight mb-6">
              Sua Loja.<br />
              <span className="text-[#D4AF37]">Sua Narrativa.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-lg">
              Crie uma loja que transforma clientes em fiéis admiradores através de
              gamificação, níveis de fidelidade e recompensas exclusivas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-[#D4AF37] text-black text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#F0D060] transition-colors"
              >
                Comece Agora — Grátis
              </Link>
              <a
                href="#como-funciona"
                className="border border-white/30 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 hover:border-white/60 transition-colors"
              >
                Ver Demonstração
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-28 max-w-7xl mx-auto px-8">
        <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4">Funcionalidades</p>
        <h2 className="font-[family-name:var(--font-playfair)] text-5xl font-bold mb-20">
          Tudo Que Sua Loja<br />Precisa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 border border-white/10">
          {[
            {
              icon: "⊞",
              title: "Loja Sob Medida",
              desc: "Crie sua loja com uma identidade visual sofisticada, sem precisar de designers ou desenvolvedores. Cadastre produtos, categorias e variações com facilidade.",
            },
            {
              icon: "☆",
              title: "Níveis de Fidelidade",
              desc: "Bronze, Prata e Ouro — seus clientes sobem de nível a cada compra. Cada nível desbloqueia benefícios exclusivos que os mantêm voltando.",
            },
            {
              icon: "⊕",
              title: "Pontos por Compra",
              desc: "Cada real gasto se transforma em pontos. Seus clientes acumulam e acompanham seu progresso em um painel elegante e intuitivo.",
            },
            {
              icon: "⊡",
              title: "Resgate de Recompensas",
              desc: "Pontos se tornam produtos. Seus clientes usam pontos acumulados para resgatar itens exclusivos, criando um ciclo de desejo e recompensa.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-12 border-b border-r border-white/10 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[#D4AF37] text-2xl mb-6 block">{item.icon}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FIDELIDADE */}
      <section id="fidelidade" className="py-28 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4">Programa de Fidelidade</p>
            <h2 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-bold mb-6">
              Três Níveis de<br />Exclusividade
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Seus clientes progridem automaticamente, desbloqueando recompensas cada vez mais valiosas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Bronze",
                color: "#CD7F32",
                range: "0 — 499 pontos",
                benefits: ["2% de cashback em pontos", "Acesso a promoções exclusivas", "Frete com desconto"],
              },
              {
                name: "Prata",
                color: "#C0C0C0",
                range: "500 — 1.999 pontos",
                benefits: ["5% de cashback em pontos", "Acesso antecipado a coleções", "Frete grátis acima de R$150", "Presente de aniversário"],
              },
              {
                name: "Ouro",
                color: "#D4AF37",
                range: "2.000+ pontos",
                benefits: ["10% de cashback em pontos", "Peças exclusivas para resgate", "Frete sempre grátis", "Convites para eventos VIP", "Atendimento prioritário"],
              },
            ].map((level, i) => (
              <div key={i} className="border border-white/10 p-10 hover:border-white/20 transition-colors">
                <div className="w-8 h-0.5 mb-8" style={{ backgroundColor: level.color }} />
                <h3
                  className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-2"
                  style={{ color: level.color }}
                >
                  {level.name}
                </h3>
                <p className="text-white/40 text-sm mb-8">{level.range}</p>
                <ul className="space-y-3">
                  {level.benefits.map((b, j) => (
                    <li key={j} className="flex items-start gap-3 text-white/70 text-sm">
                      <span style={{ color: level.color }} className="mt-1">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-28 max-w-7xl mx-auto px-8">
        <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4">Como Funciona</p>
        <h2 className="font-[family-name:var(--font-playfair)] text-5xl font-bold mb-20">
          Simples. Elegante.<br />Eficaz.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Crie Sua Loja",
              desc: "Configure sua loja em minutos. Adicione produtos, defina categorias e personalize a identidade visual.",
            },
            {
              step: "02",
              title: "Defina as Regras",
              desc: "Configure pontos por produto, defina níveis de fidelidade e escolha as recompensas disponíveis para resgate.",
            },
            {
              step: "03",
              title: "Seus Clientes Compram",
              desc: "Cada compra acumula pontos automaticamente. Seus clientes acompanham seu progresso em tempo real.",
            },
            {
              step: "04",
              title: "Fidelidade Acontece",
              desc: "Clientes sobem de nível, resgatam recompensas e se tornam embaixadores naturais da sua marca.",
            },
          ].map((item, i) => (
            <div key={i} className="border-l border-white/10 px-8 py-4 hover:border-[#D4AF37]/40 transition-colors">
              <p className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#D4AF37]/30 mb-6">{item.step}</p>
              <h3 className="font-bold text-lg mb-3">{item.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center border-t border-white/10">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Transforme Compradores Em{" "}
            <em className="text-[#D4AF37] not-italic">Devotos</em>
          </h2>
          <p className="text-white/50 mb-12">
            Comece gratuitamente. Sem cartão de crédito. Sem compromisso.<br />
            Crie sua loja e ative seu programa de fidelidade em minutos.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#D4AF37] text-black text-xs font-bold tracking-widest uppercase px-12 py-5 hover:bg-[#F0D060] transition-colors"
          >
            Criar Minha Loja Agora
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-playfair)] text-xl font-bold">
            Fashion<span className="text-[#D4AF37]">Boost</span>
          </span>
          <p className="text-white/30 text-sm">© 2026 FashionBoost. Todos os direitos reservados.</p>
        </div>
      </footer>

    </main>
  );
}
