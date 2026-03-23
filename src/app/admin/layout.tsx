"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield,
  Users,
  Building2,
  FileText,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const adminNavItems = [
  { href: "/admin", icon: Shield, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Usuarios" },
  { href: "/admin/dealerships", icon: Building2, label: "Agencias" },
  { href: "/admin/plan-requests", icon: FileText, label: "Solicitudes de Plan" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    const role = (session.user as { role: string }).role;
    if (role !== "SUPERADMIN") {
      router.push("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [session, status, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Verificando permisos...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
        <div className="flex items-center gap-3 px-4 mb-6">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Console</p>
            <p className="text-xs text-gray-500">Autogestor</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 px-3 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Volver al Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 flex items-center px-6">
          <p className="text-sm text-gray-400">
            Sesión: <span className="text-white">{session?.user?.email}</span>
          </p>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
