"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { PROVINCES, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, MessageCircle } from "lucide-react";

interface Client {
  id: string;
  personType: string;
  clientType: string;
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
  lastContact: string | null;
  createdAt: string;
}

const emptyForm = {
  personType: "FISICA",
  clientType: "CLIENTE",
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchClients = () => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    const matchSearch = `${c.firstName} ${c.lastName} ${c.email || ""}`.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "clients") return matchSearch && c.clientType === "CLIENTE";
    if (activeTab === "prospects") return matchSearch && c.clientType === "PROSPECTO";
    return matchSearch;
  });

  const tabs = [
    { id: "all", label: "Todos", count: clients.length },
    { id: "clients", label: "Clientes", count: clients.filter((c) => c.clientType === "CLIENTE").length },
    { id: "prospects", label: "Prospectos", count: clients.filter((c) => c.clientType === "PROSPECTO").length },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchClients();
  };

  const handleEdit = (c: Client) => {
    setForm({
      personType: c.personType,
      clientType: c.clientType,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email || "",
      phone: c.phone || "",
      dni: c.dni || "",
      cuit: c.cuit || "",
      cuil: c.cuil || "",
      sex: c.sex || "",
      province: c.province || "",
      city: c.city || "",
      street: c.street || "",
      streetNumber: c.streetNumber || "",
      observations: c.observations || "",
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
  };

  const handleWhatsAppSend = async (client: Client) => {
    if (!client.phone) { alert("Este cliente no tiene teléfono registrado"); return; }
    const text = prompt("Mensaje para " + client.firstName + ":");
    if (!text) return;
    try {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-text", phone: client.phone, text, clientId: client.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("✅ Mensaje enviado por WhatsApp");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al enviar");
    }
  };

  const columns = [
    { key: "name", label: "Nombre", render: (c: Client) => `${c.firstName} ${c.lastName}` },
    { key: "email", label: "Email", render: (c: Client) => c.email || "-" },
    { key: "phone", label: "Teléfono", render: (c: Client) => c.phone || "-" },
    {
      key: "clientType",
      label: "Tipo",
      render: (c: Client) => (
        <Badge variant={c.clientType === "CLIENTE" ? "success" : "warning"}>
          {c.clientType}
        </Badge>
      ),
    },
    { key: "createdAt", label: "Alta", render: (c: Client) => formatDate(c.createdAt) },
    { key: "lastContact", label: "Último contacto", render: (c: Client) => c.lastContact ? formatDate(c.lastContact) : "-" },
    {
      key: "actions",
      label: "Acciones",
      render: (c: Client) => (
        <div className="flex gap-2">
          {c.phone && <button onClick={() => handleWhatsAppSend(c)} className="text-gray-400 hover:text-green-400" title="Enviar WhatsApp"><MessageCircle size={16} /></button>}
          <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-white"><Pencil size={16} /></button>
          <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes y Prospectos</h1>
      </div>

      <div className="flex items-center justify-between">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar clientes..."
        emptyMessage="No se encontraron clientes"
        actions={
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}>
            <Plus size={16} className="mr-2" />
            Agregar
          </Button>
        }
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Editar Cliente" : "Nuevo Cliente"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Persona"
              value={form.personType}
              onChange={(e) => setForm({ ...form, personType: e.target.value })}
              options={[
                { value: "FISICA", label: "Física" },
                { value: "JURIDICA", label: "Jurídica" },
              ]}
            />
            <Select
              label="Tipo de Cliente"
              value={form.clientType}
              onChange={(e) => setForm({ ...form, clientType: e.target.value })}
              options={[
                { value: "CLIENTE", label: "Cliente" },
                { value: "PROSPECTO", label: "Prospecto" },
              ]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
              <Input label="CUIT" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
              <Input label="CUIL" value={form.cuil} onChange={(e) => setForm({ ...form, cuil: e.target.value })} />
              <Select
                label="Sexo"
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                options={[
                  { value: "M", label: "Masculino" },
                  { value: "F", label: "Femenino" },
                  { value: "X", label: "No binario" },
                ]}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Ubicación</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Provincia"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                options={PROVINCES.map((p) => ({ value: p, label: p }))}
              />
              <Input label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="Calle" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              <Input label="Número" value={form.streetNumber} onChange={(e) => setForm({ ...form, streetNumber: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
