"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  ArrowLeft,
  Unplug,
  Send,
  Car,
  FileText,
  Plus,
  Pencil,
  Trash2,
  User,
} from "lucide-react";

interface WaStatus {
  connected: boolean;
  phoneDisplay?: string;
  connectedAt?: string;
}

interface Conversation {
  phone: string;
  clientName: string | null;
  clientId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unread: number;
}

interface WaMessageItem {
  id: string;
  direction: string;
  phone: string;
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
  client?: { firstName: string; lastName: string } | null;
  vehicle?: { name: string } | null;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  body: string;
  active: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  priceARS: number;
  status: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

type ActiveTab = "conversaciones" | "enviar" | "templates";

export default function WhatsAppIntegrationPage() {
  const [status, setStatus] = useState<WaStatus>({ connected: false });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<WaMessageItem[]>([]);
  const [activePhone, setActivePhone] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tab, setTab] = useState<ActiveTab>("conversaciones");
  const [showConnect, setShowConnect] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  // Connect form
  const [connectForm, setConnectForm] = useState({
    phoneNumberId: "",
    businessId: "",
    accessToken: "",
    phoneDisplay: "",
  });

  // Send form
  const [sendForm, setSendForm] = useState({
    phone: "",
    text: "",
    clientId: "",
    vehicleId: "",
    mode: "text" as "text" | "vehicle" | "template",
    templateSlug: "",
  });

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: "",
    slug: "",
    category: "MARKETING",
    body: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, convosRes, tplRes, vehiclesRes, clientsRes] = await Promise.all([
        fetch("/api/integrations/whatsapp"),
        fetch("/api/integrations/whatsapp?action=conversations"),
        fetch("/api/integrations/whatsapp?action=templates"),
        fetch("/api/vehicles"),
        fetch("/api/clients"),
      ]);
      setStatus(await statusRes.json());
      const convosData = await convosRes.json();
      setConversations(Array.isArray(convosData) ? convosData : []);
      const tplData = await tplRes.json();
      setTemplates(Array.isArray(tplData) ? tplData : []);
      const vData = await vehiclesRes.json();
      setVehicles(Array.isArray(vData) ? vData : []);
      const cData = await clientsRes.json();
      setClients(Array.isArray(cData) ? cData : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", ...connectForm }),
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
    if (!confirm("¿Desconectar WhatsApp?")) return;
    await fetch("/api/integrations/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    fetchData();
  };

  const handleSend = async () => {
    if (!sendForm.phone) return;
    setLoading(true);
    try {
      let body: Record<string, unknown>;
      if (sendForm.mode === "vehicle") {
        body = { action: "send-vehicle", phone: sendForm.phone, vehicleId: sendForm.vehicleId, clientId: sendForm.clientId || undefined };
      } else if (sendForm.mode === "template") {
        body = { action: "send-template", phone: sendForm.phone, templateSlug: sendForm.templateSlug, variables: {}, clientId: sendForm.clientId || undefined };
      } else {
        body = { action: "send-text", phone: sendForm.phone, text: sendForm.text, clientId: sendForm.clientId || undefined, vehicleId: sendForm.vehicleId || undefined };
      }
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSendForm({ phone: "", text: "", clientId: "", vehicleId: "", mode: "text", templateSlug: "" });
      fetchData();
      alert("✅ Mensaje enviado");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  };

  const loadConversation = async (phone: string) => {
    setActivePhone(phone);
    try {
      const res = await fetch(`/api/integrations/whatsapp?action=conversation&phone=${phone}`);
      const data = await res.json();
      setActiveConvo(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      if (editingTemplate) {
        await fetch("/api/integrations/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update-template", templateId: editingTemplate.id, data: templateForm }),
        });
      } else {
        await fetch("/api/integrations/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create-template", template: templateForm }),
        });
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setTemplateForm({ name: "", slug: "", category: "MARKETING", body: "" });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("¿Eliminar template?")) return;
    await fetch("/api/integrations/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-template", templateId: id }),
    });
    fetchData();
  };

  const tabs = [
    { id: "conversaciones" as const, label: "Conversaciones", count: conversations.length },
    { id: "enviar" as const, label: "Enviar Mensaje" },
    { id: "templates" as const, label: "Templates", count: templates.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">WhatsApp</h1>
          <p className="text-gray-400 text-sm">Business API</p>
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
                <p>📱 Teléfono: <span className="text-white">{status.phoneDisplay}</span></p>
                <p>🕒 Conectado: {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString("es-AR") : "N/A"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                Conectá WhatsApp Business API para enviar mensajes
              </p>
            )}
          </div>
          {status.connected ? (
            <Button variant="danger" size="sm" onClick={handleDisconnect}>
              <Unplug size={16} className="mr-2" />Desconectar
            </Button>
          ) : (
            <Button onClick={() => setShowConnect(true)}>
              <MessageCircle size={16} className="mr-2" />Conectar
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      {status.connected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <button onClick={() => { setSendForm({ ...sendForm, mode: "text" }); setTab("enviar"); }} className="w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center"><Send size={18} className="text-white" /></div>
              <div><p className="font-medium text-sm">Mensaje de texto</p><p className="text-xs text-gray-400">Enviar mensaje libre</p></div>
            </button>
          </Card>
          <Card>
            <button onClick={() => { setSendForm({ ...sendForm, mode: "vehicle" }); setTab("enviar"); }} className="w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center"><Car size={18} className="text-white" /></div>
              <div><p className="font-medium text-sm">Ficha de vehículo</p><p className="text-xs text-gray-400">Enviar info completa</p></div>
            </button>
          </Card>
          <Card>
            <button onClick={() => { setSendForm({ ...sendForm, mode: "template" }); setTab("enviar"); }} className="w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center"><FileText size={18} className="text-white" /></div>
              <div><p className="font-medium text-sm">Usar template</p><p className="text-xs text-gray-400">Mensaje predefinido</p></div>
            </button>
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
                {t.label} {t.count !== undefined && <span className="ml-1 text-xs text-gray-500">({t.count})</span>}
              </button>
            ))}
          </div>

          {/* Conversations Tab */}
          {tab === "conversaciones" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 space-y-2">
                {conversations.length === 0 ? (
                  <Card><p className="text-gray-500 text-sm text-center py-4">Sin conversaciones</p></Card>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => loadConversation(c.phone)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activePhone === c.phone ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-750"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.clientName || c.phone}</p>
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          </div>
                        </div>
                        {c.unread > 0 && (
                          <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unread}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{c.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="lg:col-span-2">
                <Card>
                  {activePhone ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activeConvo.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">Sin mensajes</p>
                      ) : (
                        [...activeConvo].reverse().map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 text-sm ${
                                msg.direction === "OUTBOUND"
                                  ? "bg-green-800 text-white"
                                  : "bg-gray-700 text-gray-200"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs text-gray-400">
                                  {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {msg.direction === "OUTBOUND" && (
                                  <span className="text-xs">{msg.status === "READ" ? "✓✓" : msg.status === "DELIVERED" ? "✓✓" : "✓"}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-12">
                      Seleccioná una conversación para ver los mensajes
                    </p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Send Tab */}
          {tab === "enviar" && (
            <Card>
              <h2 className="font-semibold mb-4">Enviar Mensaje</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(["text", "vehicle", "template"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSendForm({ ...sendForm, mode: m })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        sendForm.mode === m ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {m === "text" ? "Texto libre" : m === "vehicle" ? "Ficha de vehículo" : "Template"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Destinatario</label>
                    <select
                      value={sendForm.clientId}
                      onChange={(e) => {
                        const c = clients.find((cl) => cl.id === e.target.value);
                        setSendForm({ ...sendForm, clientId: e.target.value, phone: c?.phone || sendForm.phone });
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="">Seleccionar cliente (opcional)</option>
                      {clients.filter((c) => c.phone).map((c) => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.phone}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Teléfono"
                    value={sendForm.phone}
                    onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                    placeholder="351-1234567"
                  />
                </div>

                {sendForm.mode === "text" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje</label>
                    <textarea
                      value={sendForm.text}
                      onChange={(e) => setSendForm({ ...sendForm, text: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Escribí tu mensaje..."
                    />
                  </div>
                )}

                {sendForm.mode === "vehicle" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Vehículo</label>
                    <select
                      value={sendForm.vehicleId}
                      onChange={(e) => setSendForm({ ...sendForm, vehicleId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="">Seleccionar vehículo</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} - ${v.priceARS?.toLocaleString("es-AR")}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Se enviará una ficha completa con toda la info del vehículo</p>
                  </div>
                )}

                {sendForm.mode === "template" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Template</label>
                    <select
                      value={sendForm.templateSlug}
                      onChange={(e) => setSendForm({ ...sendForm, templateSlug: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="">Seleccionar template</option>
                      {templates.filter((t) => t.active).map((t) => (
                        <option key={t.id} value={t.slug}>{t.name}</option>
                      ))}
                    </select>
                    {sendForm.templateSlug && (
                      <div className="mt-2 bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                        <p className="whitespace-pre-wrap">
                          {templates.find((t) => t.slug === sendForm.templateSlug)?.body}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSend} disabled={loading || !sendForm.phone}>
                    <Send size={16} className="mr-2" />
                    {loading ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Templates Tab */}
          {tab === "templates" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Templates de Mensajes</h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ name: "", slug: "", category: "MARKETING", body: "" });
                    setShowTemplateForm(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />Nuevo Template
                </Button>
              </div>
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{tpl.name}</p>
                          <Badge variant={tpl.category === "MARKETING" ? "info" : "warning"}>{tpl.category}</Badge>
                          {!tpl.active && <Badge variant="default">Inactivo</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Slug: {tpl.slug}</p>
                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{tpl.body}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setTemplateForm({ name: tpl.name, slug: tpl.slug, category: tpl.category, body: tpl.body });
                            setShowTemplateForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-white"
                        >
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No hay templates. Los templates por defecto se crean al conectar WhatsApp.</p>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Connect Modal */}
      <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Conectar WhatsApp Business">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Necesitás una cuenta de WhatsApp Business Platform (Cloud API) en Meta for Developers.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-2">
            <p>1. Creá una app de negocios en developers.facebook.com</p>
            <p>2. Agregá el producto WhatsApp</p>
            <p>3. Configurá un número de teléfono</p>
            <p>4. Obtené los IDs y el token permanente</p>
          </div>
          <Input label="Phone Number ID" value={connectForm.phoneNumberId} onChange={(e) => setConnectForm({ ...connectForm, phoneNumberId: e.target.value })} placeholder="Ej: 123456789..." />
          <Input label="Business Account ID" value={connectForm.businessId} onChange={(e) => setConnectForm({ ...connectForm, businessId: e.target.value })} placeholder="Ej: 987654321..." />
          <Input label="Access Token" value={connectForm.accessToken} onChange={(e) => setConnectForm({ ...connectForm, accessToken: e.target.value })} placeholder="EAAxxxxxxx..." />
          <Input label="Teléfono de Display" value={connectForm.phoneDisplay} onChange={(e) => setConnectForm({ ...connectForm, phoneDisplay: e.target.value })} placeholder="+54 351 1234567" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowConnect(false)}>Cancelar</Button>
            <Button onClick={handleConnect} disabled={loading || !connectForm.phoneNumberId || !connectForm.accessToken}>
              {loading ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Form Modal */}
      <Modal open={showTemplateForm} onClose={() => setShowTemplateForm(false)} title={editingTemplate ? "Editar Template" : "Nuevo Template"}>
        <div className="space-y-4">
          <Input label="Nombre" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Ej: Bienvenida" />
          {!editingTemplate && (
            <Input label="Slug (identificador único)" value={templateForm.slug} onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ej: bienvenida" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
            <select
              value={templateForm.category}
              onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utilidad</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Cuerpo del mensaje</label>
            <textarea
              value={templateForm.body}
              onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Usá {{variable}} para variables dinámicas"
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {"{{nombre}}"}, {"{{vehiculo}}"}, {"{{precio}}"}, {"{{monto}}"}, {"{{fecha}}"}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowTemplateForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate} disabled={loading || !templateForm.name || !templateForm.body}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
