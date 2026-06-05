# FashionBoost

**FashionBoost** é uma plataforma SaaS de fidelidade e CRM voltada para pequenas e médias lojas de moda. O sistema permite que lojistas cadastrem clientes, registrem vendas, distribuam pontos de fidelidade e recebam sugestões estratégicas geradas por inteligência artificial — tudo em um painel unificado.

Desenvolvido como Trabalho de Conclusão de Curso (TCC) em Engenharia de Software.

---

## Funcionalidades

- **Autenticação com verificação de e-mail** — Cadastro com confirmação via link enviado por e-mail (Resend)
- **Multi-tenancy** — Cada loja opera de forma isolada com seus próprios dados, clientes e produtos
- **Gestão de produtos e categorias** — Cadastro com controle de estoque, preço e pontos por item
- **Registro de vendas** — Criação de vendas com múltiplos itens, geração automática de pontos ao cliente
- **Programa de fidelidade** — Níveis Bronze, Prata, Ouro e Diamante com pontuação e benefícios configuráveis
- **Gestão de clientes** — Histórico de compras, saldo de pontos acumulados e nível de fidelidade atual
- **Cupons de desconto** — Criação e resgate de cupons vinculados ao programa de pontos
- **Dashboard inteligente com IA** — Métricas em tempo real (receita, ticket médio, produtos mais vendidos) com sugestões estratégicas geradas pelo modelo Llama 3.3 via Groq, atualizadas automaticamente a cada nova venda
- **Log de auditoria** — Registro de todas as ações relevantes da loja (vendas, produtos, clientes)

---

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | NestJS, TypeORM, PostgreSQL |
| Autenticação | JWT + bcrypt |
| IA | Groq SDK — Llama 3.3 70B |
| E-mail | Resend |
| Deploy | Railway (backend + banco) · Vercel (frontend) |

---

## Estrutura do Repositório

```
FashionBoost/
├── backend/    # API NestJS
└── frontend/   # Aplicação Next.js
```

---

## Como Executar Localmente

### Pré-requisitos

- Node.js >= 20
- PostgreSQL rodando localmente

### Backend

```bash
cd backend
cp .env.example .env   # preencha as variáveis de ambiente
npm install
npm run start:dev
```

Variáveis necessárias no `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=sua_senha
DB_NAME=fashionboost
JWT_SECRET=sua_chave_secreta
GROQ_API_KEY=sua_chave_groq
RESEND_API_KEY=sua_chave_resend
APP_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # ou crie manualmente
npm install
npm run dev
```

Variável necessária no `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Deploy

- **Backend + Banco de dados**: [Railway](https://railway.app)
- **Frontend**: [Vercel](https://vercel.com)
- **Aplicação em produção**: [fashion-boost.vercel.app](https://fashion-boost.vercel.app)
