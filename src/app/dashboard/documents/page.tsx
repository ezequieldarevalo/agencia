"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DocumentRenderer, DealershipInfo, generatePrintHTML } from "@/components/document-renderer";
import {
  FileText,
  Download,
  Loader2,
  Eye,
  Plus,
  Copy,
  Check,
  LayoutTemplate,
  Pencil,
  Trash2,
  Star,
  Files,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Table,
  Image,
  Type,
  Heading1,
  Heading2,
  Minus,
  AlignCenter,
  Code,
  Info,
} from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  priceARS?: number;
  priceUSD?: number;
  domain?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
  email?: string;
}

interface Supplier {
  id: string;
  firstName: string;
  lastName: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  { value: "BOLETO", label: "Boleto" },
  { value: "PRESUPUESTO", label: "Presupuesto" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "RECIBO_SENA", label: "Recibo de Seña" },
  { value: "CONSIGNACION", label: "Consignación" },
  { value: "CUSTOM", label: "Personalizado" },
];

const AVAILABLE_VARS = [
  { group: "Vehículo", vars: ["{{vehiculo_nombre}}", "{{vehiculo_marca}}", "{{vehiculo_modelo}}", "{{vehiculo_anio}}", "{{vehiculo_version}}", "{{vehiculo_dominio}}", "{{vehiculo_motor}}", "{{vehiculo_chasis}}", "{{vehiculo_km}}", "{{vehiculo_combustible}}", "{{vehiculo_color}}", "{{vehiculo_precio_ars}}", "{{vehiculo_precio_usd}}", "{{vehiculo_foto}}"] },
  { group: "Cliente", vars: ["{{cliente_nombre}}", "{{cliente_dni}}", "{{cliente_cuit}}", "{{cliente_cuil}}", "{{cliente_telefono}}", "{{cliente_email}}", "{{cliente_domicilio}}", "{{cliente_provincia}}", "{{cliente_ciudad}}"] },
  { group: "Proveedor", vars: ["{{proveedor_nombre}}", "{{proveedor_dni}}", "{{proveedor_cuit}}", "{{proveedor_telefono}}"] },
  { group: "Agencia", vars: ["{{agencia_nombre}}", "{{agencia_cuit}}", "{{agencia_telefono}}", "{{agencia_domicilio}}", "{{agencia_email}}"] },
  { group: "Operación", vars: ["{{operacion_monto}}", "{{operacion_moneda}}", "{{operacion_tipo}}", "{{operacion_sena}}", "{{operacion_metodo_pago}}"] },
  { group: "Fecha", vars: ["{{fecha}}", "{{fecha_larga}}"] },
  { group: "Condicionales", vars: ["{{#if var}}...{{/if}}", "{{#unless var}}...{{/unless}}", "{{var|texto alternativo}}"] },
];

// Which variable groups are relevant per template type
// BOLETO: can be COMPRA (Agencia+Proveedor) or VENTA (Agencia+Cliente)
const TYPE_ACTORS: Record<string, string[]> = {
  BOLETO: ["Vehículo", "Cliente", "Proveedor", "Agencia", "Operación", "Fecha", "Condicionales"],
  PRESUPUESTO: ["Vehículo", "Cliente", "Agencia", "Operación", "Fecha", "Condicionales"],
  RECIBO_SENA: ["Vehículo", "Cliente", "Agencia", "Operación", "Fecha", "Condicionales"],
  CONSIGNACION: ["Vehículo", "Cliente", "Agencia", "Operación", "Fecha", "Condicionales"],
  CONTRATO: ["Vehículo", "Cliente", "Agencia", "Operación", "Fecha", "Condicionales"],
  CUSTOM: ["Vehículo", "Cliente", "Proveedor", "Agencia", "Operación", "Fecha", "Condicionales"],
};

// Which entities to show in the generate modal per template type
const TYPE_ENTITIES: Record<string, { vehicle: boolean; client: boolean; supplier: boolean }> = {
  BOLETO: { vehicle: true, client: true, supplier: true },
  PRESUPUESTO: { vehicle: true, client: true, supplier: false },
  RECIBO_SENA: { vehicle: true, client: true, supplier: false },
  CONSIGNACION: { vehicle: true, client: true, supplier: false },
  CONTRATO: { vehicle: true, client: true, supplier: false },
  CUSTOM: { vehicle: true, client: true, supplier: true },
};

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dealership, setDealership] = useState<DealershipInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ id: number; method: string; label: string; vehicle: string; client: string; content: string; date: string }[]>([]);

  // Template editor (full-screen)
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [expandedVarGroup, setExpandedVarGroup] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({ name: "", type: "BOLETO", content: "", isDefault: false });
  const [sourceMode, setSourceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<string>("");

  // Strip HTML tags for plain text preview
  const stripHtml = (html: string) => {
    if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
  };

  // Load HTML into contentEditable when editor opens or content changes externally
  useEffect(() => {
    if (showEditor && !sourceMode && editorRef.current) {
      const html = tplForm.content || '<p>Empezá a escribir el contenido del documento...</p>';
      // Only update DOM if content actually changed from outside (not from typing)
      if (editorContentRef.current !== tplForm.content) {
        editorRef.current.innerHTML = html;
        editorContentRef.current = tplForm.content;
      }
    }
  }, [showEditor, sourceMode, tplForm.content]);

  // Handle Enter key in contentEditable to insert proper paragraphs
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertParagraph");
      syncEditorToForm();
    }
  };

  // Template generate
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [genForm, setGenForm] = useState({ vehicleId: "", clientId: "", supplierId: "", amount: "", currency: "ARS" });

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/dealership").then((r) => r.json()),
    ]).then(([v, c, s, t, d]) => {
      setVehicles(v.vehicles || v);
      setClients(c.clients || c);
      setSuppliers(s.suppliers || s);
      setTemplates(t);
      if (d) setDealership(d);
    });
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  }, []);

  // Insert variable — works for both source mode (textarea) and rich editor (contentEditable)
  const insertVariable = (varText: string) => {
    if (sourceMode) {
      const textarea = textareaRef.current;
      if (!textarea) {
        setTplForm((f) => ({ ...f, content: f.content + varText }));
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = tplForm.content.slice(0, start);
      const after = tplForm.content.slice(end);
      const newContent = before + varText + after;
      setTplForm((f) => ({ ...f, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        const newPos = start + varText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand("insertHTML", false, `<span class="tpl-var">${varText}</span>`);
      syncEditorToForm();
    }
  };

  // Sync contentEditable to form state
  const syncEditorToForm = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML || "";
      editorContentRef.current = html;
      setTplForm((f) => ({ ...f, content: html }));
    }
  }, []);

  // Formatting commands for contentEditable
  const execFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncEditorToForm();
  };

  const insertTable = () => {
    const html = `<table style="width:100%;border-collapse:collapse;margin:8px 0;">
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Campo</strong></td><td style="border:1px solid #ccc;padding:6px;">Valor</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Campo</strong></td><td style="border:1px solid #ccc;padding:6px;">Valor</td></tr>
</table>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    syncEditorToForm();
  };

  const insertSignatureBlock = () => {
    const html = `<br/><br/><br/>
<table style="width:100%;border:none;">
<tr>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>Firma 1</strong>
</td>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>Firma 2</strong>
</td>
</tr>
</table>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    syncEditorToForm();
  };

  // Pre-fill content when selecting template type for new templates
  const handleTypeChange = (type: string) => {
    if (!editingTemplate) {
      const defaultTpl = templates.find((t) => t.type === type && t.isDefault);
      if (defaultTpl) editorContentRef.current = "";  // force editor reload
      setTplForm((f) => ({
        ...f,
        type,
        content: defaultTpl ? defaultTpl.content : f.content,
        name: !f.name && defaultTpl ? "" : f.name,
      }));
    } else {
      setTplForm((f) => ({ ...f, type }));
    }
  };

  const handleSaveTemplate = async () => {
    if (!tplForm.name || !tplForm.content) return;
    setLoading(true);
    try {
      if (editingTemplate) {
        await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tplForm),
        });
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tplForm),
        });
      }
      await fetchTemplates();
      setShowEditor(false);
      setEditingTemplate(null);
      setTplForm({ name: "", type: "BOLETO", content: "", isDefault: false });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    await fetchTemplates();
  };

  const openEditTemplate = (tpl: Template) => {
    setEditingTemplate(tpl);
    setTplForm({ name: tpl.name, type: tpl.type, content: tpl.content, isDefault: tpl.isDefault });
    editorContentRef.current = "";
    setSourceMode(false);
    setShowEditor(true);
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    // Pre-fill from the default BOLETO template
    const defaultTpl = templates.find((t) => t.type === "BOLETO" && t.isDefault);
    setTplForm({
      name: "",
      type: "BOLETO",
      content: defaultTpl ? defaultTpl.content : "",
      isDefault: false,
    });
    editorContentRef.current = "";
    setSourceMode(false);
    setShowEditor(true);
  };

  const handleDuplicate = (tpl: Template) => {
    setEditingTemplate(null);
    setTplForm({ name: `Copia de ${tpl.name}`, type: tpl.type, content: tpl.content, isDefault: false });
    editorContentRef.current = "";
    setSourceMode(false);
    setShowEditor(true);
  };

  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const res = await fetch("/api/templates/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          vehicleId: genForm.vehicleId || undefined,
          clientId: genForm.clientId || undefined,
          supplierId: genForm.supplierId || undefined,
          customAmount: genForm.amount ? parseFloat(genForm.amount) : undefined,
          customCurrency: genForm.currency,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedContent(data.content);
      setGeneratedTitle(data.templateName || selectedTemplate.name);
      setShowPreview(true);
      setShowGenerate(false);

      const vehicle = vehicles.find((v) => v.id === genForm.vehicleId);
      const client = clients.find((c) => c.id === genForm.clientId);
      setHistory((prev) => [
        {
          id: Date.now(),
          method: "Plantilla",
          label: selectedTemplate.name,
          vehicle: vehicle?.name || "-",
          client: client ? `${client.firstName} ${client.lastName}` : "-",
          content: data.content,
          date: new Date().toLocaleString("es-AR"),
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    // Extract text from HTML for clipboard
    const tmp = document.createElement("div");
    tmp.innerHTML = generatedContent;
    const text = tmp.textContent || tmp.innerText || generatedContent;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = generatePrintHTML(generatedContent, generatedTitle, dealership);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Documentos</h1>
          <p className="text-gray-400 text-sm mt-1">Plantillas de documentos con variables automáticas</p>
        </div>
        <Button variant="secondary" onClick={openNewTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <LayoutTemplate className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300">Sin plantillas</h3>
              <p className="text-gray-500 text-sm mt-2">Creá plantillas de documentos con variables que se completan automáticamente</p>
              <Button className="mt-4" onClick={openNewTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera plantilla
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{tpl.name}</h3>
                      {tpl.isDefault && <Star size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />}
                    </div>
                    <Badge variant="default" className="mt-1">
                      {TEMPLATE_TYPES.find((t) => t.value === tpl.type)?.label || tpl.type}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{stripHtml(tpl.content).substring(0, 120)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setGenForm({ vehicleId: "", clientId: "", supplierId: "", amount: "", currency: "ARS" });
                      setShowGenerate(true);
                    }}
                  >
                    <FileText size={14} className="mr-1" /> Generar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(tpl)} title="Duplicar">
                    <Files size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditTemplate(tpl)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(tpl.id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Documentos Generados</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600/20">
                    <LayoutTemplate className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-gray-400">
                      {item.vehicle} — {item.client} — {item.date}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGeneratedContent(item.content);
                    setGeneratedTitle(item.label);
                    setShowPreview(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ──────────── Full-screen Template Editor ──────────── */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowEditor(false); setSourceMode(false); }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <div className="h-5 w-px bg-gray-700" />
              <input
                value={tplForm.name}
                onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre de la plantilla..."
                className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none placeholder-gray-600 w-64"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={tplForm.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={tplForm.isDefault} onChange={(e) => setTplForm((f) => ({ ...f, isDefault: e.target.checked }))} className="rounded bg-gray-800 border-gray-700" />
                Predeterminada
              </label>
              <div className="h-5 w-px bg-gray-700" />
              <Button variant="ghost" onClick={() => { setShowEditor(false); setSourceMode(false); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate} disabled={loading || !tplForm.name || !tplForm.content}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {editingTemplate ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>

          {/* Split pane */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-800">
              {/* Formatting Toolbar */}
              {!sourceMode && (
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-800 bg-gray-900 flex-wrap">
                  <button onClick={() => execFormat("bold")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Negrita"><Bold size={16} /></button>
                  <button onClick={() => execFormat("italic")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Itálica"><Italic size={16} /></button>
                  <button onClick={() => execFormat("underline")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Subrayado"><Underline size={16} /></button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={() => execFormat("formatBlock", "h2")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Título Grande"><Heading1 size={16} /></button>
                  <button onClick={() => execFormat("formatBlock", "h3")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Subtítulo"><Heading2 size={16} /></button>
                  <button onClick={() => execFormat("formatBlock", "p")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Párrafo"><Type size={16} /></button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={() => execFormat("justifyCenter")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Centrar"><AlignCenter size={16} /></button>
                  <button onClick={() => execFormat("insertUnorderedList")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Lista"><List size={16} /></button>
                  <button onClick={() => execFormat("insertOrderedList")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Lista Numerada"><ListOrdered size={16} /></button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={() => execFormat("insertHorizontalRule")} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Línea separadora"><Minus size={16} /></button>
                  <button onClick={insertTable} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Insertar Tabla"><Table size={16} /></button>
                  <button onClick={insertSignatureBlock} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Bloque de Firmas"><Image size={16} /></button>
                </div>
              )}

              {/* Source / Visual toggle + Variable panel */}
              <div className="border-b border-gray-800 bg-gray-900/50">
                <div className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (sourceMode) {
                          // Switching from source to visual — the useEffect will load the HTML
                          editorContentRef.current = "";  // force reload
                        }
                        setSourceMode(!sourceMode);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${sourceMode ? "bg-blue-600/20 text-blue-400" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                    >
                      <Code size={12} />
                      {sourceMode ? "Modo HTML" : "Ver HTML"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    <Info size={12} className="inline mr-1" />
                    Click en una variable para insertarla
                  </p>
                </div>
                <div className="px-4 pb-2">
                  <div className="space-y-1">
                    {AVAILABLE_VARS.filter((group) => {
                      const actors = TYPE_ACTORS[tplForm.type] || TYPE_ACTORS.CUSTOM;
                      return actors.includes(group.group);
                    }).map((group) => (
                      <div key={group.group}>
                        <button
                          onClick={() => setExpandedVarGroup(expandedVarGroup === group.group ? null : group.group)}
                          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors py-0.5"
                        >
                          {expandedVarGroup === group.group ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {group.group}
                        </button>
                        {expandedVarGroup === group.group && (
                          <div className="flex flex-wrap gap-1 ml-4 mb-1">
                            {group.vars.map((v) => (
                              <button
                                key={v}
                                onClick={() => insertVariable(v)}
                                className="px-2 py-0.5 bg-gray-800 rounded text-xs font-mono text-blue-300 hover:bg-gray-700 transition-colors"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor area */}
              {sourceMode ? (
                <textarea
                  ref={textareaRef}
                  value={tplForm.content}
                  onChange={(e) => setTplForm((f) => ({ ...f, content: e.target.value }))}
                  className="flex-1 bg-gray-950 text-green-300 text-sm p-4 resize-none focus:outline-none font-mono leading-relaxed"
                  placeholder="<h2>Título del documento</h2>\n<p>Contenido con {{variables}}...</p>"
                  spellCheck={false}
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditorToForm}
                  onKeyDown={handleEditorKeyDown}
                  className="flex-1 bg-white text-gray-900 text-sm p-6 overflow-y-auto focus:outline-none"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    lineHeight: 1.7,
                    minHeight: 400,
                  }}
                />
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="w-1/2 bg-gray-200 overflow-y-auto">
              <div className="p-6 sm:p-8">
                <p className="text-xs text-gray-500 mb-3 font-sans">Vista previa del documento</p>
                <div className="bg-white shadow-xl rounded-sm mx-auto" style={{ maxWidth: 700, minHeight: 900 }}>
                  <div className="p-8 sm:p-10">
                    <DocumentRenderer content={tplForm.content || "<p>Empezá a escribir para ver la vista previa...</p>"} dealership={dealership} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate from template modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title={`Generar: ${selectedTemplate?.name || ""}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Seleccioná los datos para completar las variables automáticamente.</p>
          {(TYPE_ENTITIES[selectedTemplate?.type || "CUSTOM"] || TYPE_ENTITIES.CUSTOM).vehicle && (
            <Select
              label="Vehículo"
              value={genForm.vehicleId}
              onChange={(e) => setGenForm({ ...genForm, vehicleId: e.target.value })}
              options={[{ value: "", label: "Seleccionar vehículo..." }, ...vehicles.map((v) => ({ value: v.id, label: `${v.name}${v.domain ? ` (${v.domain})` : ""}` }))]}
            />
          )}
          {(TYPE_ENTITIES[selectedTemplate?.type || "CUSTOM"] || TYPE_ENTITIES.CUSTOM).client && (
            <Select
              label="Cliente"
              value={genForm.clientId}
              onChange={(e) => setGenForm({ ...genForm, clientId: e.target.value })}
              options={[{ value: "", label: "Seleccionar cliente..." }, ...clients.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}${c.dni ? ` — DNI ${c.dni}` : ""}` }))]}
            />
          )}
          {(TYPE_ENTITIES[selectedTemplate?.type || "CUSTOM"] || TYPE_ENTITIES.CUSTOM).supplier && (
            <Select
              label="Proveedor (opcional)"
              value={genForm.supplierId}
              onChange={(e) => setGenForm({ ...genForm, supplierId: e.target.value })}
              options={[{ value: "", label: "Sin proveedor" }, ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))]}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto (opcional)" type="number" value={genForm.amount} onChange={(e) => setGenForm({ ...genForm, amount: e.target.value })} placeholder="0" />
            <Select
              label="Moneda"
              value={genForm.currency}
              onChange={(e) => setGenForm({ ...genForm, currency: e.target.value })}
              options={[
                { value: "ARS", label: "ARS" },
                { value: "USD", label: "USD" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowGenerate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateFromTemplate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Generar Documento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview modal — beautiful document view */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title={generatedTitle || "Documento Generado"} size="xl">
        <div>
          <div className="bg-gray-200 rounded-lg p-6 sm:p-8">
            <div className="bg-white shadow-xl rounded-sm mx-auto" style={{ maxWidth: 700 }}>
              <div className="p-8 sm:p-10">
                <DocumentRenderer content={generatedContent} dealership={dealership} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Imprimir / PDF
            </Button>
            <Button onClick={() => setShowPreview(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
