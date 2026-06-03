"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ClipboardList } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const actionColors: Record<string, string> = {
  VENDA_CRIADA:     "text-green-400 bg-green-400/10",
  VENDA_CANCELADA:  "text-red-400 bg-red-400/10",
  VENDA_TROCADA:    "text-yellow-400 bg-yellow-400/10",
  PRODUTO_CRIADO:   "text-blue-400 bg-blue-400/10",
  PRODUTO_ATUALIZADO: "text-blue-300 bg-blue-300/10",
  PRODUTO_REMOVIDO: "text-red-400 bg-red-400/10",
  CLIENTE_CADASTRADO: "text-purple-400 bg-purple-400/10",
  CLIENTE_ATUALIZADO: "text-purple-300 bg-purple-300/10",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/audit-logs")
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Sistema</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Histórico de Atividades</h1>
        <p className="text-white/40 text-sm mt-1">Registro de todas as ações realizadas na plataforma.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-white/20">
          <ClipboardList size={40} strokeWidth={1} className="mb-4" />
          <p className="text-sm">Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div className="bg-[#0d0d0d] border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Data</th>
                <th className="px-6 py-4 text-left">Ação</th>
                <th className="px-6 py-4 text-left">Detalhes</th>
                <th className="px-6 py-4 text-left">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white/40 whitespace-nowrap text-xs">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-sm ${actionColors[log.action] ?? "text-white/50 bg-white/5"}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60 max-w-sm">
                    {log.details ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-white/40 text-xs">
                    {log.user?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
