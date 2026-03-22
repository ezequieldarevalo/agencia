"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Car,
  UserCircle,
  Trash2,
  CalendarDays,
  Phone,
  MapPin,
  FileText,
  TestTube,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  allDay: boolean;
  description: string | null;
  completed: boolean;
  color: string | null;
  client?: { firstName: string; lastName: string; phone: string | null } | null;
  vehicle?: { name: string; domain: string | null } | null;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Vehicle {
  id: string;
  name: string;
}

const EVENT_TYPES = [
  { value: "TEST_DRIVE", label: "Test Drive", color: "#3b82f6", icon: "🚗" },
  { value: "SEGUIMIENTO", label: "Seguimiento", color: "#8b5cf6", icon: "📞" },
  { value: "PAGO", label: "Pago", color: "#22c55e", icon: "💰" },
  { value: "ENTREGA", label: "Entrega", color: "#f59e0b", icon: "🔑" },
  { value: "REUNION", label: "Reunión", color: "#ef4444", icon: "👥" },
  { value: "OTRO", label: "Otro", color: "#6b7280", icon: "📌" },
];

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"month" | "list">("month");

  const [form, setForm] = useState({
    title: "",
    type: "SEGUIMIENTO",
    date: "",
    time: "10:00",
    description: "",
    clientId: "",
    vehicleId: "",
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch {}
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
    ]).then(([c, v]) => {
      if (Array.isArray(c)) setClients(c);
      if (Array.isArray(v)) setVehicles(v);
    });
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const goToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    setLoading(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time || "10:00"}:00`);
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: form.title,
          type: form.type,
          date: dateTime.toISOString(),
          description: form.description || null,
          clientId: form.clientId || null,
          vehicleId: form.vehicleId || null,
          color: EVENT_TYPES.find((t) => t.value === form.type)?.color || null,
        }),
      });
      setShowModal(false);
      setForm({ title: "", type: "SEGUIMIENTO", date: "", time: "10:00", description: "", clientId: "", vehicleId: "" });
      fetchEvents();
    } catch {}
    setLoading(false);
  };

  const handleToggle = async (id: string) => {
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-complete", id }),
    });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchEvents();
  };

  const openNewEvent = (date?: string) => {
    const d = date || `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setForm({ ...form, date: d, title: "", description: "", clientId: "", vehicleId: "" });
    setShowModal(true);
  };

  // Calendar grid calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date.startsWith(dateStr));
  };

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date.startsWith(selectedDate))
    : [];

  const upcomingEvents = events
    .filter((e) => !e.completed && new Date(e.date) >= new Date(today))
    .slice(0, 10);

  const typeInfo = (type: string) => EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[5];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView("month")} className={`px-3 py-1 rounded-md text-sm ${view === "month" ? "bg-gray-700 text-white" : "text-gray-400"}`}>Mes</button>
            <button onClick={() => setView("list")} className={`px-3 py-1 rounded-md text-sm ${view === "list" ? "bg-gray-700 text-white" : "text-gray-400"}`}>Lista</button>
          </div>
          <Button onClick={() => openNewEvent()}>
            <Plus size={16} className="mr-2" />Nuevo Evento
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-4 gap-4">
          {/* Calendar */}
          <div className="col-span-3">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
                  <h2 className="text-lg font-semibold min-w-[200px] text-center">
                    {MONTHS[currentMonth]} {currentYear}
                  </h2>
                  <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-white"><ChevronRight size={20} /></button>
                </div>
                <button onClick={goToday} className="text-sm text-blue-400 hover:text-blue-300">Hoy</button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-gray-800/30 rounded-lg" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = getEventsForDay(day);
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                      onDoubleClick={() => openNewEvent(dateStr)}
                      className={`h-24 p-1.5 rounded-lg text-left transition-colors relative ${
                        isSelected ? "bg-blue-900/30 ring-1 ring-blue-500" : "bg-gray-800/50 hover:bg-gray-800"
                      }`}
                    >
                      <span className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday ? "bg-blue-600 text-white" : "text-gray-300"
                      }`}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-1 text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                            style={{ backgroundColor: (e.color || typeInfo(e.type).color) + "30", color: e.color || typeInfo(e.type).color }}
                          >
                            <span>{typeInfo(e.type).icon}</span>
                            <span className={`truncate ${e.completed ? "line-through opacity-50" : ""}`}>{e.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} más</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedDate ? (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <button onClick={() => openNewEvent(selectedDate)} className="text-blue-400 hover:text-blue-300">
                    <Plus size={16} />
                  </button>
                </div>
                {selectedEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Sin eventos</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e) => (
                      <div key={e.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <button onClick={() => handleToggle(e.id)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              e.completed ? "bg-green-600 border-green-600" : "border-gray-600 hover:border-gray-400"
                            }`}>
                              {e.completed && <Check size={10} />}
                            </button>
                            <div>
                              <p className={`text-sm font-medium ${e.completed ? "line-through text-gray-500" : ""}`}>{e.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="default" className="text-[10px]">{typeInfo(e.type).icon} {typeInfo(e.type).label}</Badge>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(e.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {e.client && <p className="text-xs text-gray-400 mt-1">👤 {e.client.firstName} {e.client.lastName}</p>}
                              {e.vehicle && <p className="text-xs text-gray-400">🚗 {e.vehicle.name}</p>}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(e.id)} className="text-gray-500 hover:text-red-400 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <h3 className="font-semibold text-sm mb-3">Próximos Eventos</h3>
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Sin eventos próximos</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-800 last:border-0">
                        <span>{typeInfo(e.type).icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm">{e.title}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(e.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {new Date(e.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Event type legend */}
            <Card>
              <h3 className="font-semibold text-sm mb-3">Tipos de Evento</h3>
              <div className="space-y-1.5">
                {EVENT_TYPES.map((t) => (
                  <div key={t.value} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span>{t.icon} {t.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <h2 className="font-semibold mb-4">Todos los Eventos del Mes</h2>
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin eventos en {MONTHS[currentMonth]}</p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <button onClick={() => handleToggle(e.id)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    e.completed ? "bg-green-600 border-green-600" : "border-gray-600 hover:border-gray-400"
                  }`}>
                    {e.completed && <Check size={12} />}
                  </button>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color || typeInfo(e.type).color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${e.completed ? "line-through text-gray-500" : ""}`}>{e.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{new Date(e.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span>
                      <span>{new Date(e.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {e.client && <span>👤 {e.client.firstName} {e.client.lastName}</span>}
                      {e.vehicle && <span>🚗 {e.vehicle.name}</span>}
                    </div>
                  </div>
                  <Badge variant="default">{typeInfo(e.type).label}</Badge>
                  <button onClick={() => handleDelete(e.id)} className="text-gray-500 hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* New Event Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Evento">
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Test drive con Juan"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    form.type === t.value
                      ? "ring-2 ring-offset-1 ring-offset-gray-900 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                  style={{ backgroundColor: form.type === t.value ? t.color + "40" : undefined }}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Hora" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Vehículo</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Sin vehículo</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading || !form.title || !form.date}>
              {loading ? "Creando..." : "Crear Evento"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
