"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROVINCES } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  area: string;
  dni: string | null;
  province: string | null;
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  active: boolean;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  area: "VENTAS",
  dni: "",
  province: "",
  city: "",
  street: "",
  streetNumber: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = () => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchEmployees();
  };

  const handleEdit = (emp: Employee) => {
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      password: "",
      phone: emp.phone || "",
      area: emp.area,
      dni: emp.dni || "",
      province: emp.province || "",
      city: emp.city || "",
      street: emp.street || "",
      streetNumber: emp.streetNumber || "",
    });
    setEditingId(emp.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    fetchEmployees();
  };

  const columns = [
    {
      key: "name",
      label: "Nombre Completo",
      render: (e: Employee) => `${e.firstName} ${e.lastName}`,
    },
    { key: "email", label: "Email" },
    {
      key: "area",
      label: "Área",
      render: (e: Employee) => (
        <Badge variant={e.area === "ADMIN" ? "info" : "success"}>{e.area}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (e: Employee) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(e)} className="text-gray-400 hover:text-white">
            <Pencil size={16} />
          </button>
          <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Empleados</h1>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar empleados..."
        emptyMessage="No se encontraron empleados"
        actions={
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}>
            <Plus size={16} className="mr-2" />
            Agregar Empleado
          </Button>
        }
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Editar Empleado" : "Nuevo Empleado"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {!editingId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Usuario</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <Input
                label="Apellido"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Select
                label="Área"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                options={[
                  { value: "VENTAS", label: "Ventas" },
                  { value: "ADMIN", label: "Administración" },
                ]}
              />
              <Input
                label="DNI"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
              <Select
                label="Provincia"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                options={PROVINCES.map((p) => ({ value: p, label: p }))}
              />
              <Input
                label="Ciudad"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:col-span-2">
                <div className="col-span-2">
                  <Input
                    label="Calle"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                </div>
                <Input
                  label="Número"
                  value={form.streetNumber}
                  onChange={(e) => setForm({ ...form, streetNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
