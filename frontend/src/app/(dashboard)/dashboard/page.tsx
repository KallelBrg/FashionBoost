"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { ShoppingBag, Users, Star, Ticket } from "lucide-react";

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalPointsDistributed: number;
  totalCoupons: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [salesRes, customersRes, loyaltyRes, couponsRes] = await Promise.allSettled([
          api.get("/sales"),
          api.get("/customers"),
          api.get("/loyalty/transactions"),
          api.get("/coupons"),
        ]);

        const sales = salesRes.status === "fulfilled" ? salesRes.value.data : [];
        const customers = customersRes.status === "fulfilled" ? customersRes.value.data : [];
        const transactions = loyaltyRes.status === "fulfilled" ? loyaltyRes.value.data : [];
        const coupons = couponsRes.status === "fulfilled" ? couponsRes.value.data : [];

        const totalRevenue = Array.isArray(sales)
          ? sales.reduce((acc: number, s: { totalAmount: string }) => acc + parseFloat(s.totalAmount || "0"), 0)
          : 0;

        const totalPointsDistributed = Array.isArray(transactions)
          ? transactions
              .filter((t: { type: string }) => t.type === "EARN")
              .reduce((acc: number, t: { points: number }) => acc + (t.points || 0), 0)
          : 0;

        setStats({
          totalSales: Array.isArray(sales) ? sales.length : 0,
          totalRevenue,
          totalCustomers: Array.isArray(customers) ? customers.length : 0,
          totalPointsDistributed,
          totalCoupons: Array.isArray(coupons) ? coupons.length : 0,
        });
      } catch {
        setStats({ totalSales: 0, totalRevenue: 0, totalCustomers: 0, totalPointsDistributed: 0, totalCoupons: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      label: "Total de Vendas",
      value: stats ? stats.totalSales.toString() : "—",
      sub: stats ? `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}` : "",
      icon: ShoppingBag,
    },
    {
      label: "Clientes",
      value: stats ? stats.totalCustomers.toString() : "—",
      sub: "cadastrados",
      icon: Users,
    },
    {
      label: "Pontos Distribuídos",
      value: stats ? stats.totalPointsDistributed.toLocaleString("pt-BR") : "—",
      sub: "pontos no total",
      icon: Star,
    },
    {
      label: "Cupons Gerados",
      value: stats ? stats.totalCoupons.toString() : "—",
      sub: "cupons ativos",
      icon: Ticket,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Visão Geral</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
          Olá, {user?.name?.split(" ")[0]}.
        </h1>
        <p className="text-white/40 text-sm mt-1">Aqui está um resumo da sua loja.</p>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ label, value, sub, icon: Icon }) => (
            <div
              key={label}
              className="bg-[#0d0d0d] border border-white/5 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
                <Icon size={16} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold font-[family-name:var(--font-playfair)]">{value}</p>
                {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
