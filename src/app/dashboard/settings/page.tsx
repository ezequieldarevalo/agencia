"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PROVINCES } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { Save, Globe, MessageCircle, ShoppingBag, Check, Crown, ArrowRight, Clock, Copy } from "lucide-react";
import { PLANS, getPlan, formatPlanPrice, type PlanId } from "@/lib/plans";

const PAYMENT_ALIAS = "total.abundance.cp";

function PlanSection({ dealership }: { dealership: Dealership | null }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{ requestedPlan: string } | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/plan/upgrade")
      .then((r) => r.json())
      .then((data) => {
        if (data.pendingRequest) setPendingRequest(data.pendingRequest);
      })
      .catch(() => {});
  }, []);

  const handleUpgradeClick = (planId: PlanId) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedPlan) return;
    const res = await fetch("/api/plan/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestedPlan: selectedPlan }),
    });
    if (res.ok) {
      setRequestSent(true);
      setShowPayment(false);
      const data = await res.json();
      setPendingRequest({ requestedPlan: data.requestedPlan });
    }
  };

  const copyAlias = () => {
    navigator.clipboard.writeText(PAYMENT_ALIAS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlan = dealership?.plan || "V6";

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown size={20} className="text-yellow-500" /> Plan Actual
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Tu plan determina las funcionalidades disponibles
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {pendingRequest && (
              <Badge variant="warning" className="text-xs flex items-center gap-1">
                <Clock size={12} /> Cambio a {getPlan(pendingRequest.requestedPlan).name} pendiente
              </Badge>
            )}
            <Badge variant="info" className="text-sm px-3 py-1.5">
              {getPlan(currentPlan).name}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.values(PLANS) as typeof PLANS[PlanId][]).map((p) => {
            const isCurrent = currentPlan === p.id;
            const isUpgrade = Object.keys(PLANS).indexOf(p.id) > Object.keys(PLANS).indexOf(currentPlan);
            return (
              <div
                key={p.id}
                className={`rounded-xl p-4 border ${
                  isCurrent
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  {isCurrent && (
                    <Badge variant="success" className="text-xs">Actual</Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-white">{formatPlanPrice(p.price)}</p>
                <p className="text-xs text-gray-500 mb-3">/mes</p>
                <ul className="space-y-1.5 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <Check size={12} className={`mt-0.5 shrink-0 ${isCurrent ? "text-blue-400" : "text-gray-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isUpgrade && !pendingRequest && (
                  <button
                    onClick={() => handleUpgradeClick(p.id)}
                    className="w-full text-center py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1"
                  >
                    Cambiar a {p.name} <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">
              Cambiar a {getPlan(selectedPlan).name}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Para activar tu nuevo plan, realizá una transferencia por el monto correspondiente al siguiente alias:
            </p>

            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Monto mensual</p>
              <p className="text-2xl font-bold text-white">{formatPlanPrice(getPlan(selectedPlan).price)}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Alias de transferencia</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono text-blue-400 font-bold">{PAYMENT_ALIAS}</p>
                <button
                  onClick={copyAlias}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-gray-700 px-2 py-1 rounded"
                >
                  <Copy size={12} />
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-yellow-400">
                Una vez realizada la transferencia, hacé click en &quot;Solicitar cambio&quot;. Nuestro equipo verificará el pago y activará tu plan.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRequest}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Solicitar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success notification */}
      {requestSent && (
        <Card>
          <div className="flex items-center gap-3 text-green-400">
            <Check size={20} />
            <div>
              <p className="font-medium">¡Solicitud enviada!</p>
              <p className="text-sm text-gray-400">Tu solicitud de cambio de plan fue enviada. Te notificaremos cuando sea aprobada.</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

interface Dealership {
  id: string;
  name: string;
  email: string | null;
  cuit: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  logoUrl: string | null;
  schedule: string | null;
  videoUrl: string | null;
  description: string | null;
  saleContract: string | null;
  depositReceipt: string | null;
  consignmentContract: string | null;
  plan: string;
  metaIntegration: boolean;
  whatsappIntegration: boolean;
  mlIntegration: boolean;
}

export default function SettingsPage() {
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cuit: "",
    phone: "",
    province: "",
    city: "",
    street: "",
    streetNumber: "",
    schedule: "",
    videoUrl: "",
    description: "",
    saleContract: "",
    depositReceipt: "",
    consignmentContract: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dealership")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setDealership(data);
          setForm({
            name: data.name || "",
            email: data.email || "",
            cuit: data.cuit || "",
            phone: data.phone || "",
            province: data.province || "",
            city: data.city || "",
            street: data.street || "",
            streetNumber: data.streetNumber || "",
            schedule: data.schedule || "",
            videoUrl: data.videoUrl || "",
            description: data.description || "",
            saleContract: data.saleContract || "",
            depositReceipt: data.depositReceipt || "",
            consignmentContract: data.consignmentContract || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/dealership", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Configuraciones</h1>

      {/* Integrations */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Integraciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-medium">Meta</p>
                <p className="text-xs text-gray-400">Facebook & Instagram</p>
              </div>
            </div>
            <Badge variant={dealership?.metaIntegration ? "success" : "default"}>
              {dealership?.metaIntegration ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-xs text-gray-400">Business API</p>
              </div>
            </div>
            <Badge variant={dealership?.whatsappIntegration ? "success" : "default"}>
              {dealership?.whatsappIntegration ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="font-medium">Mercado Libre</p>
                <p className="text-xs text-gray-400">Publicaciones</p>
              </div>
            </div>
            <Badge variant={dealership?.mlIntegration ? "success" : "default"}>
              {dealership?.mlIntegration ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Plan */}
      <PlanSection dealership={dealership} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Nombre de la Agencia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="CUIT" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Ubicación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Provincia" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} options={PROVINCES.map((p) => ({ value: p, label: p }))} />
            <Input label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Calle" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input label="Número" value={form.streetNumber} onChange={(e) => setForm({ ...form, streetNumber: e.target.value })} />
          </div>
        </Card>

        {/* Image & Schedule */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Imagen y Horarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Logo de la Agencia</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500">
                <p className="text-sm">Arrastrá tu logo aquí</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Horario de Atención</label>
              <textarea
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 9:00 - 13:00"
              />
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Contenido</h2>
          <div className="space-y-4">
            <Input label="Video YouTube" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Advanced - Contracts */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Configuración Avanzada</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contrato de Compra-Venta</label>
              <textarea
                value={form.saleContract}
                onChange={(e) => setForm({ ...form, saleContract: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Texto del contrato..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Recibo de Seña</label>
              <textarea
                value={form.depositReceipt}
                onChange={(e) => setForm({ ...form, depositReceipt: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Texto del recibo..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contrato de Consignación</label>
              <textarea
                value={form.consignmentContract}
                onChange={(e) => setForm({ ...form, consignmentContract: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Texto del contrato..."
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          {saved && <span className="text-green-400 text-sm self-center">¡Guardado!</span>}
          <Button type="submit" disabled={loading}>
            <Save size={16} className="mr-2" />
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
