"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight, X, Check } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/employees": "Empleados",
  "/dashboard/clients": "Clientes y Prospectos",
  "/dashboard/suppliers": "Proveedores",
  "/dashboard/vehicles": "Inventario",
  "/dashboard/cash": "Caja",
  "/dashboard/debts": "Deudas",
  "/dashboard/leads": "Leads",
  "/dashboard/integrations": "Integraciones",
  "/dashboard/integrations/meta": "Meta",
  "/dashboard/integrations/whatsapp": "WhatsApp",
  "/dashboard/integrations/mercadolibre": "MercadoLibre",
  "/dashboard/settings": "Configuraciones",
  "/dashboard/calendar": "Agenda",
  "/dashboard/reports": "Reportes",
  "/dashboard/pipeline": "Pipeline de Ventas",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += "/" + seg;
    const title = pageTitles[path];
    if (title) crumbs.push({ label: title, href: path });
  }
  return crumbs;
}

const typeIcon: Record<string, string> = {
  NEW_LEAD: "🎯",
  PAYMENT_RECEIVED: "💰",
  VEHICLE_SOLD: "🚗",
  DEBT_OVERDUE: "⚠️",
  ML_QUESTION: "❓",
  WA_MESSAGE: "💬",
  SYSTEM: "🔔",
  CALENDAR: "📅",
};

export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const crumbs = getBreadcrumbs(pathname);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read", id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-gray-600" />}
            {i === crumbs.length - 1 ? (
              <span className="text-white font-medium">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-gray-400 hover:text-white transition-colors">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm"
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="font-semibold text-sm">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                    Marcar todo como leído
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Sin notificaciones</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                        !n.read ? "bg-gray-800/30" : ""
                      }`}
                    >
                      <span className="text-lg mt-0.5">{typeIcon[n.type] || "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link href={n.link} onClick={() => { markRead(n.id); setShowNotifs(false); }} className="block">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-gray-400 truncate">{n.message}</p>
                          </Link>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-gray-400 truncate">{n.message}</p>
                          </>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(n.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="p-1 text-gray-500 hover:text-green-400">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
