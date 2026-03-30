"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Tag,
  Package,
  Award,
  Ticket,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sales", label: "Vendas", icon: ShoppingBag },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/products", label: "Produtos", icon: Package },
  { href: "/dashboard/categories", label: "Categorias", icon: Tag },
  { href: "/dashboard/loyalty", label: "Níveis de Fidelidade", icon: Award },
  { href: "/dashboard/coupons", label: "Cupons", icon: Ticket },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    api.get("/stores").then((res) => {
      const stores = res.data;
      if (Array.isArray(stores) && stores.length > 0) {
        setStoreName(stores[0].name);
      }
    }).catch(() => {});
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-[#0d0d0d] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight"
        >
          {storeName || "Minha Loja"}
        </Link>
        <p className="text-accent text-[10px] tracking-widest uppercase mt-0.5">by FashionBoost</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-none ${
                active
                  ? "text-accent bg-accent/5 border-l-2 border-accent"
                  : "text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Conta</p>
          <p className="text-sm text-white truncate">{user?.name}</p>
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/50 hover:text-red-400 transition-colors w-full border-l-2 border-transparent"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  );
}
