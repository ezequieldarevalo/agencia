"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Truck,
  Car,
  Wallet,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Gift,
  Plug,
  CalendarDays,
  BarChart3,
  Kanban,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/employees", icon: Users, label: "Empleados" },
  { href: "/dashboard/clients", icon: UserCircle, label: "Clientes" },
  { href: "/dashboard/suppliers", icon: Truck, label: "Proveedores" },
  { href: "/dashboard/vehicles", icon: Car, label: "Inventario" },
  { href: "/dashboard/cash", icon: Wallet, label: "Caja" },
  { href: "/dashboard/debts", icon: CreditCard, label: "Deudas" },
  { href: "/dashboard/leads", icon: MessageSquare, label: "Leads" },
  { href: "/dashboard/pipeline", icon: Kanban, label: "Pipeline" },
  { href: "/dashboard/calendar", icon: CalendarDays, label: "Agenda" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reportes" },
  { href: "/dashboard/integrations", icon: Plug, label: "Integraciones" },
  { href: "/dashboard/settings", icon: Settings, label: "Configuraciones" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 z-50">
      <Link
        href="/dashboard"
        className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-6"
      >
        <span className="text-white text-xl font-bold">A</span>
      </Link>

      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
              title={item.label}
            >
              <item.icon size={20} />
              <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center cursor-pointer group relative">
          <Gift size={18} className="text-white" />
          <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            ¡Ganá 1 mes gratis!
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group relative"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
          <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Cerrar sesión
          </span>
        </button>
      </div>
    </aside>
  );
}
