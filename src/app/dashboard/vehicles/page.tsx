"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Printer, Facebook, Instagram, ShoppingBag } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  status: string;
  category: string;
  kilometers: number | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  version: string | null;
  priceARS: number | null;
  priceUSD: number | null;
  currency: string;
  exchangeRate: number | null;
  fuel: string | null;
  color: string | null;
  doors: number | null;
  bodyType: string | null;
  transmission: string | null;
  engine: string | null;
  domain: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  description: string | null;
  locationProvince: string | null;
  locationCity: string | null;
  contactPhone: string | null;
  notes: string | null;
  published: boolean;
  supplierId: string | null;
  supplier?: { firstName: string; lastName: string } | null;
}

const emptyForm = {
  name: "",
  status: "DISPONIBLE",
  category: "AUTOS_Y_CAMIONETAS",
  kilometers: "",
  brand: "",
  model: "",
  year: "",
  version: "",
  priceARS: "",
  priceUSD: "",
  currency: "ARS",
  exchangeRate: "",
  fuel: "",
  color: "",
  doors: "",
  bodyType: "",
  transmission: "",
  engine: "",
  domain: "",
  engineNumber: "",
  chassisNumber: "",
  description: "",
  locationProvince: "",
  locationCity: "",
  contactPhone: "",
  notes: "",
  published: false,
  supplierId: "",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchVehicles = () => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(setVehicles)
      .catch(() => {});
  };

  useEffect(() => { fetchVehicles(); }, []);

  const filtered = vehicles.filter((v) =>
    `${v.name} ${v.domain || ""} ${v.brand || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const available = vehicles.filter((v) => v.status === "DISPONIBLE").length;
  const published = vehicles.filter((v) => v.published).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
    const method = editingId ? "PUT" : "POST";
    const body = {
      ...form,
      kilometers: form.kilometers ? parseInt(form.kilometers) : null,
      year: form.year ? parseInt(form.year) : null,
      priceARS: form.priceARS ? parseFloat(form.priceARS) : null,
      priceUSD: form.priceUSD ? parseFloat(form.priceUSD) : null,
      exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : null,
      doors: form.doors ? parseInt(form.doors) : null,
    };
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchVehicles();
  };

  const handleEdit = (v: Vehicle) => {
    setForm({
      name: v.name,
      status: v.status,
      category: v.category,
      kilometers: v.kilometers?.toString() || "",
      brand: v.brand || "",
      model: v.model || "",
      year: v.year?.toString() || "",
      version: v.version || "",
      priceARS: v.priceARS?.toString() || "",
      priceUSD: v.priceUSD?.toString() || "",
      currency: v.currency,
      exchangeRate: v.exchangeRate?.toString() || "",
      fuel: v.fuel || "",
      color: v.color || "",
      doors: v.doors?.toString() || "",
      bodyType: v.bodyType || "",
      transmission: v.transmission || "",
      engine: v.engine || "",
      domain: v.domain || "",
      engineNumber: v.engineNumber || "",
      chassisNumber: v.chassisNumber || "",
      description: v.description || "",
      locationProvince: v.locationProvince || "",
      locationCity: v.locationCity || "",
      contactPhone: v.contactPhone || "",
      notes: v.notes || "",
      published: v.published,
      supplierId: v.supplierId || "",
    });
    setEditingId(v.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este vehículo?")) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    fetchVehicles();
  };

  const handleQuickPublish = async (vehicleId: string, platform: string) => {
    try {
      let url = "";
      let body: Record<string, unknown> = {};
      if (platform === "facebook" || platform === "instagram") {
        url = "/api/integrations/meta";
        body = { action: `publish-${platform}`, vehicleId };
      } else if (platform === "mercadolibre") {
        url = "/api/integrations/mercadolibre";
        const v = vehicles.find((vh) => vh.id === vehicleId);
        body = { action: "publish", vehicleId, title: v?.name || "", price: v?.priceARS || 0 };
      }
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(`✅ Publicado en ${platform}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al publicar");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info"> = {
      DISPONIBLE: "success",
      RESERVADO: "warning",
      VENDIDO: "danger",
      EN_PROCESO: "info",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "domain", label: "Dominio", render: (v: Vehicle) => v.domain || "-" },
    { key: "status", label: "Estado", render: (v: Vehicle) => statusBadge(v.status) },
    {
      key: "price",
      label: "Precio",
      render: (v: Vehicle) =>
        v.currency === "USD"
          ? formatCurrency(v.priceUSD || 0, "USD")
          : formatCurrency(v.priceARS || 0, "ARS"),
    },
    {
      key: "supplier",
      label: "Proveedor",
      render: (v: Vehicle) =>
        v.supplier ? `${v.supplier.firstName} ${v.supplier.lastName}` : "-",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (v: Vehicle) => (
        <div className="flex gap-1">
          <button onClick={() => handleQuickPublish(v.id, "facebook")} className="text-gray-400 hover:text-blue-400" title="Publicar en Facebook"><Facebook size={15} /></button>
          <button onClick={() => handleQuickPublish(v.id, "instagram")} className="text-gray-400 hover:text-pink-400" title="Publicar en Instagram"><Instagram size={15} /></button>
          <button onClick={() => handleQuickPublish(v.id, "mercadolibre")} className="text-gray-400 hover:text-yellow-400" title="Publicar en MercadoLibre"><ShoppingBag size={15} /></button>
          <button onClick={() => handleEdit(v)} className="text-gray-400 hover:text-white"><Pencil size={16} /></button>
          <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Inventario</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            Disponibles: <span className="text-green-400 font-semibold">{available}</span>
          </span>
          <span className="text-gray-400">
            Publicados: <span className="text-blue-400 font-semibold">{published}</span>
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar vehículos..."
        emptyMessage="No se encontraron vehículos"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Printer size={16} className="mr-1" /> Imprimir</Button>
            <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}>
              <Plus size={16} className="mr-2" />
              Agregar Vehículo
            </Button>
          </div>
        }
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Editar Vehículo" : "Nuevo Vehículo"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fotos placeholder */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Fotos del Vehículo</h3>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500">
              <p>Arrastrá tus fotos aquí o hacé click para subir</p>
              <p className="text-xs mt-1">JPG, PNG hasta 5MB</p>
            </div>
          </div>

          {/* Información Principal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Información Principal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="sm:col-span-2 lg:col-span-3" />
              <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
                { value: "DISPONIBLE", label: "Disponible" },
                { value: "RESERVADO", label: "Reservado" },
                { value: "VENDIDO", label: "Vendido" },
                { value: "EN_PROCESO", label: "En proceso" },
              ]} />
              <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[
                { value: "AUTOS_Y_CAMIONETAS", label: "Autos y Camionetas" },
                { value: "MOTOS", label: "Motos" },
                { value: "CAMIONES", label: "Camiones" },
                { value: "OTROS", label: "Otros" },
              ]} />
              <Input label="Kilómetros" type="number" value={form.kilometers} onChange={(e) => setForm({ ...form, kilometers: e.target.value })} />
              <Input label="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <Input label="Modelo" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <Input label="Año" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              <Input label="Versión" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </div>
          </div>

          {/* Precio */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Precio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={[
                { value: "ARS", label: "ARS - Pesos" },
                { value: "USD", label: "USD - Dólares" },
              ]} />
              <Input label="Precio ARS" type="number" value={form.priceARS} onChange={(e) => setForm({ ...form, priceARS: e.target.value })} />
              <Input label="Precio USD" type="number" value={form.priceUSD} onChange={(e) => setForm({ ...form, priceUSD: e.target.value })} />
              <Input label="Cotización USD" type="number" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} />
            </div>
          </div>

          {/* Detalles Técnicos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Detalles Técnicos</h3>
              <button type="button" onClick={() => setShowDetails(!showDetails)} className="text-xs text-blue-400 hover:text-blue-300">
                {showDetails ? "Ocultar detalles" : "Ver más detalles"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select label="Combustible" value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })} options={[
                { value: "NAFTA", label: "Nafta" },
                { value: "DIESEL", label: "Diesel" },
                { value: "GNC", label: "GNC" },
                { value: "HIBRIDO", label: "Híbrido" },
                { value: "ELECTRICO", label: "Eléctrico" },
              ]} />
              <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Input label="Puertas" type="number" value={form.doors} onChange={(e) => setForm({ ...form, doors: e.target.value })} />
              <Select label="Carrocería" value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} options={[
                { value: "SEDAN", label: "Sedán" },
                { value: "HATCHBACK", label: "Hatchback" },
                { value: "SUV", label: "SUV" },
                { value: "PICKUP", label: "Pick-up" },
                { value: "COUPE", label: "Coupé" },
                { value: "CONVERTIBLE", label: "Convertible" },
                { value: "VAN", label: "Van" },
              ]} />
            </div>
            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Select label="Transmisión" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} options={[
                  { value: "MANUAL", label: "Manual" },
                  { value: "AUTOMATICA", label: "Automática" },
                  { value: "CVT", label: "CVT" },
                ]} />
                <Input label="Motor" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Identificación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Identificación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Dominio" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
              <Input label="Nro. Motor" value={form.engineNumber} onChange={(e) => setForm({ ...form, engineNumber: e.target.value })} />
              <Input label="Nro. Chasis" value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })} />
            </div>
          </div>

          {/* Ubicación y Contacto */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Ubicación y Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Provincia" value={form.locationProvince} onChange={(e) => setForm({ ...form, locationProvince: e.target.value })} />
              <Input label="Ciudad" value={form.locationCity} onChange={(e) => setForm({ ...form, locationCity: e.target.value })} />
              <Input label="Teléfono de contacto" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Vehículo"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
