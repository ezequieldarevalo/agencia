"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface IntegrationStatus {
  meta: { connected: boolean; pageName?: string; igUsername?: string; connectedAt?: string };
  whatsapp: { connected: boolean; phoneDisplay?: string; connectedAt?: string };
  mercadolibre: { connected: boolean; nickname?: string; connectedAt?: string };
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus>({
    meta: { connected: false },
    whatsapp: { connected: false },
    mercadolibre: { connected: false },
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [metaRes, waRes, mlRes] = await Promise.all([
        fetch("/api/integrations/meta"),
        fetch("/api/integrations/whatsapp"),
        fetch("/api/integrations/mercadolibre"),
      ]);
      const [meta, whatsapp, mercadolibre] = await Promise.all([
        metaRes.json(),
        waRes.json(),
        mlRes.json(),
      ]);
      setStatus({ meta, whatsapp, mercadolibre });
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const integrations = [
    {
      id: "meta",
      name: "Meta",
      subtitle: "Facebook & Instagram",
      icon: Globe,
      color: "bg-blue-600",
      href: "/dashboard/integrations/meta",
      connected: status.meta.connected,
      detail: status.meta.connected
        ? `Página: ${status.meta.pageName || "N/A"}${status.meta.igUsername ? ` · IG: @${status.meta.igUsername}` : ""}`
        : "Publicá vehículos en Facebook e Instagram automáticamente",
      features: [
        "Publicar vehículos en Facebook",
        "Publicar en Instagram con fotos",
        "Captar leads desde anuncios",
        "Estadísticas de alcance",
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      subtitle: "Business API",
      icon: MessageCircle,
      color: "bg-green-600",
      href: "/dashboard/integrations/whatsapp",
      connected: status.whatsapp.connected,
      detail: status.whatsapp.connected
        ? `Teléfono: ${status.whatsapp.phoneDisplay || "N/A"}`
        : "Enviá mensajes, fichas de vehículos y recordatorios por WhatsApp",
      features: [
        "Enviar info de vehículos",
        "Recordatorios de pago",
        "Templates personalizables",
        "Historial de conversaciones",
      ],
    },
    {
      id: "mercadolibre",
      name: "Mercado Libre",
      subtitle: "Publicaciones",
      icon: ShoppingBag,
      color: "bg-yellow-600",
      href: "/dashboard/integrations/mercadolibre",
      connected: status.mercadolibre.connected,
      detail: status.mercadolibre.connected
        ? `Usuario: ${status.mercadolibre.nickname || "N/A"}`
        : "Publicá y gestioná tus vehículos en MercadoLibre",
      features: [
        "Publicar vehículos automáticamente",
        "Sincronizar precios",
        "Responder preguntas",
        "Estadísticas de visitas",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integraciones</h1>
          <p className="text-gray-400 text-sm mt-1">
            Conectá tu agencia con las plataformas más importantes
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${integration.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <integration.icon size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{integration.name}</h2>
                    <Badge
                      variant={integration.connected ? "success" : "default"}
                    >
                      {integration.connected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm">{integration.subtitle}</p>
                  <p className="text-gray-300 text-sm mt-2">{integration.detail}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {integration.features.map((f) => (
                      <span
                        key={f}
                        className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                href={integration.href}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex-shrink-0"
              >
                {integration.connected ? "Gestionar" : "Configurar"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">
              {[status.meta.connected, status.whatsapp.connected, status.mercadolibre.connected].filter(Boolean).length}
            </p>
            <p className="text-gray-400 text-sm mt-1">Integraciones activas</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">3</p>
            <p className="text-gray-400 text-sm mt-1">Plataformas disponibles</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">∞</p>
            <p className="text-gray-400 text-sm mt-1">Publicaciones posibles</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
