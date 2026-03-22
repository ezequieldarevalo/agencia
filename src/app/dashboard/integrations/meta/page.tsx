"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  ArrowLeft,
  Unplug,
  Facebook,
  Instagram,
  Send,
  Trash2,
  Eye,
  MousePointerClick,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface MetaStatus {
  connected: boolean;
  pageName?: string;
  igUsername?: string;
  connectedAt?: string;
}

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  priceARS: number;
  status: string;
  photos: { url: string }[];
}

interface Publication {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  platform: string;
  postId: string | null;
  status: string;
  message: string;
  publishedAt: string | null;
  reach: number;
  clicks: number;
  inquiries: number;
  errorMessage: string | null;
  createdAt: string;
}

export default function MetaIntegrationPage() {
  const [status, setStatus] = useState<MetaStatus>({ connected: false });
  const [publications, setPublications] = useState<Publication[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [connectToken, setConnectToken] = useState("");
  const [publishVehicleId, setPublishVehicleId] = useState("");
  const [publishPlatform, setPublishPlatform] = useState<"FACEBOOK" | "INSTAGRAM">("FACEBOOK");
  const [publishMessage, setPublishMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, pubsRes, vehiclesRes] = await Promise.all([
        fetch("/api/integrations/meta"),
        fetch("/api/integrations/meta?action=publications"),
        fetch("/api/vehicles"),
      ]);
      setStatus(await statusRes.json());
      setPublications(await pubsRes.json());
      const vData = await vehiclesRes.json();
      setVehicles(Array.isArray(vData) ? vData.filter((v: Vehicle) => v.status === "DISPONIBLE") : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConnect = async () => {
    if (!connectToken.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", accessToken: connectToken }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowConnect(false);
      setConnectToken("");
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error conectando Meta");
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Meta? Las publicaciones existentes se mantendrán.")) return;
    await fetch("/api/integrations/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    fetchData();
  };

  const handlePublish = async () => {
    if (!publishVehicleId) return;
    setLoading(true);
    try {
      const action = publishPlatform === "FACEBOOK" ? "publish-facebook" : "publish-instagram";
      const res = await fetch("/api/integrations/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          vehicleId: publishVehicleId,
          message: publishMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowPublish(false);
      setPublishVehicleId("");
      setPublishMessage("");
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error publicando");
    }
    setLoading(false);
  };

  const handleRemove = async (pubId: string) => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    await fetch("/api/integrations/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", publicationId: pubId }),
    });
    fetchData();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "PUBLISHED": return "success";
      case "FAILED": return "danger";
      case "REMOVED": return "default";
      default: return "warning";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "PUBLISHED": return "Publicado";
      case "FAILED": return "Error";
      case "REMOVED": return "Eliminado";
      case "DRAFT": return "Borrador";
      default: return s;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Globe size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Meta</h1>
          <p className="text-gray-400 text-sm">Facebook & Instagram</p>
        </div>
        <Badge variant={status.connected ? "success" : "default"} className="ml-2">
          {status.connected ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      {/* Connection Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Conexión</h2>
            {status.connected ? (
              <div className="text-sm text-gray-400 mt-1 space-y-1">
                <p>📄 Página: <span className="text-white">{status.pageName}</span></p>
                {status.igUsername && (
                  <p>📸 Instagram: <span className="text-white">@{status.igUsername}</span></p>
                )}
                <p>🕒 Conectado: {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString("es-AR") : "N/A"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                Conectá tu página de Facebook para publicar vehículos
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {status.connected ? (
              <Button variant="danger" size="sm" onClick={handleDisconnect}>
                <Unplug size={16} className="mr-2" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={() => setShowConnect(true)}>
                <Globe size={16} className="mr-2" />
                Conectar Meta
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      {status.connected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <button
              onClick={() => { setPublishPlatform("FACEBOOK"); setShowPublish(true); }}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Facebook size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium">Publicar en Facebook</p>
                <p className="text-xs text-gray-400">Compartir vehículo en tu página</p>
              </div>
            </button>
          </Card>
          <Card>
            <button
              onClick={() => { setPublishPlatform("INSTAGRAM"); setShowPublish(true); }}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <Instagram size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium">Publicar en Instagram</p>
                <p className="text-xs text-gray-400">Compartir con foto en Instagram</p>
              </div>
            </button>
          </Card>
        </div>
      )}

      {/* Publications List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Publicaciones</h2>
          <button onClick={fetchData} className="text-gray-400 hover:text-white">
            <RefreshCw size={16} />
          </button>
        </div>
        {publications.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No hay publicaciones aún. {status.connected ? "¡Publicá tu primer vehículo!" : "Conectá Meta primero."}
          </p>
        ) : (
          <div className="space-y-3">
            {publications.map((pub) => (
              <div key={pub.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pub.platform === "FACEBOOK" ? "bg-blue-700" : "bg-gradient-to-tr from-purple-600 to-pink-500"}`}>
                      {pub.platform === "FACEBOOK" ? <Facebook size={16} /> : <Instagram size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{pub.vehicle?.name || "Vehículo"}</p>
                      <p className="text-xs text-gray-400">
                        {pub.platform === "FACEBOOK" ? "Facebook" : "Instagram"} ·{" "}
                        {pub.publishedAt ? new Date(pub.publishedAt).toLocaleDateString("es-AR") : "No publicado"}
                      </p>
                      {pub.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">{pub.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(pub.status)}>{statusLabel(pub.status)}</Badge>
                    {pub.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleRemove(pub.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {pub.status === "PUBLISHED" && (
                  <div className="flex gap-6 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Eye size={12} /> {pub.reach} alcance</span>
                    <span className="flex items-center gap-1"><MousePointerClick size={12} /> {pub.clicks} clicks</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {pub.inquiries} consultas</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Connect Modal */}
      <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Conectar Meta">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Para conectar Meta necesitás un Access Token de tu aplicación de Facebook.
            Podés obtenerlo desde{" "}
            <span className="text-blue-400">developers.facebook.com</span>.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-2">
            <p>1. Creá una app en Meta for Developers</p>
            <p>2. Agregá los productos: Facebook Login, Pages API, Instagram API</p>
            <p>3. Generá un Page Access Token con permisos:</p>
            <p className="text-white ml-4">pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish</p>
          </div>
          <Input
            label="Access Token"
            value={connectToken}
            onChange={(e) => setConnectToken(e.target.value)}
            placeholder="EAAxxxxxxx..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowConnect(false)}>Cancelar</Button>
            <Button onClick={handleConnect} disabled={loading || !connectToken.trim()}>
              {loading ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Publish Modal */}
      <Modal
        open={showPublish}
        onClose={() => setShowPublish(false)}
        title={`Publicar en ${publishPlatform === "FACEBOOK" ? "Facebook" : "Instagram"}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vehículo</label>
            <select
              value={publishVehicleId}
              onChange={(e) => setPublishVehicleId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccioná un vehículo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} - ${v.priceARS?.toLocaleString("es-AR") || "S/P"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mensaje personalizado <span className="text-gray-500">(opcional)</span>
            </label>
            <textarea
              value={publishMessage}
              onChange={(e) => setPublishMessage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dejá vacío para usar el mensaje automático con toda la info del vehículo"
            />
          </div>
          {publishPlatform === "INSTAGRAM" && (
            <p className="text-xs text-yellow-400">
              ⚠️ Instagram requiere que el vehículo tenga al menos una foto cargada
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowPublish(false)}>Cancelar</Button>
            <Button onClick={handlePublish} disabled={loading || !publishVehicleId}>
              <Send size={16} className="mr-2" />
              {loading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
