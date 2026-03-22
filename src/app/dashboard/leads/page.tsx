"use client";

import { useState, useEffect } from "react";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { Plus, TrendingUp, MessageCircle, XCircle, Eye } from "lucide-react";

interface Interaction {
  id: string;
  date: string;
  status: string;
  origin: string | null;
  score: number;
  notes: string | null;
  searchCategory: string | null;
  searchInterest: string | null;
  searchBodyType: string | null;
  searchCurrency: string | null;
  searchPriceMin: number | null;
  searchPriceMax: number | null;
  searchYearMin: number | null;
  searchYearMax: number | null;
  searchColor: string | null;
  saleCompleted: boolean;
  client: { firstName: string; lastName: string };
  vehicle?: { name: string } | null;
}

export default function LeadsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("client");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    clientFirstName: "",
    clientLastName: "",
    clientEmail: "",
    clientPhone: "",
    origin: "",
    status: "CONSULTA_ABIERTA",
    notes: "",
    searchCategory: "",
    searchInterest: "",
    searchBodyType: "",
    searchCurrency: "ARS",
    searchPriceMin: "",
    searchPriceMax: "",
    searchYearMin: "",
    searchYearMax: "",
    searchColor: "",
    vehicleId: "",
  });

  useEffect(() => {
    fetch("/api/interactions").then((r) => r.json()).then(setInteractions).catch(() => {});
  }, []);

  const salesClosed = interactions.filter((i) => i.saleCompleted).length;
  const openConsultations = interactions.filter((i) => i.status === "CONSULTA_ABIERTA").length;
  const notInterested = interactions.filter((i) => i.status === "NO_INTERESADO").length;

  const filtered = interactions.filter((i) => {
    if (activeTab === "consultations") return i.status === "CONSULTA_ABIERTA";
    if (activeTab === "sales") return i.saleCompleted;
    return true;
  });

  const tabs = [
    { id: "consultations", label: "Consultas", count: openConsultations },
    { id: "sales", label: "Ventas", count: salesClosed },
    { id: "all", label: "Todo", count: interactions.length },
  ];

  const modalTabs = [
    { id: "client", label: "Cliente" },
    { id: "consultation", label: "Consulta" },
    { id: "budget", label: "Presupuestos" },
    { id: "sale", label: "Venta" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "danger" | "info"; label: string }> = {
      CONSULTA_ABIERTA: { variant: "info", label: "Consulta Abierta" },
      PRESUPUESTADO: { variant: "warning", label: "Presupuestado" },
      VENTA_CERRADA: { variant: "success", label: "Venta Cerrada" },
      NO_INTERESADO: { variant: "danger", label: "No Interesado" },
    };
    const s = map[status] || { variant: "default" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const scoreDisplay = (score: number) => {
    const color = score >= 7 ? "text-green-400" : score >= 4 ? "text-yellow-400" : "text-red-400";
    return <span className={`font-bold ${color}`}>{score}/10</span>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        searchPriceMin: form.searchPriceMin ? parseFloat(form.searchPriceMin) : null,
        searchPriceMax: form.searchPriceMax ? parseFloat(form.searchPriceMax) : null,
        searchYearMin: form.searchYearMin ? parseInt(form.searchYearMin) : null,
        searchYearMax: form.searchYearMax ? parseInt(form.searchYearMax) : null,
      }),
    });
    setLoading(false);
    setShowModal(false);
    fetch("/api/interactions").then((r) => r.json()).then(setInteractions).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interacciones de Leads</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-2" />
          Nueva Interacción
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Ventas Cerradas" value={salesClosed.toString()} icon={<TrendingUp size={24} className="text-green-500" />} />
        <StatCard title="Consultas Abiertas" value={openConsultations.toString()} icon={<MessageCircle size={24} className="text-blue-500" />} />
        <StatCard title="No interesados" value={notInterested.toString()} icon={<XCircle size={24} className="text-red-500" />} />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vehículo Buscado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No hay interacciones</td></tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-300">{formatDate(i.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{i.client.firstName} {i.client.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{i.searchInterest || i.vehicle?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm">{statusBadge(i.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{i.origin || "-"}</td>
                    <td className="px-4 py-3 text-sm">{scoreDisplay(i.score)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-gray-400 hover:text-white"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Interaction Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Interacción" size="xl">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Tabs tabs={modalTabs} activeTab={modalTab} onTabChange={setModalTab} />
          </div>

          {modalTab === "client" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Información del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" value={form.clientFirstName} onChange={(e) => setForm({ ...form, clientFirstName: e.target.value })} required />
                <Input label="Apellido" value={form.clientLastName} onChange={(e) => setForm({ ...form, clientLastName: e.target.value })} required />
                <Input label="Email" type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
                <Input label="Teléfono" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Origen del Lead" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} options={[
                  { value: "INSTAGRAM", label: "Instagram" },
                  { value: "FACEBOOK", label: "Facebook" },
                  { value: "WHATSAPP", label: "WhatsApp" },
                  { value: "MERCADOLIBRE", label: "Mercado Libre" },
                  { value: "REFERIDO", label: "Referido" },
                  { value: "LOCAL", label: "Local" },
                  { value: "OTRO", label: "Otro" },
                ]} />
                <Select label="Estado del Lead" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
                  { value: "CONSULTA_ABIERTA", label: "Consulta Abierta" },
                  { value: "PRESUPUESTADO", label: "Presupuestado" },
                  { value: "VENTA_CERRADA", label: "Venta Cerrada" },
                  { value: "NO_INTERESADO", label: "No Interesado" },
                ]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {modalTab === "consultation" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Agregar Consulta</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Categoría" value={form.searchCategory} onChange={(e) => setForm({ ...form, searchCategory: e.target.value })} options={[
                  { value: "AUTOS_Y_CAMIONETAS", label: "Autos y Camionetas" },
                  { value: "MOTOS", label: "Motos" },
                  { value: "CAMIONES", label: "Camiones" },
                ]} />
                <Input label="Interés" value={form.searchInterest} onChange={(e) => setForm({ ...form, searchInterest: e.target.value })} placeholder="Ej: Toyota Corolla" />
                <Select label="Carrocerías" value={form.searchBodyType} onChange={(e) => setForm({ ...form, searchBodyType: e.target.value })} options={[
                  { value: "SEDAN", label: "Sedán" },
                  { value: "HATCHBACK", label: "Hatchback" },
                  { value: "SUV", label: "SUV" },
                  { value: "PICKUP", label: "Pick-up" },
                ]} />
                <Select label="Moneda" value={form.searchCurrency} onChange={(e) => setForm({ ...form, searchCurrency: e.target.value })} options={[
                  { value: "ARS", label: "ARS" },
                  { value: "USD", label: "USD" },
                ]} />
                <Input label="Precio Mínimo" type="number" value={form.searchPriceMin} onChange={(e) => setForm({ ...form, searchPriceMin: e.target.value })} />
                <Input label="Precio Máximo" type="number" value={form.searchPriceMax} onChange={(e) => setForm({ ...form, searchPriceMax: e.target.value })} />
                <Input label="Año Mínimo" type="number" value={form.searchYearMin} onChange={(e) => setForm({ ...form, searchYearMin: e.target.value })} />
                <Input label="Año Máximo" type="number" value={form.searchYearMax} onChange={(e) => setForm({ ...form, searchYearMax: e.target.value })} />
                <Input label="Color Preferido" value={form.searchColor} onChange={(e) => setForm({ ...form, searchColor: e.target.value })} />
              </div>
            </div>
          )}

          {modalTab === "budget" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Presupuestos</h3>
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-500">
                <p>Seleccioná un vehículo del inventario para generar un presupuesto</p>
                <p className="text-xs mt-2">Incluye: Fecha, Transferencia, Moneda, TC, Monto, Métodos de pago (Seña, Efectivo, Financiamiento, Permuta)</p>
                <Button variant="outline" className="mt-4" type="button">Previsualizar Cotización</Button>
              </div>
            </div>
          )}

          {modalTab === "sale" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Venta</h3>
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-500">
                <p>Seleccioná un vehículo vendido para registrar la venta</p>
                <p className="text-xs mt-2">Incluye: Detalles de pago, métodos, previsualización de contrato</p>
                <Button variant="outline" className="mt-4" type="button">Previsualizar Contrato</Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear Interacción"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
