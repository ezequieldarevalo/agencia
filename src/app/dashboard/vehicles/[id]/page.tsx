"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Car,
  Calendar,
  Fuel,
  Gauge,
  Palette,
  DoorOpen,
  Settings2,
  Hash,
  MapPin,
  Facebook,
  Instagram,
  ShoppingBag,
  MessageCircle,
  Pencil,
  User,
  Truck,
  Image,
} from "lucide-react";

interface VehicleDetail {
  id: string;
  name: string;
  status: string;
  category: string;
  kilometers: number | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  version: string | null;
  priceARS: number | null;
  priceUSD: number | null;
  currency: string;
  exchangeRate: number | null;
  fuel: string | null;
  color: string | null;
  doors: number | null;
  bodyType: string | null;
  transmission: string | null;
  engine: string | null;
  domain: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  description: string | null;
  locationProvince: string | null;
  locationCity: string | null;
  contactPhone: string | null;
  notes: string | null;
  published: boolean;
  createdAt: string;
  supplier?: { id: string; firstName: string; lastName: string } | null;
  buyer?: { id: string; firstName: string; lastName: string } | null;
  photos: { id: string; url: string; order: number }[];
  movements: { id: string; date: string; type: string; concept: string; amountARS: number | null; account?: { name: string } | null }[];
  debts: { id: string; totalAmount: number; paidAmount: number; currency: string; status: string; client?: { firstName: string; lastName: string } | null }[];
  interactions: { id: string; status: string; createdAt: string; client?: { firstName: string; lastName: string } | null }[];
  metaPublications: { id: string; platform: string; status: string; reach: number; clicks: number; createdAt: string }[];
  mlListings: { id: string; title: string; status: string; views: number; questions: number; favorites: number; permalink: string | null }[];
  calendarEvents: { id: string; title: string; type: string; date: string; completed: boolean; client?: { firstName: string; lastName: string } | null }[];
}

type Tab = "info" | "financiero" | "historial" | "integraciones";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/dashboard/vehicles");
        else setVehicle(data);
      })
      .catch(() => router.push("/dashboard/vehicles"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  if (!vehicle) return null;

  const statusColor: Record<string, "success" | "warning" | "danger" | "info"> = {
    DISPONIBLE: "success", RESERVADO: "warning", VENDIDO: "danger", EN_PROCESO: "info",
  };

  const specs = [
    { icon: Calendar, label: "Año", value: vehicle.year },
    { icon: Gauge, label: "Kilómetros", value: vehicle.kilometers?.toLocaleString("es-AR") },
    { icon: Fuel, label: "Combustible", value: vehicle.fuel },
    { icon: Settings2, label: "Transmisión", value: vehicle.transmission },
    { icon: Palette, label: "Color", value: vehicle.color },
    { icon: DoorOpen, label: "Puertas", value: vehicle.doors },
    { icon: Car, label: "Carrocería", value: vehicle.bodyType },
    { icon: Settings2, label: "Motor", value: vehicle.engine },
    { icon: Hash, label: "Dominio", value: vehicle.domain },
    { icon: MapPin, label: "Ubicación", value: [vehicle.locationCity, vehicle.locationProvince].filter(Boolean).join(", ") || null },
  ].filter((s) => s.value);

  const handlePublish = async (platform: string) => {
    try {
      let url = "/api/integrations/meta";
      let body: Record<string, unknown> = { action: `publish-${platform}`, vehicleId: vehicle.id };
      if (platform === "mercadolibre") {
        url = "/api/integrations/mercadolibre";
        body = { action: "publish", vehicleId: vehicle.id, title: vehicle.name, price: vehicle.priceARS || 0 };
      }
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(`✅ Publicado en ${platform}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const tabs = [
    { id: "info" as const, label: "Información" },
    { id: "financiero" as const, label: "Financiero" },
    { id: "historial" as const, label: "Historial" },
    { id: "integraciones" as const, label: "Integraciones" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vehicles" className="text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusColor[vehicle.status] || "default"}>{vehicle.status}</Badge>
              {vehicle.published && <Badge variant="info">Publicado</Badge>}
              {vehicle.domain && <span className="text-sm text-gray-400">{vehicle.domain}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handlePublish("facebook")} title="Facebook">
            <Facebook size={16} className="text-blue-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePublish("instagram")} title="Instagram">
            <Instagram size={16} className="text-pink-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePublish("mercadolibre")} title="MercadoLibre">
            <ShoppingBag size={16} className="text-yellow-400" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/vehicles")}>
            <Pencil size={14} className="mr-1" /> Editar
          </Button>
        </div>
      </div>

      {/* Photo Gallery + Price */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {vehicle.photos.length > 0 ? (
            <div>
              <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vehicle.photos[activePhoto]?.url}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {vehicle.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {vehicle.photos.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePhoto(i)}
                      className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                        i === activePhoto ? "border-blue-500" : "border-transparent hover:border-gray-600"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center text-gray-500">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image size={48} className="mx-auto mb-2" />
                <p>Sin fotos</p>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm text-gray-400 mb-2">Precio</h3>
            {vehicle.priceARS && (
              <p className="text-3xl font-bold">${vehicle.priceARS.toLocaleString("es-AR")}</p>
            )}
            {vehicle.priceUSD && (
              <p className="text-lg text-green-400 mt-1">USD ${vehicle.priceUSD.toLocaleString("en-US")}</p>
            )}
            {vehicle.exchangeRate && (
              <p className="text-xs text-gray-500 mt-1">TC: ${vehicle.exchangeRate.toLocaleString("es-AR")}</p>
            )}
          </Card>
          <Card>
            <h3 className="text-sm text-gray-400 mb-2">Propietario</h3>
            {vehicle.supplier ? (
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-yellow-400" />
                <span>{vehicle.supplier.firstName} {vehicle.supplier.lastName}</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Sin proveedor asignado</p>
            )}
            {vehicle.buyer && (
              <div className="flex items-center gap-2 mt-2">
                <User size={16} className="text-green-400" />
                <span>Comprador: {vehicle.buyer.firstName} {vehicle.buyer.lastName}</span>
              </div>
            )}
          </Card>
          {vehicle.calendarEvents.length > 0 && (
            <Card>
              <h3 className="text-sm text-gray-400 mb-2">Próximos eventos</h3>
              {vehicle.calendarEvents.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm py-1">
                  <span className={e.completed ? "line-through text-gray-500" : ""}>{e.title}</span>
                  <span className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString("es-AR")}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-4">Especificaciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <s.icon size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-medium">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {vehicle.description && (
            <Card>
              <h2 className="font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{vehicle.description}</p>
            </Card>
          )}
          {(vehicle.engineNumber || vehicle.chassisNumber) && (
            <Card>
              <h2 className="font-semibold mb-2">Identificación</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {vehicle.engineNumber && <div><span className="text-gray-400">Nro Motor:</span> <span>{vehicle.engineNumber}</span></div>}
                {vehicle.chassisNumber && <div><span className="text-gray-400">Nro Chasis:</span> <span>{vehicle.chassisNumber}</span></div>}
              </div>
            </Card>
          )}
          {vehicle.notes && (
            <Card>
              <h2 className="font-semibold mb-2">Notas internas</h2>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{vehicle.notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* Financial Tab */}
      {tab === "financiero" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-4">Movimientos de Caja</h2>
            {vehicle.movements.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Sin movimientos registrados</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Concepto</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Cuenta</th>
                    <th className="text-right py-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-800">
                      <td className="py-2">{new Date(m.date).toLocaleDateString("es-AR")}</td>
                      <td className="py-2">{m.concept}</td>
                      <td className="py-2">
                        <Badge variant={m.type === "INGRESO" ? "success" : "danger"}>{m.type}</Badge>
                      </td>
                      <td className="py-2 text-gray-400">{m.account?.name || "-"}</td>
                      <td className="py-2 text-right font-medium">${(m.amountARS || 0).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold mb-4">Deudas Asociadas</h2>
            {vehicle.debts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Sin deudas registradas</p>
            ) : (
              <div className="space-y-3">
                {vehicle.debts.map((d) => (
                  <div key={d.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{d.client?.firstName} {d.client?.lastName}</p>
                      <p className="text-xs text-gray-400">
                        {d.currency} ${d.totalAmount.toLocaleString("es-AR")} · Pagado: ${d.paidAmount.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <Badge variant={d.status === "PAGADA" ? "success" : d.status === "VENCIDA" ? "danger" : "warning"}>
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* History Tab */}
      {tab === "historial" && (
        <Card>
          <h2 className="font-semibold mb-4">Interacciones / Leads</h2>
          {vehicle.interactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Sin interacciones registradas</p>
          ) : (
            <div className="space-y-3">
              {vehicle.interactions.map((i) => (
                <div key={i.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                    <MessageCircle size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.client?.firstName} {i.client?.lastName}</p>
                    <p className="text-xs text-gray-400">{i.status}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(i.createdAt).toLocaleDateString("es-AR")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Integrations Tab */}
      {tab === "integraciones" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-4">Publicaciones en Meta</h2>
            {vehicle.metaPublications.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-3">Sin publicaciones en Meta</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => handlePublish("facebook")}><Facebook size={14} className="mr-1" /> Facebook</Button>
                  <Button size="sm" onClick={() => handlePublish("instagram")}><Instagram size={14} className="mr-1" /> Instagram</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicle.metaPublications.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {p.platform === "FACEBOOK" ? <Facebook size={16} className="text-blue-400" /> : <Instagram size={16} className="text-pink-400" />}
                      <Badge variant={p.status === "PUBLISHED" ? "success" : p.status === "FAILED" ? "danger" : "default"}>{p.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Alcance: {p.reach}</span>
                      <span>Clicks: {p.clicks}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold mb-4">Publicaciones en MercadoLibre</h2>
            {vehicle.mlListings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-3">Sin publicaciones en MercadoLibre</p>
                <Button size="sm" onClick={() => handlePublish("mercadolibre")}><ShoppingBag size={14} className="mr-1" /> Publicar</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicle.mlListings.map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{l.title}</p>
                      <Badge variant={l.status === "ACTIVE" ? "success" : l.status === "PAUSED" ? "warning" : "default"}>{l.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>👁 {l.views}</span>
                      <span>❓ {l.questions}</span>
                      <span>⭐ {l.favorites}</span>
                      {l.permalink && <a href={l.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
