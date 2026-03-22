"use client";

import { useState, useEffect } from "react";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Wallet, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

interface CashAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  identifier: string | null;
  currentBalance: number;
}

interface Movement {
  id: string;
  date: string;
  type: string;
  concept: string;
  category: string | null;
  amountARS: number;
  amountUSD: number;
  currency: string;
  cashAccount: { name: string };
  vehicle?: { name: string } | null;
}

export default function CashPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState("movements");
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [loading, setLoading] = useState(false);

  const [movementForm, setMovementForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "INGRESO",
    concept: "",
    category: "",
    cashAccountId: "",
    currency: "ARS",
    amountARS: "",
    amountUSD: "",
    exchangeRate: "",
    vehicleId: "",
  });

  const [accountForm, setAccountForm] = useState({
    name: "",
    type: "EFECTIVO",
    currency: "ARS",
    identifier: "",
    initialBalance: "0",
  });

  const fetchData = () => {
    fetch("/api/cash/accounts").then((r) => r.json()).then(setAccounts).catch(() => {});
    fetch("/api/cash/movements").then((r) => r.json()).then(setMovements).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const totalARS = accounts.filter((a) => a.currency === "ARS").reduce((s, a) => s + a.currentBalance, 0);
  const totalUSD = accounts.filter((a) => a.currency === "USD").reduce((s, a) => s + a.currentBalance, 0);

  const today = new Date().toISOString().split("T")[0];
  const todayMovements = movements.filter((m) => m.date.startsWith(today));
  const todayIncome = todayMovements.filter((m) => m.type === "INGRESO").reduce((s, m) => s + m.amountARS, 0);
  const todayExpense = todayMovements.filter((m) => m.type === "EGRESO").reduce((s, m) => s + m.amountARS, 0);

  const filteredMovements = movements.filter((m) => {
    if (search && !m.concept.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAccount && m.cashAccount.name !== filterAccount) return false;
    if (filterType && m.type !== filterType) return false;
    if (filterFrom && m.date < filterFrom) return false;
    if (filterTo && m.date > filterTo) return false;
    return true;
  });

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/cash/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...movementForm,
        amountARS: parseFloat(movementForm.amountARS) || 0,
        amountUSD: parseFloat(movementForm.amountUSD) || 0,
        exchangeRate: parseFloat(movementForm.exchangeRate) || undefined,
      }),
    });
    setLoading(false);
    setShowMovementModal(false);
    fetchData();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/cash/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...accountForm,
        initialBalance: parseFloat(accountForm.initialBalance) || 0,
      }),
    });
    setLoading(false);
    setShowAccountModal(false);
    setAccountForm({ name: "", type: "EFECTIVO", currency: "ARS", identifier: "", initialBalance: "0" });
    fetchData();
  };

  const tabs = [
    { id: "movements", label: "Movimientos" },
    { id: "balance", label: "Arqueo" },
    { id: "checks", label: "Cheques" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Caja</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAccountModal(true)}>
            <Plus size={16} className="mr-2" />
            Nueva Caja
          </Button>
          <Button onClick={() => setShowMovementModal(true)}>
            <Plus size={16} className="mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Total General $" value={formatCurrency(totalARS)} icon={<DollarSign size={24} />} />
        <StatCard title="Total General USD" value={formatCurrency(totalUSD, "USD")} icon={<DollarSign size={24} />} />
        <StatCard title="Ingresos Hoy" value={formatCurrency(todayIncome)} icon={<TrendingUp size={24} className="text-green-500" />} />
        <StatCard title="Egresos Hoy" value={formatCurrency(todayExpense)} icon={<TrendingDown size={24} className="text-red-500" />} />
        <StatCard title="Cheques Pendientes" value="0" icon={<Clock size={24} />} />
      </div>

      {/* Saldos por Caja */}
      {accounts.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Saldos por Caja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">{acc.name}</span>
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(acc.currentBalance, acc.currency)}
                </p>
                <p className="text-xs text-gray-500">{acc.type} · {acc.currency}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Movements Table */}
      {activeTab === "movements" && (
        <Card className="p-0">
          <div className="p-4 border-b border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
              >
                <option value="">Caja</option>
                {accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
              >
                <option value="">Tipo</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Concepto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Caja</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredMovements.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No hay movimientos</td></tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-300">{formatDate(m.date)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={m.type === "INGRESO" ? "success" : "danger"}>{m.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{m.concept}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{m.cashAccount.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        <span className={m.type === "INGRESO" ? "text-green-400" : "text-red-400"}>
                          {m.type === "INGRESO" ? "+" : "-"}
                          {formatCurrency(m.currency === "USD" ? m.amountUSD : m.amountARS, m.currency)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "balance" && (
        <Card>
          <p className="text-gray-400">Sección de arqueo en desarrollo</p>
        </Card>
      )}

      {activeTab === "checks" && (
        <Card>
          <p className="text-gray-400">Sección de cheques en desarrollo</p>
        </Card>
      )}

      {/* New Movement Modal */}
      <Modal open={showMovementModal} onClose={() => setShowMovementModal(false)} title="Nuevo Movimiento" size="lg">
        <form onSubmit={handleCreateMovement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={movementForm.date} onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })} required />
            <Select label="Tipo" value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })} options={[
              { value: "INGRESO", label: "Ingreso" },
              { value: "EGRESO", label: "Egreso" },
            ]} />
            <Input label="Concepto" value={movementForm.concept} onChange={(e) => setMovementForm({ ...movementForm, concept: e.target.value })} required className="sm:col-span-2" />
            <Select label="Caja" value={movementForm.cashAccountId} onChange={(e) => setMovementForm({ ...movementForm, cashAccountId: e.target.value })} options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
            <Input label="Categoría" value={movementForm.category} onChange={(e) => setMovementForm({ ...movementForm, category: e.target.value })} />
            <Select label="Moneda" value={movementForm.currency} onChange={(e) => setMovementForm({ ...movementForm, currency: e.target.value })} options={[
              { value: "ARS", label: "ARS" },
              { value: "USD", label: "USD" },
            ]} />
            <Input label="Monto ARS" type="number" value={movementForm.amountARS} onChange={(e) => setMovementForm({ ...movementForm, amountARS: e.target.value })} />
            <Input label="Monto USD" type="number" value={movementForm.amountUSD} onChange={(e) => setMovementForm({ ...movementForm, amountUSD: e.target.value })} />
            <Input label="Tipo de Cambio" type="number" value={movementForm.exchangeRate} onChange={(e) => setMovementForm({ ...movementForm, exchangeRate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowMovementModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear Movimiento"}</Button>
          </div>
        </form>
      </Modal>

      {/* New Account Modal */}
      <Modal open={showAccountModal} onClose={() => setShowAccountModal(false)} title="Agregar Nueva Caja" size="md">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Select label="Tipo" value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} options={[
            { value: "EFECTIVO", label: "Efectivo" },
            { value: "BANCO", label: "Banco" },
            { value: "MERCADOPAGO", label: "Mercado Pago" },
            { value: "OTRO", label: "Otro" },
          ]} />
          <Select label="Moneda" value={accountForm.currency} onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })} options={[
            { value: "ARS", label: "ARS" },
            { value: "USD", label: "USD" },
          ]} />
          <Input label="Identificador / Nombre" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required />
          <Input label="Saldo Inicial" type="number" value={accountForm.initialBalance} onChange={(e) => setAccountForm({ ...accountForm, initialBalance: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowAccountModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear Caja"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
