"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { PROVINCES } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Supplier {
  id: string;
  personType: string;
  supplierType: string;
  supplierSubtype: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  cuit: string | null;
  cuil: string | null;
  sex: string | null;
  province: string | null;
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  observations: string | null;
}

const emptyForm = {
  personType: "FISICA",
  supplierType: "VEHICULOS",
  supplierSubtype: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dni: "",
  cuit: "",
  cuil: "",
  sex: "",
  province: "",
  city: "",
  street: "",
  streetNumber: "",
  observations: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = () => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {});
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const filtered = suppliers.filter((s) => {
    const matchSearch = `${s.firstName} ${s.lastName} ${s.email || ""}`.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "services") return matchSearch && s.supplierType === "SERVICIOS";
    if (activeTab === "vehicles") return matchSearch && s.supplierType === "VEHICULOS";
    return matchSearch;
  });

  const tabs = [
    { id: "all", label: "Todos", count: suppliers.length },
    { id: "services", label: "Servicios", count: suppliers.filter((s) => s.supplierType === "SERVICIOS").length },
    { id: "vehicles", label: "Vehículos", count: suppliers.filter((s) => s.supplierType === "VEHICULOS").length },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchSuppliers();
  };

  const handleEdit = (s: Supplier) => {
    setForm({
      personType: s.personType,
      supplierType: s.supplierType,
      supplierSubtype: s.supplierSubtype || "",
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email || "",
      phone: s.phone || "",
      dni: s.dni || "",
      cuit: s.cuit || "",
      cuil: s.cuil || "",
      sex: s.sex || "",
      province: s.province || "",
      city: s.city || "",
      street: s.street || "",
      streetNumber: s.streetNumber || "",
      observations: s.observations || "",
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    fetchSuppliers();
  };

  const columns = [
    { key: "name", label: "Nombre", render: (s: Supplier) => `${s.firstName} ${s.lastName}` },
    { key: "email", label: "Email", render: (s: Supplier) => s.email || "-" },
    { key: "phone", label: "Teléfono", render: (s: Supplier) => s.phone || "-" },
    {
      key: "supplierType",
      label: "Tipo",
      render: (s: Supplier) => (
        <Badge variant={s.supplierType === "VEHICULOS" ? "info" : "success"}>
          {s.supplierType}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (s: Supplier) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(s)} className="text-gray-400 hover:text-white"><Pencil size={16} /></button>
          <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Proveedores</h1>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar proveedores..."
        emptyMessage="No se encontraron proveedores"
        actions={
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}>
            <Plus size={16} className="mr-2" />
            Agregar Proveedor
          </Button>
        }
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Editar Proveedor" : "Nuevo Proveedor"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Persona"
              value={form.personType}
              onChange={(e) => setForm({ ...form, personType: e.target.value })}
              options={[{ value: "FISICA", label: "Física" }, { value: "JURIDICA", label: "Jurídica" }]}
            />
            <Select
              label="Tipo de Proveedor"
              value={form.supplierType}
              onChange={(e) => setForm({ ...form, supplierType: e.target.value })}
              options={[{ value: "VEHICULOS", label: "Vehículos" }, { value: "SERVICIOS", label: "Servicios" }]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
              <Input label="CUIT" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
              <Input label="CUIL" value={form.cuil} onChange={(e) => setForm({ ...form, cuil: e.target.value })} />
              <Select label="Sexo" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }, { value: "X", label: "No binario" }]} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Ubicación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Provincia" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} options={PROVINCES.map((p) => ({ value: p, label: p }))} />
              <Input label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="Calle" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              <Input label="Número" value={form.streetNumber} onChange={(e) => setForm({ ...form, streetNumber: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observaciones</label>
            <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Proveedor"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
