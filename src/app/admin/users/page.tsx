"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Trash2, UserCog } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  dealership: { id: string; name: string; plan: string; email: string | null } | null;
}

const ROLE_OPTIONS = [
  { value: "USER", label: "Usuario" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERADMIN", label: "Super Admin" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    loadUsers();
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar usuario ${email}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    loadUsers();
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPERADMIN": return "danger" as const;
      case "ADMIN": return "info" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCog size={24} /> Usuarios
        </h1>
        <p className="text-sm text-gray-400">{users.length} usuarios</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rol</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Agencia</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Creado</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{user.email}</td>
                    <td className="py-3 px-4 text-gray-300">{user.name || "—"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{user.dealership?.name || "—"}</td>
                    <td className="py-3 px-4">
                      {user.dealership ? (
                        <Badge variant="info">{user.dealership.plan}</Badge>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          options={ROLE_OPTIONS}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.email)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
