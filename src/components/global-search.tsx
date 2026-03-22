"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Car,
  UserCircle,
  Truck,
  CreditCard,
  Wallet,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Calendar,
  BarChart3,
  Plug,
  X,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "vehicle" | "client" | "supplier" | "page";
  title: string;
  subtitle: string;
  href: string;
}

const quickPages: SearchResult[] = [
  { id: "p-dash", type: "page", title: "Dashboard", subtitle: "Ir al dashboard", href: "/dashboard" },
  { id: "p-vehicles", type: "page", title: "Inventario", subtitle: "Ver vehículos", href: "/dashboard/vehicles" },
  { id: "p-clients", type: "page", title: "Clientes", subtitle: "Ver clientes y prospectos", href: "/dashboard/clients" },
  { id: "p-suppliers", type: "page", title: "Proveedores", subtitle: "Ver proveedores", href: "/dashboard/suppliers" },
  { id: "p-cash", type: "page", title: "Caja", subtitle: "Movimientos y arqueo", href: "/dashboard/cash" },
  { id: "p-debts", type: "page", title: "Deudas", subtitle: "Financiamiento y pagos", href: "/dashboard/debts" },
  { id: "p-leads", type: "page", title: "Leads", subtitle: "Seguimiento de interacciones", href: "/dashboard/leads" },
  { id: "p-pipeline", type: "page", title: "Pipeline de Ventas", subtitle: "Kanban de leads", href: "/dashboard/pipeline" },
  { id: "p-calendar", type: "page", title: "Agenda", subtitle: "Calendario de eventos", href: "/dashboard/calendar" },
  { id: "p-reports", type: "page", title: "Reportes", subtitle: "Análisis y estadísticas", href: "/dashboard/reports" },
  { id: "p-integrations", type: "page", title: "Integraciones", subtitle: "Meta, WhatsApp, MercadoLibre", href: "/dashboard/integrations" },
  { id: "p-settings", type: "page", title: "Configuraciones", subtitle: "Datos de la agencia", href: "/dashboard/settings" },
];

const typeIcons: Record<string, typeof Car> = {
  vehicle: Car,
  client: UserCircle,
  supplier: Truck,
  page: ArrowRight,
};

const typeColors: Record<string, string> = {
  vehicle: "text-blue-400",
  client: "text-green-400",
  supplier: "text-yellow-400",
  page: "text-gray-400",
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) onClose(); // toggle handled by parent
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      // Also filter quick pages
      const matchingPages = quickPages.filter(
        (p) =>
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(q.toLowerCase())
      );
      setResults([...data, ...matchingPages].slice(0, 12));
    } catch {
      setResults(quickPages.filter(
        (p) =>
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(q.toLowerCase())
      ));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const displayResults = query ? results : quickPages.slice(0, 8);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, displayResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && displayResults[selected]) {
      navigate(displayResults[selected].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Search panel */}
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar vehículos, clientes, proveedores, páginas..."
            className="flex-1 py-3.5 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500 border border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {!query && (
            <p className="px-4 py-1.5 text-xs text-gray-500 font-medium uppercase">Ir a...</p>
          )}
          {query && displayResults.length === 0 && !loading && (
            <p className="text-gray-500 text-sm text-center py-6">
              No se encontraron resultados para &quot;{query}&quot;
            </p>
          )}
          {displayResults.map((r, i) => {
            const Icon = typeIcons[r.type] || ArrowRight;
            return (
              <button
                key={r.id}
                onClick={() => navigate(r.href)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selected ? "bg-gray-800" : "hover:bg-gray-800/50"
                }`}
              >
                <Icon size={16} className={typeColors[r.type] || "text-gray-400"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                </div>
                {i === selected && (
                  <span className="text-xs text-gray-500">↵</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">↵</kbd> ir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
