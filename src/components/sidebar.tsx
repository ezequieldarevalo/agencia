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
  X,
  Shield,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePlan } from "@/components/plan-provider";

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

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { plan } = usePlan();
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as { role?: string })?.role === "SUPERADMIN";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 lg:w-16 bg-gray-900 border-r border-gray-800 flex flex-col py-4 z-50 transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 lg:justify-center lg:px-0 mb-6">
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"
          >
            <span className="text-white text-xl font-bold">A</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 lg:items-center lg:px-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const isAllowed = plan.routes.includes(item.href);
            if (!isAllowed) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 lg:w-10 lg:h-10 lg:p-0 lg:justify-center rounded-lg transition-colors group relative",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title={item.label}
              >
                <item.icon size={20} className="shrink-0" />
                <span className="text-sm lg:hidden">{item.label}</span>
                <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 px-3 lg:items-center lg:px-0 mb-2">
          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 lg:w-10 lg:h-10 lg:p-0 lg:justify-center rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors group relative"
              title="Admin Console"
            >
              <Shield size={18} className="shrink-0" />
              <span className="text-sm lg:hidden">Admin Console</span>
              <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                Admin Console
              </span>
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-2.5 lg:w-10 lg:h-10 lg:p-0 lg:justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 cursor-pointer group relative">
            <Gift size={18} className="text-white shrink-0" />
            <span className="text-sm text-white lg:hidden">¡Ganá 1 mes gratis!</span>
            <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
              ¡Ganá 1 mes gratis!
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 lg:w-10 lg:h-10 lg:p-0 lg:justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group relative"
            title="Cerrar sesión"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-sm lg:hidden">Cerrar sesión</span>
            <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
