"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { Fragment } from "react";
import {
  Plus, X, ShoppingBag, Search, Trash2, ChevronDown, ChevronUp, Package, Tag,
} from "lucide-react";

const BACKEND_URL = "http://localhost:3001";

interface Customer { id: string; name: string; cpf: string; }
interface Product { id: string; name: string; price: number; pointsValue: number; stockQuantity: number; imageUrl?: string; category: { name: string }; }
interface SaleItem { id: string; quantity: number; unitPrice: number; totalPrice: number; earnedPoints: number; product: Product; }
interface Sale {
  id: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  status: "active" | "cancelled" | "exchanged";
  createdAt: string;
  customer: Customer;
  items: SaleItem[];
}

interface CartItem { product: Product; quantity: number; }

const STATUS_LABEL: Record<string, string> = { active: "Ativa", cancelled: "Cancelada", exchanged: "Trocada" };
const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
  exchanged: "bg-yellow-500/10 text-yellow-400",
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Nova venda
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saleError, setSaleError] = useState("");

  // Detalhes
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cancelar/Trocar
  const [statusModal, setStatusModal] = useState<{ sale: Sale; action: "cancelled" | "exchanged" } | null>(null);

  async function fetchData() {
    try {
      const [salesRes, custRes, prodRes] = await Promise.all([
        api.get("/sales"),
        api.get("/customers"),
        api.get("/products"),
      ]);
      setSales(salesRes.data);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openModal() {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
    setCart([]);
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
    setCouponApplied(false);
    setSaleError("");
    setModalOpen(true);
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
    setCouponApplied(false);
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const cartPoints = cart.reduce((sum, i) => sum + i.product.pointsValue * i.quantity, 0);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    if (!selectedCustomer) { setCouponError("Selecione um cliente primeiro."); return; }
    setCouponError("");
    try {
      const res = await api.get(`/coupons/${couponCode.trim().toUpperCase()}`);
      const c = res.data;
      if (c.customerId !== selectedCustomer.id) {
        setCouponError("Este cupom não pertence ao cliente selecionado.");
        return;
      }
      if (c.isUsed) { setCouponError("Cupom já foi utilizado."); return; }
      if (c.expiresAt && new Date() > new Date(c.expiresAt)) {
        setCouponError("Cupom expirado."); return;
      }
      let discount = 0;
      if (c.type === "fixed_discount") discount = Number(c.discountValue);
      else if (c.type === "percentage_discount") discount = cartTotal * (Number(c.discountValue) / 100);
      setCouponDiscount(discount);
      setCouponApplied(true);
    } catch {
      setCouponError("Cupom não encontrado.");
    }
  }

  async function handleCreateSale() {
    if (!selectedCustomer) { setSaleError("Selecione um cliente."); return; }
    if (cart.length === 0) { setSaleError("Adicione pelo menos um produto."); return; }

    setSaving(true);
    setSaleError("");
    try {
      await api.post("/sales", {
        customerId: selectedCustomer.id,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
      });
      await fetchData();
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaleError(typeof msg === "string" ? msg : "Erro ao registrar venda.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus() {
    if (!statusModal) return;
    try {
      await api.patch(`/sales/${statusModal.sale.id}/status`, { status: statusModal.action });
      await fetchData();
      setStatusModal(null);
    } catch {
      setStatusModal(null);
    }
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.cpf.includes(customerSearch)
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Gestão</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Vendas</h1>
          <p className="text-white/40 text-sm mt-1">Registre e acompanhe as vendas da sua loja.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-accent text-black px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Nova Venda
        </button>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
          <ShoppingBag size={32} strokeWidth={1} />
          <p className="text-sm">Nenhuma venda registrada.</p>
        </div>
      ) : (
        <div className="border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-3 font-normal w-6"></th>
                <th className="text-left px-6 py-3 font-normal">Data</th>
                <th className="text-left px-6 py-3 font-normal">Cliente</th>
                <th className="text-center px-6 py-3 font-normal">Itens</th>
                <th className="text-right px-6 py-3 font-normal">Total</th>
                <th className="text-center px-6 py-3 font-normal">Status</th>
                <th className="text-right px-6 py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <Fragment key={sale.id}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  >
                    <td className="px-6 py-4 text-white/30">
                      {expandedId === sale.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                    <td className="px-6 py-4 text-white/50 text-xs">
                      {new Date(sale.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 font-medium">{sale.customer?.name || "—"}</td>
                    <td className="px-6 py-4 text-center text-white/50">{sale.items?.length ?? 0}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      R$ {parseFloat(sale.totalAmount as unknown as string).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2 py-1 ${STATUS_STYLE[sale.status]}`}>
                        {STATUS_LABEL[sale.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {sale.status === "active" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setStatusModal({ sale, action: "exchanged" })}
                            className="text-xs text-yellow-500/60 hover:text-yellow-400 transition-colors px-2 py-1 border border-yellow-500/20 hover:border-yellow-400/40"
                          >
                            Trocar
                          </button>
                          <button
                            onClick={() => setStatusModal({ sale, action: "cancelled" })}
                            className="text-xs text-red-500/60 hover:text-red-400 transition-colors px-2 py-1 border border-red-500/20 hover:border-red-400/40"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === sale.id && (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <td colSpan={7} className="px-10 py-4">
                        <div className="space-y-2">
                          {sale.items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 text-sm">
                              <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                                {item.product?.imageUrl ? (
                                  <Image src={`${BACKEND_URL}${item.product.imageUrl}`} alt={item.product.name} width={32} height={32} className="object-cover w-full h-full" />
                                ) : (
                                  <Package size={12} className="text-white/20" />
                                )}
                              </div>
                              <span className="flex-1 text-white/70">{item.product?.name}</span>
                              <span className="text-white/40">{item.quantity}x</span>
                              <span className="text-white/50 w-24 text-right">R$ {parseFloat(item.unitPrice as unknown as string).toFixed(2).replace(".", ",")}</span>
                              <span className="font-medium w-24 text-right">R$ {parseFloat(item.totalPrice as unknown as string).toFixed(2).replace(".", ",")}</span>
                              <span className="text-accent text-xs w-20 text-right">+{item.earnedPoints} pts</span>
                            </div>
                          ))}
                          <div className="border-t border-white/5 pt-2 flex justify-end gap-8 text-xs text-white/40 mt-2">
                            <span>Subtotal: R$ {parseFloat(sale.subtotalAmount as unknown as string).toFixed(2).replace(".", ",")}</span>
                            <span>Desconto: R$ {parseFloat(sale.discountAmount as unknown as string).toFixed(2).replace(".", ",")}</span>
                            <span className="text-white font-medium">Total: R$ {parseFloat(sale.totalAmount as unknown as string).toFixed(2).replace(".", ",")}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nova Venda Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">Nova Venda</h2>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Customer + Products */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 space-y-6">

                {/* Cliente */}
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Cliente *</label>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between bg-white/5 border border-accent/30 px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{selectedCustomer.name}</p>
                        <p className="text-xs text-white/40">{selectedCustomer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-white/30 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Buscar cliente..."
                          className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                        />
                      </div>
                      <div className="border border-white/5 max-h-36 overflow-y-auto">
                        {filteredCustomers.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <p className="text-sm">{c.name}</p>
                            <p className="text-xs text-white/30">{c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
                          </button>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <p className="text-center text-white/30 text-xs py-4">Nenhum cliente encontrado.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Produtos */}
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Adicionar Produto</label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar produto..."
                      className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div className="border border-white/5 max-h-52 overflow-y-auto">
                    {filteredProducts.map((p) => {
                      const inCart = cart.find((i) => i.product.id === p.id);
                      const outOfStock = p.stockQuantity === 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => !outOfStock && addToCart(p)}
                          disabled={outOfStock}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 disabled:opacity-40 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-white/5 flex-shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <Image src={`${BACKEND_URL}${p.imageUrl}`} alt={p.name} width={32} height={32} className="object-cover w-full h-full" />
                            ) : (
                              <Package size={12} className="text-white/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.name}</p>
                            <p className="text-xs text-white/30">{p.category?.name} · Estoque: {p.stockQuantity}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium">R$ {parseFloat(p.price as unknown as string).toFixed(2).replace(".", ",")}</p>
                            <p className="text-xs text-accent">{p.pointsValue} pts</p>
                          </div>
                          {inCart && <span className="text-xs text-accent ml-1">({inCart.quantity})</span>}
                        </button>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-center text-white/30 text-xs py-4">Nenhum produto encontrado.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Cart */}
              <div className="w-64 p-6 flex flex-col">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Carrinho</p>

                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-white/20 text-xs text-center">
                    Nenhum produto adicionado
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white/80 text-xs leading-tight flex-1">{item.product.name}</p>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-5 h-5 bg-white/5 flex items-center justify-center text-white/50 hover:text-white text-xs">−</button>
                            <span className="text-xs w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity}
                              className="w-5 h-5 bg-white/5 flex items-center justify-center text-white/50 hover:text-white text-xs disabled:opacity-30"
                            >+</button>
                          </div>
                          <span className="text-xs text-white/60">R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coupon */}
                <div className="border-t border-white/5 pt-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Cupom</p>
                  {couponApplied ? (
                    <div className="flex items-center justify-between bg-accent/10 border border-accent/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-accent" />
                        <span className="text-xs font-mono text-accent">{couponCode.toUpperCase()}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-white/30 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="CÓDIGO DO CUPOM"
                        className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50 uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="w-full text-xs py-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
                      >
                        Aplicar Cupom
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-white/40 text-xs">
                    <span>Subtotal</span>
                    <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {couponApplied && couponDiscount > 0 && (
                    <div className="flex justify-between text-green-400 text-xs">
                      <span>Desconto</span>
                      <span>− R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>R$ {Math.max(0, cartTotal - couponDiscount).toFixed(2).replace(".", ",")}</span>
                  </div>
                  {cartPoints > 0 && (
                    <div className="flex justify-between text-accent text-xs">
                      <span>Pontos a ganhar</span>
                      <span>+{cartPoints} pts</span>
                    </div>
                  )}
                </div>

                {saleError && <p className="text-red-400 text-xs mt-3">{saleError}</p>}

                <button
                  onClick={handleCreateSale}
                  disabled={saving}
                  className="mt-4 w-full bg-accent text-black py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Registrando..." : "Confirmar Venda"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm p-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">
              {statusModal.action === "cancelled" ? "Cancelar venda?" : "Marcar como troca?"}
            </h2>
            <p className="text-white/40 text-sm mb-8">
              {statusModal.action === "cancelled"
                ? "A venda será marcada como cancelada. Esta ação não pode ser desfeita."
                : "A venda será marcada como trocada. Esta ação não pode ser desfeita."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModal(null)}
                className="flex-1 border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleUpdateStatus}
                className={`flex-1 px-4 py-2.5 text-sm transition-colors ${
                  statusModal.action === "cancelled"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
