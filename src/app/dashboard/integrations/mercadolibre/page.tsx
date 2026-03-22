"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  ArrowLeft,
  Unplug,
  ExternalLink,
  Plus,
  RefreshCw,
  Pause,
  Play,
  XCircle,
  MessageSquare,
  Send,
  Eye,
  HelpCircle,
  Star,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface MlStatus {
  connected: boolean;
  userId?: string;
  connectedAt?: string;
}

interface MlListing {
  id: string;
  mlItemId: string | null;
  title: string;
  price: number;
  currency: string;
  listingType: string;
  status: string;
  permalink: string | null;
  views: number;
  questions: number;
  favorites: number;
  createdAt: string;
  vehicle?: { name: string } | null;
}

interface MlQuestion {
  id: string;
  mlQuestionId: string | null;
  question: string;
  answer: string | null;
  status: string;
  buyerNickname: string | null;
  createdAt: string;
  listing?: { title: string; mlItemId: string | null } | null;
}

interface Vehicle {
  id: string;
  name: string;
  priceARS: number;
  priceUSD: number | null;
  status: string;
  year: number | null;
  km: number | null;
}

type ActiveTab = "publicaciones" | "publicar" | "preguntas" | "stats";

export default function MercadoLibreIntegrationPage() {
  const [status, setStatus] = useState<MlStatus>({ connected: false });
  const [listings, setListings] = useState<MlListing[]>([]);
  const [questions, setQuestions] = useState<MlQuestion[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tab, setTab] = useState<ActiveTab>("publicaciones");
  const [showConnect, setShowConnect] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<MlQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Connect form
  const [connectForm, setConnectForm] = useState({
    accessToken: "",
    userId: "",
  });

  // Publish form
  const [publishForm, setPublishForm] = useState({
    vehicleId: "",
    title: "",
    price: "",
    currency: "ARS",
    listingType: "gold_special",
    categoryId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, listingsRes, questionsRes, vehiclesRes] = await Promise.all([
        fetch("/api/integrations/mercadolibre"),
        fetch("/api/integrations/mercadolibre?action=listings"),
        fetch("/api/integrations/mercadolibre?action=questions"),
        fetch("/api/vehicles"),
      ]);
      setStatus(await statusRes.json());
      const lData = await listingsRes.json();
      setListings(Array.isArray(lData) ? lData : []);
      const qData = await questionsRes.json();
      setQuestions(Array.isArray(qData) ? qData : []);
      const vData = await vehiclesRes.json();
      setVehicles(Array.isArray(vData) ? vData : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOAuth = async () => {
    try {
      const res = await fetch("/api/integrations/mercadolibre?action=auth-url");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Error al iniciar OAuth");
    }
  };

  const handleManualConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/mercadolibre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", accessToken: connectForm.accessToken, userId: connectForm.userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowConnect(false);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar MercadoLibre?")) return;
    await fetch("/api/integrations/mercadolibre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    fetchData();
  };

  const handlePublish = async () => {
    if (!publishForm.vehicleId || !publishForm.title || !publishForm.price) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/mercadolibre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          vehicleId: publishForm.vehicleId,
          title: publishForm.title,
          price: parseFloat(publishForm.price),
          currency: publishForm.currency,
          listingType: publishForm.listingType,
          categoryId: publishForm.categoryId || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowPublishModal(false);
      setPublishForm({ vehicleId: "", title: "", price: "", currency: "ARS", listingType: "gold_special", categoryId: "" });
      fetchData();
      alert("✅ Publicación creada");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (listingId: string, newStatus: string) => {
    await fetch("/api/integrations/mercadolibre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", listingId, status: newStatus }),
    });
    fetchData();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/integrations/mercadolibre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      fetchData();
    } catch {
      // ignore
    }
    setSyncing(false);
  };

  const handleAnswer = async () => {
    if (!answeringQuestion || !answerText) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/mercadolibre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer-question", questionId: answeringQuestion.id, answer: answerText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAnswerModal(false);
      setAnsweringQuestion(null);
      setAnswerText("");
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
      ACTIVE: "success", PAUSED: "warning", CLOSED: "danger", DRAFT: "default",
    };
    return map[s] || "default";
  };

  const activeListings = listings.filter((l) => l.status === "ACTIVE");
  const pendingQuestions = questions.filter((q) => q.status === "UNANSWERED");
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const totalFavs = listings.reduce((sum, l) => sum + l.favorites, 0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publishedVehicleIds = new Set(listings.map((l) => l.vehicle?.name));

  const tabs = [
    { id: "publicaciones" as const, label: "Publicaciones", count: listings.length },
    { id: "publicar" as const, label: "Publicar Nuevo" },
    { id: "preguntas" as const, label: "Preguntas", count: pendingQuestions.length },
    { id: "stats" as const, label: "Estadísticas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center">
          <ShoppingBag size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">MercadoLibre</h1>
          <p className="text-gray-400 text-sm">Publicación de vehículos</p>
        </div>
        <Badge variant={status.connected ? "success" : "default"} className="ml-2">
          {status.connected ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      {/* Connection */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Conexión</h2>
            {status.connected ? (
              <div className="text-sm text-gray-400 mt-1">
                <p>👤 User ID: <span className="text-white">{status.userId}</span></p>
                <p>🕒 Conectado: {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString("es-AR") : "N/A"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                Conectá MercadoLibre para publicar tus vehículos y gestionar preguntas
              </p>
            )}
          </div>
          {status.connected ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={16} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
              <Button variant="danger" size="sm" onClick={handleDisconnect}>
                <Unplug size={16} className="mr-2" />Desconectar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleOAuth}>
                <ExternalLink size={16} className="mr-2" />Conectar con OAuth
              </Button>
              <Button variant="ghost" onClick={() => setShowConnect(true)}>Manual</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Summary */}
      {status.connected && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center"><TrendingUp size={18} /></div>
              <div>
                <p className="text-2xl font-bold">{activeListings.length}</p>
                <p className="text-xs text-gray-400">Publicaciones activas</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-700 rounded-lg flex items-center justify-center"><HelpCircle size={18} /></div>
              <div>
                <p className="text-2xl font-bold">{pendingQuestions.length}</p>
                <p className="text-xs text-gray-400">Preguntas pendientes</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center"><Eye size={18} /></div>
              <div>
                <p className="text-2xl font-bold">{totalViews}</p>
                <p className="text-xs text-gray-400">Visitas totales</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-700 rounded-lg flex items-center justify-center"><Star size={18} /></div>
              <div>
                <p className="text-2xl font-bold">{totalFavs}</p>
                <p className="text-xs text-gray-400">Favoritos</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {status.connected && (
        <>
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label} {t.count !== undefined && t.count > 0 && <span className="ml-1 text-xs text-gray-500">({t.count})</span>}
              </button>
            ))}
          </div>

          {/* Listings Tab */}
          {tab === "publicaciones" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Publicaciones</h2>
                <Button size="sm" onClick={() => setTab("publicar")}>
                  <Plus size={16} className="mr-2" />Nueva publicación
                </Button>
              </div>
              {listings.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No hay publicaciones aún</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 px-3">Título</th>
                        <th className="text-left py-2 px-3">Item ID</th>
                        <th className="text-left py-2 px-3">Precio</th>
                        <th className="text-left py-2 px-3">Tipo</th>
                        <th className="text-left py-2 px-3">Estado</th>
                        <th className="text-center py-2 px-3">👁</th>
                        <th className="text-center py-2 px-3">❓</th>
                        <th className="text-center py-2 px-3">⭐</th>
                        <th className="text-right py-2 px-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((l) => (
                        <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-medium">{l.title}</p>
                              {l.vehicle && <p className="text-xs text-gray-400">{l.vehicle.name}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-400">{l.mlItemId || "—"}</td>
                          <td className="py-3 px-3 font-medium">{l.currency} ${l.price.toLocaleString("es-AR")}</td>
                          <td className="py-3 px-3">
                            <Badge variant={l.listingType === "gold_special" ? "warning" : l.listingType === "gold_pro" ? "info" : "default"}>
                              {l.listingType}
                            </Badge>
                          </td>
                          <td className="py-3 px-3"><Badge variant={statusColor(l.status)}>{l.status}</Badge></td>
                          <td className="py-3 px-3 text-center text-gray-400">{l.views}</td>
                          <td className="py-3 px-3 text-center text-gray-400">{l.questions}</td>
                          <td className="py-3 px-3 text-center text-gray-400">{l.favorites}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {l.permalink && (
                                <a href={l.permalink} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-white">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {l.status === "ACTIVE" && (
                                <button onClick={() => handleUpdateStatus(l.id, "PAUSED")} className="p-1.5 text-gray-400 hover:text-yellow-400" title="Pausar">
                                  <Pause size={14} />
                                </button>
                              )}
                              {l.status === "PAUSED" && (
                                <button onClick={() => handleUpdateStatus(l.id, "ACTIVE")} className="p-1.5 text-gray-400 hover:text-green-400" title="Activar">
                                  <Play size={14} />
                                </button>
                              )}
                              {l.status !== "CLOSED" && (
                                <button onClick={() => handleUpdateStatus(l.id, "CLOSED")} className="p-1.5 text-gray-400 hover:text-red-400" title="Cerrar">
                                  <XCircle size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Publish Tab */}
          {tab === "publicar" && (
            <Card>
              <h2 className="font-semibold mb-4">Nueva Publicación</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vehículo</label>
                  <select
                    value={publishForm.vehicleId}
                    onChange={(e) => {
                      const v = vehicles.find((vh) => vh.id === e.target.value);
                      if (v) {
                        setPublishForm({
                          ...publishForm,
                          vehicleId: v.id,
                          title: v.name + (v.year ? ` ${v.year}` : "") + (v.km ? ` - ${v.km.toLocaleString("es-AR")} km` : ""),
                          price: v.priceARS?.toString() || "",
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} - ${v.priceARS?.toLocaleString("es-AR")}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Título de la publicación (máx 60 caracteres)"
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value.slice(0, 60) })}
                  placeholder="Ej: Toyota Corolla 2020 - 45.000 km"
                />
                <p className="text-xs text-gray-500 -mt-2">{publishForm.title.length}/60</p>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Precio"
                    type="number"
                    value={publishForm.price}
                    onChange={(e) => setPublishForm({ ...publishForm, price: e.target.value })}
                    placeholder="0"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Moneda</label>
                    <select
                      value={publishForm.currency}
                      onChange={(e) => setPublishForm({ ...publishForm, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="ARS">ARS (Pesos)</option>
                      <option value="USD">USD (Dólares)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de publicación</label>
                    <select
                      value={publishForm.listingType}
                      onChange={(e) => setPublishForm({ ...publishForm, listingType: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="gold_special">Clásica (Gold Special)</option>
                      <option value="gold_pro">Premium (Gold Pro)</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="free">Gratuita</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="ID de Categoría (opcional)"
                  value={publishForm.categoryId}
                  onChange={(e) => setPublishForm({ ...publishForm, categoryId: e.target.value })}
                  placeholder="Se autodetecta si se deja vacío"
                />

                <div className="flex justify-end">
                  <Button onClick={handlePublish} disabled={loading || !publishForm.vehicleId || !publishForm.title || !publishForm.price}>
                    <Plus size={16} className="mr-2" />
                    {loading ? "Publicando..." : "Publicar en MercadoLibre"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Questions Tab */}
          {tab === "preguntas" && (
            <Card>
              <h2 className="font-semibold mb-4">Preguntas</h2>
              {questions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No hay preguntas</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {q.listing && <Badge variant="info">{q.listing.title}</Badge>}
                            <Badge variant={q.status === "UNANSWERED" ? "warning" : "success"}>{q.status === "UNANSWERED" ? "Pendiente" : "Respondida"}</Badge>
                          </div>
                          {q.buyerNickname && <p className="text-xs text-gray-400 mb-1">De: {q.buyerNickname}</p>}
                          <div className="flex items-start gap-2 mt-2">
                            <HelpCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-sm">{q.question}</p>
                          </div>
                          {q.answer && (
                            <div className="flex items-start gap-2 mt-2 ml-4">
                              <MessageSquare size={16} className="text-green-400 mt-0.5 shrink-0" />
                              <p className="text-sm text-gray-300">{q.answer}</p>
                            </div>
                          )}
                        </div>
                        {q.status === "UNANSWERED" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAnsweringQuestion(q);
                              setAnswerText("");
                              setShowAnswerModal(true);
                            }}
                          >
                            <Send size={14} className="mr-1" />Responder
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{new Date(q.createdAt).toLocaleString("es-AR")}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Stats Tab */}
          {tab === "stats" && (
            <div className="space-y-4">
              <Card>
                <h2 className="font-semibold mb-4">Rendimiento por Publicación</h2>
                {listings.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No hay datos</p>
                ) : (
                  <div className="space-y-3">
                    {listings.map((l) => (
                      <div key={l.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{l.title}</p>
                            <p className="text-xs text-gray-400">{l.mlItemId || "Sin ID ML"}</p>
                          </div>
                          <Badge variant={statusColor(l.status)}>{l.status}</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-green-400" />
                            <div>
                              <p className="text-sm font-medium">{l.currency} {l.price.toLocaleString("es-AR")}</p>
                              <p className="text-xs text-gray-400">Precio</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-blue-400" />
                            <div>
                              <p className="text-sm font-medium">{l.views}</p>
                              <p className="text-xs text-gray-400">Visitas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <HelpCircle size={14} className="text-yellow-400" />
                            <div>
                              <p className="text-sm font-medium">{l.questions}</p>
                              <p className="text-xs text-gray-400">Preguntas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-400" />
                            <div>
                              <p className="text-sm font-medium">{l.favorites}</p>
                              <p className="text-xs text-gray-400">Favoritos</p>
                            </div>
                          </div>
                        </div>
                        {l.views > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min((l.views / Math.max(...listings.map((x) => x.views))) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {/* Manual Connect Modal */}
      <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Conexión Manual MercadoLibre">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Si no podés usar OAuth, podés ingresar tus credenciales manualmente.
          </p>
          <Input
            label="Access Token"
            value={connectForm.accessToken}
            onChange={(e) => setConnectForm({ ...connectForm, accessToken: e.target.value })}
            placeholder="APP_USR-..."
          />
          <Input
            label="User ID"
            value={connectForm.userId}
            onChange={(e) => setConnectForm({ ...connectForm, userId: e.target.value })}
            placeholder="123456789"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowConnect(false)}>Cancelar</Button>
            <Button onClick={handleManualConnect} disabled={loading || !connectForm.accessToken || !connectForm.userId}>
              {loading ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Answer Question Modal */}
      <Modal open={showAnswerModal} onClose={() => setShowAnswerModal(false)} title="Responder Pregunta">
        <div className="space-y-4">
          {answeringQuestion && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Pregunta de {answeringQuestion.buyerNickname || "comprador"}:</p>
              <p className="text-sm">{answeringQuestion.question}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tu respuesta</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Escribí tu respuesta..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAnswerModal(false)}>Cancelar</Button>
            <Button onClick={handleAnswer} disabled={loading || !answerText}>
              {loading ? "Enviando..." : "Responder"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
