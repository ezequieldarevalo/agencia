"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Car,
  UserCircle,
  Truck,
  DollarSign,
  FileText,
  SkipForward,
  ArrowLeft,
  Loader2,
  Filter,
  MoreVertical,
  Trash2,
  Ban,
  AlertTriangle,
  Info,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Settings2,
  ExternalLink,
  Receipt,
  ClipboardList,
  Undo2,
  Square,
  CheckSquare,
  X,
  TrendingUp,
  TrendingDown,
  Calculator,
  Zap,
  CircleDot,
  LinkIcon,
  Gauge,
  Fuel,
  Palette,
  Calendar,
  Hash,
  Wrench,
  PlusCircle,
  FileCheck,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Camera,
  ScanLine,
  Save,
  FileSignature,
  Package,
  Edit3,
  Check,
  Handshake,
  Percent,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { STEP_CATEGORIES } from "@/lib/operation-steps";
import { getStepAction, type StepAction, type FinancialStatus } from "@/lib/operation-actions";

interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  domain?: string;
  status?: string;
  priceARS?: number;
  priceUSD?: number;
  currency?: string;
  kilometers?: number;
  fuel?: string;
  color?: string;
  transmission?: string;
  chassisNumber?: string;
  engineNumber?: string;
  photos?: { url: string }[];
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dni?: string;
  cuit?: string;
  province?: string;
  city?: string;
  street?: string;
  streetNumber?: string;
}

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  order: number;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  optional?: boolean;
  category?: string;
  completedAt?: string;
  checkItems?: CheckItem[];
}

interface OperationAlert {
  type: "warning" | "error" | "info" | "success";
  message: string;
  priority?: number;
}

interface Payment {
  id: string;
  type: string;
  concept: string;
  amountARS: number;
  amountUSD: number;
  currency: string;
  date: string;
}

interface Operation {
  id: string;
  type: string;
  status: string;
  vehicleId?: string;
  clientId?: string;
  supplierId?: string;
  totalAmount?: number;
  paidAmount?: number;
  currency: string;
  notes?: string;
  includesTransfer?: boolean;
  hasDeposit?: boolean;
  depositAmount?: number;
  isFinanced?: boolean;
  paymentMethod?: string;
  vehicle?: Vehicle;
  client?: Person;
  supplier?: Person;
  steps: Step[];
  alerts?: OperationAlert[];
  financial?: FinancialStatus;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  COMPRA_VENTA: { label: "Compra-Venta", color: "#8b5cf6", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30", icon: "🔄" },
  COMPRA: { label: "Compra", color: "#3b82f6", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", icon: "📥" },
  VENTA: { label: "Venta", color: "#22c55e", bgColor: "bg-green-500/10", borderColor: "border-green-500/30", icon: "📤" },
  CONSIGNACION: { label: "Consignación", color: "#f59e0b", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30", icon: "🤝" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "danger" | "warning" }> = {
  EN_CURSO: { label: "En Curso", variant: "default" },
  COMPLETADA: { label: "Completada", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
  BLOQUEADA: { label: "Bloqueada", variant: "warning" },
};

function formatCurrency(amount: number | null | undefined, currency?: string) {
  if (!amount) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function getAssistantMessage(op: Operation): { message: string; detail: string; emoji: string } {
  if (op.status === "COMPLETADA") return { message: "¡Operación completada!", detail: "Todos los pasos fueron finalizados con éxito.", emoji: "🎉" };
  if (op.status === "CANCELADA") return { message: "Operación cancelada", detail: "Esta operación fue cancelada.", emoji: "🚫" };

  const nextStep = op.steps.find((s) => s.status !== "COMPLETADO" && s.status !== "OMITIDO");
  const doneCount = op.steps.filter((s) => s.status === "COMPLETADO" || s.status === "OMITIDO").length;
  const total = op.steps.length;

  // Missing entity warnings
  if (!op.vehicle && !op.vehicleId) {
    return { message: "Vinculá un vehículo para empezar", detail: "Necesitás asociar un vehículo a esta operación para avanzar.", emoji: "🚗" };
  }
  if (op.type === "COMPRA" && !op.supplier && !op.supplierId) {
    return { message: "¿Quién te vende el vehículo?", detail: "Asociá un proveedor para poder avanzar con la negociación y el pago.", emoji: "🤷" };
  }
  if (op.type === "COMPRA_VENTA" && !op.supplier && !op.supplierId) {
    return { message: "¿Quién te vende el vehículo?", detail: "Asociá un proveedor para empezar con la compra.", emoji: "🤷" };
  }
  if ((op.type === "VENTA" || op.type === "COMPRA_VENTA") && !op.client && !op.clientId && doneCount >= 2) {
    return { message: "Necesitás un comprador", detail: "Ya tenés el vehículo preparado, asociá un cliente para avanzar con la venta.", emoji: "👤" };
  }

  if (!nextStep) return { message: "Todo listo, revisá los detalles", detail: "Todos los pasos están cubiertos.", emoji: "✅" };

  const checks = nextStep.checkItems || [];
  const checkedCount = checks.filter((c) => c.checked).length;
  const pendingChecks = checks.length - checkedCount;

  if (doneCount === 0) {
    const typeLabels: Record<string, string> = {
      COMPRA: "Empecemos con la compra",
      VENTA: "Preparemos todo para la venta",
      COMPRA_VENTA: "Arranquemos la compra-venta",
      CONSIGNACION: "Arranquemos la consignación",
    };
    return {
      message: typeLabels[op.type] || "¡Arranquemos!",
      detail: `Primer paso: ${nextStep.title.toLowerCase()}. ${checks.length > 0 ? `Tenés ${checks.length} items para completar.` : nextStep.description || ""}`,
      emoji: "🚀",
    };
  }

  if (pendingChecks > 0 && checks.length > 0) {
    return {
      message: `Estás en: ${nextStep.title}`,
      detail: `Te ${pendingChecks === 1 ? "queda 1 tarea" : `quedan ${pendingChecks} tareas`} de este paso. Vas ${checkedCount}/${checks.length}.`,
      emoji: "📋",
    };
  }

  if (doneCount >= total - 1) {
    return { message: "¡Último paso!", detail: `Solo falta: ${nextStep.title.toLowerCase()}. Después de esto la operación queda cerrada.`, emoji: "🏁" };
  }

  return {
    message: `Siguiente: ${nextStep.title}`,
    detail: `Llevas ${doneCount} de ${total} pasos completados. ${nextStep.description || ""}`,
    emoji: "👉",
  };
}



export default function OperationsPage() {
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Person[]>([]);
  const [suppliers, setSuppliers] = useState<Person[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [newCheckLabel, setNewCheckLabel] = useState<Record<string, string>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState("");
  const [cashAccounts, setCashAccounts] = useState<{ id: string; name: string; type: string; currency: string }[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ concept: "", amount: "", currency: "ARS", cashAccountId: "", category: "" });
  const [loadingChecks, setLoadingChecks] = useState<Set<string>>(new Set());
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  // ── OCR + inline editing state ──
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<"dni" | "cedula" | null>(null);
  const dniInputRef = useRef<HTMLInputElement>(null);
  const cedulaInputRef = useRef<HTMLInputElement>(null);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<Record<string, string>>({});
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [editingPerson, setEditingPerson] = useState(false);
  const [personForm, setPersonForm] = useState<Record<string, string>>({});
  const [savingPerson, setSavingPerson] = useState(false);

  // Auto-expand next pending step when entering detail view
  useEffect(() => {
    if (selectedOp) {
      const nextPending = selectedOp.steps.find(
        (s) => s.status !== "COMPLETADO" && s.status !== "OMITIDO"
      );
      if (nextPending) {
        setExpandedSteps(new Set([nextPending.id]));
      }
    }
  }, [selectedOp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const [form, setForm] = useState({
    type: "",
    vehicleId: "",
    clientId: "",
    supplierId: "",
    totalAmount: "",
    currency: "ARS",
    notes: "",
    includesTransfer: false,
    hasDeposit: false,
    depositAmount: "",
    isFinanced: false,
    paymentMethod: "",
  });

  const fetchOperations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/operations?${params}`);
      const data = await res.json();
      setOperations(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/cash/accounts").then((r) => r.json()).catch(() => []),
    ]).then(([v, c, s, t, ca]) => {
      setVehicles(v.vehicles || v);
      setClients(c.clients || c);
      setSuppliers(s.suppliers || s);
      setTemplates(Array.isArray(t) ? t : []);
      setCashAccounts(Array.isArray(ca) ? ca : []);
    });
  }, []);

  const handleCreate = async () => {
    if (!form.type) return;
    setCreating(true);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al crear la operación");
      const op = await res.json();
      setOperations((prev) => [op, ...prev]);
      setShowCreate(false);
      setForm({ type: "", vehicleId: "", clientId: "", supplierId: "", totalAmount: "", currency: "ARS", notes: "", includesTransfer: false, hasDeposit: false, depositAmount: "", isFinanced: false, paymentMethod: "" });
      setSelectedOp(op);
      setFeedback({ type: "success", message: "Operación creada correctamente" });
    } catch {
      setFeedback({ type: "error", message: "No se pudo crear la operación" });
    } finally {
      setCreating(false);
    }
  };

  const handleStepUpdate = async (opId: string, stepId: string, status: string) => {
    try {
      const stepRes = await fetch(`/api/operations/${opId}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!stepRes.ok) throw new Error();
      // Refresh the operation detail
      const res = await fetch(`/api/operations/${opId}`);
      const updated = await res.json();
      setSelectedOp(updated);
      setOperations((prev) => prev.map((o) => (o.id === opId ? updated : o)));
      if (updated.status === "COMPLETADA") {
        setFeedback({ type: "success", message: "¡Operación completada!" });
      }
    } catch {
      setFeedback({ type: "error", message: "No se pudo actualizar el paso" });
    }
  };

  const handleUpdateOp = async (opId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/operations/${opId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedOp(updated);
      setOperations((prev) => prev.map((o) => (o.id === opId ? updated : o)));
    } catch {
      setFeedback({ type: "error", message: "No se pudo actualizar la operación" });
    }
  };

  const handleDelete = async (opId: string) => {
    if (!confirm("¿Eliminar esta operación?")) return;
    await fetch(`/api/operations/${opId}`, { method: "DELETE" });
    setOperations((prev) => prev.filter((o) => o.id !== opId));
    if (selectedOp?.id === opId) setSelectedOp(null);
    setActionMenu(null);
  };

  /** Generate a document from a template type, pre-filled with operation data */
  const handleGenerateDoc = async (templateType: string) => {
    if (!selectedOp) return;
    const tpl = templates.find((t) => t.type === templateType);
    if (!tpl) {
      setFeedback({ type: "error", message: "No hay plantilla disponible. Creá una en Documentos." });
      return;
    }
    setGeneratingDoc(true);
    try {
      const res = await fetch("/api/templates/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: tpl.id,
          vehicleId: selectedOp.vehicleId || undefined,
          clientId: selectedOp.clientId || undefined,
          supplierId: selectedOp.supplierId || undefined,
          operationId: selectedOp.id,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.content) {
        setDocContent(data.content);
        setShowDocPreview(true);
      }
    } catch {
      setFeedback({ type: "error", message: "No se pudo generar el documento" });
    } finally {
      setGeneratingDoc(false);
    }
  };

  /** Execute an actionable step suggestion */
  const handleStepAction = (action: StepAction) => {
    if (action.type === "navigate") {
      router.push(action.target);
    } else if (action.type === "generate_doc") {
      handleGenerateDoc(action.target);
    } else if (action.type === "create_payment") {
      // Navigate to cash with prefill params in URL
      const params = new URLSearchParams();
      if (action.prefill) {
        Object.entries(action.prefill).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== 0 && v !== "") params.set(k, String(v));
        });
      }
      router.push(`/dashboard/cash?${params.toString()}`);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId); else next.add(stepId);
      return next;
    });
  };

  const refreshOp = async (opId: string) => {
    const res = await fetch(`/api/operations/${opId}`);
    const updated = await res.json();
    setSelectedOp(updated);
    setOperations((prev) => prev.map((o) => (o.id === opId ? updated : o)));
    return updated;
  };

  const handleToggleCheck = async (opId: string, stepId: string, checkItemId: string) => {
    setLoadingChecks((prev) => new Set(prev).add(checkItemId));
    try {
      await fetch(`/api/operations/${opId}/steps/${stepId}/checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkItemId }),
      });
      await refreshOp(opId);
    } catch {
      setFeedback({ type: "error", message: "No se pudo actualizar el item" });
    } finally {
      setLoadingChecks((prev) => { const next = new Set(prev); next.delete(checkItemId); return next; });
    }
  };

  const handleAddCheck = async (opId: string, stepId: string) => {
    const label = newCheckLabel[stepId]?.trim();
    if (!label) return;
    try {
      await fetch(`/api/operations/${opId}/steps/${stepId}/checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      setNewCheckLabel((prev) => ({ ...prev, [stepId]: "" }));
      await refreshOp(opId);
    } catch {
      setFeedback({ type: "error", message: "No se pudo agregar el item" });
    }
  };

  /** Register an expense/payment inline without leaving the page */
  const handleInlineExpense = async (opId: string, type: "EGRESO" | "INGRESO", vehicleId?: string, isPayment?: boolean) => {
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.concept.trim() || isNaN(amount) || amount <= 0) {
      setFeedback({ type: "error", message: "Completá concepto y monto" });
      return;
    }
    if (!expenseForm.cashAccountId) {
      setFeedback({ type: "error", message: "Seleccioná una cuenta de caja" });
      return;
    }
    setSavingExpense(true);
    try {
      const res = await fetch("/api/cash/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          type,
          concept: expenseForm.concept.trim(),
          category: expenseForm.category || "OPERACIÓN",
          amountARS: expenseForm.currency === "ARS" ? amount : 0,
          amountUSD: expenseForm.currency === "USD" ? amount : 0,
          currency: expenseForm.currency,
          cashAccountId: expenseForm.cashAccountId,
          vehicleId: vehicleId || null,
          operationId: opId,
          isPayment: !!isPayment,
        }),
      });
      if (!res.ok) throw new Error();
      setExpenseForm({ concept: "", amount: "", currency: "ARS", cashAccountId: "", category: "" });
      setShowExpenseForm(false);
      await refreshOp(opId);
      setFeedback({ type: "success", message: `${type === "EGRESO" ? "Gasto" : "Cobro"} registrado correctamente` });
    } catch {
      setFeedback({ type: "error", message: "No se pudo registrar el movimiento" });
    } finally {
      setSavingExpense(false);
    }
  };

  const completedSteps = (op: Operation) => op.steps.filter((s) => s.status === "COMPLETADO" || s.status === "OMITIDO").length;
  const progress = (op: Operation) => op.steps.length ? Math.round((completedSteps(op) / op.steps.length) * 100) : 0;

  /** Upload photos to a vehicle from within an operation step */
  const handlePhotoUpload = async (vehicleId: string, files: FileList) => {
    if (!vehicleId || files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const dataUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setFeedback({ type: "error", message: `${file.name} es muy grande (máx 5MB)` });
          continue;
        }
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        dataUrls.push(dataUrl);
      }
      if (dataUrls.length === 0) return;
      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: dataUrls }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: `${dataUrls.length} foto${dataUrls.length > 1 ? "s" : ""} subida${dataUrls.length > 1 ? "s" : ""} correctamente` });
      if (selectedOp) await refreshOp(selectedOp.id);
      // Refresh vehicles list too
      const vRes = await fetch("/api/vehicles");
      const vData = await vRes.json();
      setVehicles(vData.vehicles || vData);
    } catch {
      setFeedback({ type: "error", message: "No se pudieron subir las fotos" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  /** Handle inline save of totalAmount */
  const handleSaveAmount = async (opId: string) => {
    const val = parseFloat(editAmountValue);
    if (isNaN(val) || val < 0) return;
    await handleUpdateOp(opId, { totalAmount: val });
    setEditingAmount(false);
  };

  /** OCR: scan DNI image and update person */
  const handleScanDni = async (file: File, personId: string, personType: "client" | "supplier") => {
    setScanning(true);
    setScanType("dni");
    try {
      const { scanDni } = await import("@/lib/ocr");
      const data = await scanDni(file);
      if (!data.dni && !data.firstName && !data.lastName) {
        setFeedback({ type: "error", message: "No se pudieron extraer datos del DNI. Ingresalos manualmente." });
        return;
      }
      const updates: Record<string, string | undefined> = {};
      if (data.firstName) updates.firstName = data.firstName;
      if (data.lastName) updates.lastName = data.lastName;
      if (data.dni) updates.dni = data.dni;
      if (data.sex) updates.sex = data.sex;

      const endpoint = personType === "client" ? `/api/clients/${personId}` : `/api/suppliers/${personId}`;
      const res = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
      if (selectedOp) await refreshOp(selectedOp.id);
      setFeedback({ type: "success", message: "Datos del DNI extraídos y guardados" });
    } catch {
      setFeedback({ type: "error", message: "Error al escanear DNI" });
    } finally {
      setScanning(false);
      setScanType(null);
    }
  };

  /** OCR: scan Cédula Verde and update vehicle */
  const handleScanCedula = async (file: File, vehicleId: string) => {
    setScanning(true);
    setScanType("cedula");
    try {
      const { scanCedula } = await import("@/lib/ocr");
      const data = await scanCedula(file);
      if (!data.brand && !data.model && !data.domain) {
        setFeedback({ type: "error", message: "No se pudieron extraer datos de la cédula. Ingresalos manualmente." });
        return;
      }
      const updates: Record<string, unknown> = {};
      if (data.brand) updates.brand = data.brand;
      if (data.model) updates.model = data.model;
      if (data.year) updates.year = parseInt(data.year);
      if (data.domain) updates.domain = data.domain;
      if (data.chassisNumber) updates.chassisNumber = data.chassisNumber;
      if (data.engineNumber) updates.engineNumber = data.engineNumber;
      if (data.brand && data.model) updates.name = `${data.brand} ${data.model}${data.year ? ` ${data.year}` : ""}`;

      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
      if (selectedOp) await refreshOp(selectedOp.id);
      const vRes = await fetch("/api/vehicles");
      const vData = await vRes.json();
      setVehicles(vData.vehicles || vData);
      setFeedback({ type: "success", message: "Datos de la cédula extraídos y guardados" });
    } catch {
      setFeedback({ type: "error", message: "Error al escanear cédula" });
    } finally {
      setScanning(false);
      setScanType(null);
    }
  };

  /** Inline vehicle editing: save partial vehicle data */
  const handleSaveVehicleInline = async (vehicleId: string) => {
    setSavingVehicle(true);
    try {
      const updates: Record<string, unknown> = {};
      if (vehicleForm.brand !== undefined) updates.brand = vehicleForm.brand || null;
      if (vehicleForm.model !== undefined) updates.model = vehicleForm.model || null;
      if (vehicleForm.year !== undefined) updates.year = vehicleForm.year ? parseInt(vehicleForm.year) : null;
      if (vehicleForm.domain !== undefined) updates.domain = vehicleForm.domain || null;
      if (vehicleForm.kilometers !== undefined) updates.kilometers = vehicleForm.kilometers ? parseInt(vehicleForm.kilometers) : null;
      if (vehicleForm.chassisNumber !== undefined) updates.chassisNumber = vehicleForm.chassisNumber || null;
      if (vehicleForm.engineNumber !== undefined) updates.engineNumber = vehicleForm.engineNumber || null;
      if (vehicleForm.fuel !== undefined) updates.fuel = vehicleForm.fuel || null;
      if (vehicleForm.color !== undefined) updates.color = vehicleForm.color || null;
      if (vehicleForm.transmission !== undefined) updates.transmission = vehicleForm.transmission || null;
      // Auto-generate name from brand + model + year
      const brand = vehicleForm.brand ?? "";
      const model = vehicleForm.model ?? "";
      const year = vehicleForm.year ?? "";
      if (brand || model) updates.name = `${brand} ${model}${year ? ` ${year}` : ""}`.trim();

      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
      if (selectedOp) await refreshOp(selectedOp.id);
      const vRes = await fetch("/api/vehicles");
      const vData = await vRes.json();
      setVehicles(vData.vehicles || vData);
      setEditingVehicle(false);
      setFeedback({ type: "success", message: "Vehículo actualizado" });
    } catch {
      setFeedback({ type: "error", message: "No se pudo actualizar el vehículo" });
    } finally {
      setSavingVehicle(false);
    }
  };

  /** Inline person editing: save partial person data */
  const handleSavePersonInline = async (personId: string, personType: "client" | "supplier") => {
    setSavingPerson(true);
    try {
      const endpoint = personType === "client" ? `/api/clients/${personId}` : `/api/suppliers/${personId}`;
      const res = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(personForm) });
      if (!res.ok) throw new Error();
      if (selectedOp) await refreshOp(selectedOp.id);
      // Refresh lists
      const [cRes, sRes] = await Promise.all([fetch("/api/clients").then((r) => r.json()), fetch("/api/suppliers").then((r) => r.json())]);
      setClients(cRes.clients || cRes);
      setSuppliers(sRes.suppliers || sRes);
      setEditingPerson(false);
      setFeedback({ type: "success", message: "Persona actualizada" });
    } catch {
      setFeedback({ type: "error", message: "No se pudo actualizar la persona" });
    } finally {
      setSavingPerson(false);
    }
  };

  /** Start editing vehicle inline, pre-fill form */
  const startEditingVehicle = (v: Vehicle) => {
    setVehicleForm({
      brand: v.brand || "",
      model: v.model || "",
      year: v.year?.toString() || "",
      domain: v.domain || "",
      kilometers: v.kilometers?.toString() || "",
      chassisNumber: v.chassisNumber || "",
      engineNumber: v.engineNumber || "",
      fuel: v.fuel || "",
      color: v.color || "",
      transmission: v.transmission || "",
    });
    setEditingVehicle(true);
  };

  /** Start editing person inline, pre-fill form */
  const startEditingPerson = (p: Person) => {
    setPersonForm({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      dni: p.dni || "",
      cuit: p.cuit || "",
      phone: p.phone || "",
      email: p.email || "",
      province: p.province || "",
      city: p.city || "",
      street: p.street || "",
      streetNumber: p.streetNumber || "",
    });
    setEditingPerson(true);
  };

  /** Inline expense/payment form component */
  const renderInlineExpenseForm = (opId: string, type: "EGRESO" | "INGRESO", vehicleId?: string, defaultConcept?: string, isPayment?: boolean) => {
    if (!showExpenseForm) {
      return (
        <button
          onClick={() => { setShowExpenseForm(true); setExpenseForm((f) => ({ ...f, concept: defaultConcept || "", cashAccountId: cashAccounts[0]?.id || "" })); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-700/50 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-400 hover:text-blue-400 transition-colors text-sm"
        >
          <PlusCircle size={16} />
          <span>Agregar {type === "EGRESO" ? "gasto" : "cobro"}</span>
        </button>
      );
    }

    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{type === "EGRESO" ? "Nuevo gasto" : "Nuevo cobro"}</h4>
          <button onClick={() => setShowExpenseForm(false)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
        </div>

        <input
          type="text"
          value={expenseForm.concept}
          onChange={(e) => setExpenseForm((f) => ({ ...f, concept: e.target.value }))}
          placeholder="¿En qué se gastó? (ej: Service mecánico, Pintura...)"
          className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="Monto"
              className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={expenseForm.currency}
            onChange={(e) => setExpenseForm((f) => ({ ...f, currency: e.target.value }))}
            className="px-2 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Cuenta de caja</label>
          {cashAccounts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {cashAccounts.filter((a) => a.currency === expenseForm.currency || expenseForm.currency === "ARS").map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setExpenseForm((f) => ({ ...f, cashAccountId: acc.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${expenseForm.cashAccountId === acc.id ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700/50 bg-gray-900/50 text-gray-400 hover:border-gray-600"}`}
                >
                  {acc.type === "EFECTIVO" ? "💵" : acc.type === "BANCO" ? "🏦" : acc.type === "MERCADOPAGO" ? "📱" : "📋"}{" "}
                  {acc.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-yellow-400">No hay cuentas de caja. Creá una en Caja para poder registrar movimientos.</p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => handleInlineExpense(opId, type, vehicleId, isPayment)}
            disabled={savingExpense || !expenseForm.concept.trim() || !expenseForm.amount || !expenseForm.cashAccountId}
          >
            {savingExpense ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />}
            {savingExpense ? "Guardando..." : "Registrar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Cancelar</Button>
        </div>
      </div>
    );
  };

  /** Reusable smart panel renderer — shows contextual help for any step based on its title */
  const renderStepSmartPanel = (step: Step, op: Operation) => {
    const v = op.vehicle;
    // For COMPRA_VENTA, determine person based on which phase we're in
    const isCompraPhase = step.title.includes("Ingreso") || step.title.includes("Negociación de Compra") || step.title.includes("proveedor") || step.title.includes("Pago al proveedor") || step.title.includes("Transferencia de Ingreso") || step.title.includes("Documentación de Compra") || step.title.includes("Documentación y Alta");
    const person = (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? op.supplier : op.client;
    const personLabel = (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "Proveedor" : op.type === "CONSIGNACION" ? "Consignante" : "Comprador";
    const stepTitle = step.title;

    // ── INSPECTION / INGRESO / RECEPCIÓN ──
    if (stepTitle.includes("Ingreso") || stepTitle.includes("Recepción") || stepTitle.includes("Verificación")) {
      return (
        <div className="mb-4 space-y-3">
          {v ? (
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 overflow-hidden">
              <div className="flex gap-4 p-3">
                {v.photos && v.photos.length > 0 ? (
                  <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                    <img src={v.photos[0].url} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-20 rounded-lg flex-shrink-0 bg-gray-700/50 flex items-center justify-center">
                    <Car size={24} className="text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm truncate">{v.name}</h4>
                    {!editingVehicle && (
                      <button onClick={() => startEditingVehicle(v)} className="text-gray-500 hover:text-blue-400 transition-colors p-1"><Edit3 size={12} /></button>
                    )}
                  </div>
                  {v.domain && <p className="text-xs text-blue-400 font-mono">{v.domain}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2">
                    {v.year && <div className="flex items-center gap-1.5 text-xs"><Calendar size={11} className="text-gray-500" /><span className="text-gray-400">{v.year}</span></div>}
                    {v.kilometers != null && <div className="flex items-center gap-1.5 text-xs"><Gauge size={11} className="text-gray-500" /><span className="text-gray-400">{v.kilometers.toLocaleString("es-AR")} km</span></div>}
                    {v.fuel && <div className="flex items-center gap-1.5 text-xs"><Fuel size={11} className="text-gray-500" /><span className="text-gray-400">{v.fuel}</span></div>}
                    {v.color && <div className="flex items-center gap-1.5 text-xs"><Palette size={11} className="text-gray-500" /><span className="text-gray-400">{v.color}</span></div>}
                    {v.transmission && <div className="flex items-center gap-1.5 text-xs"><Settings2 size={11} className="text-gray-500" /><span className="text-gray-400">{v.transmission}</span></div>}
                  </div>
                </div>
              </div>
              {(v.priceARS || v.priceUSD) && (
                <div className="px-3 py-2 border-t border-gray-700/30 bg-gray-800/50 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Precio de Toma</span>
                  <span className="text-sm font-bold">{v.priceARS ? formatCurrency(v.priceARS, "ARS") : ""}{v.priceARS && v.priceUSD ? " / " : ""}{v.priceUSD ? formatCurrency(v.priceUSD, "USD") : ""}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
              <Car size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-300">Vinculá un vehículo</p>
              <p className="text-xs text-gray-500 mt-1">Para inspeccionar, necesitás asociar un vehículo a esta operación.</p>
              <div className="mt-3 max-w-xs mx-auto">
                <Select label="" value="" onChange={(e) => handleUpdateOp(op.id, { vehicleId: e.target.value })} options={[{ value: "", label: "Seleccionar vehículo..." }, ...vehicles.map((vh) => ({ value: vh.id, label: vh.name }))]} />
              </div>
            </div>
          )}

          {/* Inline vehicle editing form */}
          {v && editingVehicle && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Editar datos del vehículo</h4>
                <button onClick={() => setEditingVehicle(false)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={vehicleForm.brand || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Marca" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.model || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} placeholder="Modelo" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.year || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))} placeholder="Año" type="number" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.domain || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, domain: e.target.value }))} placeholder="Dominio/Patente" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.kilometers || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, kilometers: e.target.value }))} placeholder="Kilómetros" type="number" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.chassisNumber || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, chassisNumber: e.target.value }))} placeholder="Nº Chasis" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={vehicleForm.engineNumber || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, engineNumber: e.target.value }))} placeholder="Nº Motor" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <select value={vehicleForm.fuel || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, fuel: e.target.value }))} className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Combustible</option>
                  <option value="Nafta">Nafta</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GNC">GNC</option>
                  <option value="Nafta/GNC">Nafta/GNC</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
                <input value={vehicleForm.color || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, color: e.target.value }))} placeholder="Color" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <select value={vehicleForm.transmission || ""} onChange={(e) => setVehicleForm((f) => ({ ...f, transmission: e.target.value }))} className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Transmisión</option>
                  <option value="Manual">Manual</option>
                  <option value="Automático">Automático</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveVehicleInline(v.id)} disabled={savingVehicle}>
                  {savingVehicle ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingVehicle(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* OCR: Scan Cédula Verde */}
          {v && (
            <div className="flex gap-2 flex-wrap">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${scanning && scanType === "cedula" ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-blue-500/30 hover:text-blue-400"}`}>
                {scanning && scanType === "cedula" ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
                <span>{scanning && scanType === "cedula" ? "Escaneando cédula..." : "Escanear Cédula Verde"}</span>
                <input ref={cedulaInputRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={scanning} onChange={(e) => { const f = e.target.files?.[0]; if (f && v) handleScanCedula(f, v.id); e.target.value = ""; }} />
              </label>
              {!editingVehicle && (
                <button onClick={() => startEditingVehicle(v)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-blue-500/30 hover:text-blue-400 transition-colors text-xs">
                  <Edit3 size={14} /> Editar datos manualmente
                </button>
              )}
            </div>
          )}

          {/* Photo gallery + upload */}
          {v && (
            <div className="space-y-2">
              {v.photos && v.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {v.photos.map((photo, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-700 group">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${uploadingPhotos ? "border-blue-500/30 bg-blue-500/5" : "border-gray-700/50 hover:border-blue-500/30 hover:bg-blue-500/5"}`}>
                {uploadingPhotos ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Camera size={16} className="text-gray-500" />}
                <span className="text-xs text-gray-400">{uploadingPhotos ? "Subiendo..." : "Subir fotos del vehículo"}</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingPhotos} onChange={(e) => { if (e.target.files && v) handlePhotoUpload(v.id, e.target.files); e.target.value = ""; }} />
              </label>
            </div>
          )}

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Inspección - ${v?.name || "vehículo"}`)}

          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist de Inspección</h4>
        </div>
      );
    }

    // ── NEGOCIACIÓN ──
    if (stepTitle.includes("Negociación")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 space-y-3">
            {/* Editable price */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Precio acordado / Monto de la operación</p>
              {editingAmount ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{op.currency}</span>
                  <input
                    type="number"
                    value={editAmountValue}
                    onChange={(e) => setEditAmountValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveAmount(op.id); if (e.key === "Escape") setEditingAmount(false); }}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={() => handleSaveAmount(op.id)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check size={14} /></button>
                  <button onClick={() => setEditingAmount(false)} className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditAmountValue(String(op.totalAmount || "")); setEditingAmount(true); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 border border-gray-700/50 transition-colors group"
                >
                  <span className={`text-lg font-bold ${op.totalAmount ? "text-white" : "text-gray-600"}`}>{op.totalAmount ? formatCurrency(op.totalAmount, op.currency) : "Sin definir"}</span>
                  <Edit3 size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                </button>
              )}
            </div>

            {/* Vehicle cost reference */}
            {v && (v.priceARS || v.priceUSD) && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <Car size={12} className="text-gray-600" />
                <span className="text-gray-500">Ref. vehículo:</span>
                <span className="text-gray-300 font-medium">{v.priceARS ? formatCurrency(v.priceARS, "ARS") : ""}{v.priceARS && v.priceUSD ? " / " : ""}{v.priceUSD ? formatCurrency(v.priceUSD, "USD") : ""}</span>
              </div>
            )}

            {/* Profitability calculator */}
            {(() => {
              const purchaseCost = v?.priceARS || 0;
              const expenses = (op.payments || []).filter((p) => p.type === "EGRESO").reduce((sum, p) => sum + (p.amountARS || 0), 0);
              const salePrice = op.totalAmount || 0;
              const totalCost = purchaseCost + expenses;
              const profit = salePrice - totalCost;
              const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
              if (purchaseCost > 0 || expenses > 0) {
                return (
                  <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-3 space-y-2">
                    <h5 className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold flex items-center gap-1.5"><TrendingUp size={11} /> Rentabilidad proyectada</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {purchaseCost > 0 && (
                        <div className="flex justify-between"><span className="text-gray-500">Costo compra</span><span className="text-red-400">-{formatCurrency(purchaseCost, op.currency)}</span></div>
                      )}
                      {expenses > 0 && (
                        <div className="flex justify-between"><span className="text-gray-500">Gastos</span><span className="text-red-400">-{formatCurrency(expenses, op.currency)}</span></div>
                      )}
                      <div className="flex justify-between"><span className="text-gray-500">Precio venta</span><span className={salePrice > 0 ? "text-green-400" : "text-gray-600"}>{salePrice > 0 ? formatCurrency(salePrice, op.currency) : "Sin definir"}</span></div>
                      <div className="flex justify-between col-span-2 pt-1 border-t border-gray-700/30">
                        <span className="text-gray-400 font-medium">Ganancia</span>
                        <span className={`font-bold ${profit > 0 ? "text-green-400" : profit < 0 ? "text-red-400" : "text-gray-500"}`}>
                          {salePrice > 0 ? `${formatCurrency(profit, op.currency)} (${margin.toFixed(1)}%)` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Person context */}
            {person ? (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <User size={12} className="text-gray-600" />
                <span className="text-gray-500">{personLabel}:</span>
                <span className="text-gray-300 font-medium">{person.firstName} {person.lastName}</span>
                {person.phone && <span className="text-gray-500 ml-auto">{person.phone}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-yellow-500/5 border border-yellow-500/20 text-xs">
                <AlertTriangle size={12} className="text-yellow-400" />
                <span className="text-yellow-300">Asociá {isCompraPhase ? "un proveedor" : "un comprador"} para negociar</span>
              </div>
            )}
          </div>

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Negociación - ${v?.name || "vehículo"}`)}
        </div>
      );
    }

    // ── PREPARACIÓN / PUBLICACIÓN ──
    if (stepTitle.includes("Preparación") || stepTitle.includes("Publicación")) {
      return (
        <div className="mb-4 space-y-3">
          {op.payments && op.payments.length > 0 ? (
            <div className="rounded-lg border border-gray-700/50 overflow-hidden">
              <div className="px-3 py-2 bg-gray-800/60 border-b border-gray-700/30">
                <h4 className="text-xs font-semibold text-gray-400">Gastos Registrados</h4>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/30">
                    <th className="text-left text-[10px] text-gray-500 uppercase px-3 py-2">Fecha</th>
                    <th className="text-left text-[10px] text-gray-500 uppercase px-3 py-2">Descripción</th>
                    <th className="text-right text-[10px] text-gray-500 uppercase px-3 py-2">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {op.payments.filter((p) => p.type === "EGRESO").map((p) => (
                    <tr key={p.id} className="border-b border-gray-700/20">
                      <td className="text-xs text-gray-400 px-3 py-2">{formatDate(p.date)}</td>
                      <td className="text-xs text-gray-300 px-3 py-2">{p.concept}</td>
                      <td className="text-xs text-red-400 font-medium text-right px-3 py-2">{formatCurrency(p.currency === "USD" ? p.amountUSD : p.amountARS, p.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(() => {
                const egressos = op.payments.filter((p) => p.type === "EGRESO");
                const totalGastos = egressos.reduce((sum, p) => sum + (p.currency === "USD" ? p.amountUSD : p.amountARS), 0);
                const curr = egressos[0]?.currency || op.currency;
                return totalGastos > 0 ? (
                  <div className="px-3 py-2.5 bg-gray-800/60 border-t border-gray-700/30 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Total Gastos</span>
                    <span className="text-sm font-bold text-red-400">{formatCurrency(totalGastos, curr)}</span>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4 text-center">
              <Wrench size={20} className="text-gray-600 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">No hay gastos registrados aún</p>
            </div>
          )}

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Preparación - ${v?.name || "vehículo"}`)}

          {/* Photo upload for vehicle listing */}
          {v && stepTitle.includes("Publicación") && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Megaphone size={12} /> Fotos para publicación</h4>
              {v.photos && v.photos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {v.photos.map((photo, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">El vehículo no tiene fotos de publicación aún.</p>
              )}
              <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${uploadingPhotos ? "border-blue-500/30 bg-blue-500/5" : "border-gray-700/50 hover:border-blue-500/30 hover:bg-blue-500/5"}`}>
                {uploadingPhotos ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Camera size={16} className="text-gray-500" />}
                <span className="text-xs text-gray-400">{uploadingPhotos ? "Subiendo..." : "Subir fotos profesionales"}</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingPhotos} onChange={(e) => { if (e.target.files && v) handlePhotoUpload(v.id, e.target.files); e.target.value = ""; }} />
              </label>
            </div>
          )}

          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tareas</h4>
        </div>
      );
    }

    // ── PRESUPUESTO ──
    if (stepTitle.includes("Presupuesto")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 space-y-3">
            {/* Vehicle + price summary */}
            {v && (
              <div className="flex items-center gap-3">
                {v.photos && v.photos.length > 0 ? (
                  <div className="w-14 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                    <img src={v.photos[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-14 h-12 rounded-lg flex-shrink-0 bg-gray-700/50 flex items-center justify-center"><Car size={18} className="text-gray-600" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.name}</p>
                  <p className="text-lg font-bold">{op.totalAmount ? formatCurrency(op.totalAmount, op.currency) : "Sin precio definido"}</p>
                </div>
              </div>
            )}
            {person && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <User size={12} className="text-gray-600" />
                <span className="text-gray-400">{person.firstName} {person.lastName}</span>
                {person.phone && <span className="text-gray-500 ml-auto">{person.phone}</span>}
                {person.email && <span className="text-gray-500 ml-auto"><Mail size={10} className="inline mr-1" />{person.email}</span>}
              </div>
            )}
          </div>

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Presupuesto - ${v?.name || "vehículo"}`)}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleGenerateDoc("PRESUPUESTO")} disabled={generatingDoc}>
              <FileText size={14} className="mr-1.5" /> Generar presupuesto
            </Button>
          </div>
        </div>
      );
    }

    // ── PAGO / COBRO / SEÑA (any payment step) ──
    if (stepTitle.includes("Pago") || stepTitle.includes("Cobro") || stepTitle.includes("Seña")) {
      const total = op.totalAmount || 0;
      const paid = op.paidAmount || 0;
      const remaining = total - paid;
      const percentage = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
      const isDeposit = stepTitle.includes("Seña");
      const paymentType = (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "EGRESO" : "INGRESO";

      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">{isDeposit ? "Monto Total" : "Monto Total"}</p>
                <p className="text-sm font-bold">{formatCurrency(total, op.currency)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">{(op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "Pagado" : "Cobrado"}</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(paid, op.currency)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Restante</p>
                <p className="text-sm font-bold text-yellow-400">{formatCurrency(remaining, op.currency)}</p>
              </div>
            </div>
            {total > 0 && (
              <div className="mt-2.5">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? "#22c55e" : "#3b82f6" }} />
                </div>
                <p className="text-[10px] text-gray-600 mt-1 text-right">{percentage.toFixed(0)}% {(op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "pagado" : "cobrado"}</p>
              </div>
            )}
          </div>

          {person && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <User size={14} className="text-gray-500" />
              <span className="text-xs text-gray-400">{personLabel}:</span>
              <span className="text-xs font-medium text-gray-300">{person.firstName} {person.lastName}</span>
              {person.phone && <span className="text-xs text-gray-500 ml-auto">{person.phone}</span>}
            </div>
          )}

          {!total && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-300">Definí el monto de la operación para registrar {(op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "pagos" : "cobros"}.</span>
            </div>
          )}

          {renderInlineExpenseForm(
            op.id,
            paymentType,
            v?.id,
            `${isDeposit ? "Seña" : (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "Pago" : "Cobro"} - ${v?.name || "operación"}`,
            true
          )}
        </div>
      );
    }

    // ── FINANCIACIÓN ──
    if (stepTitle.includes("Financiación")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-blue-400" />
              <span className="text-sm font-semibold">Plan de Financiación</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-gray-900/30">
                <p className="text-[10px] text-gray-500 uppercase">Monto Total</p>
                <p className="text-sm font-bold">{formatCurrency(op.totalAmount, op.currency)}</p>
              </div>
              <div className="p-2 rounded bg-gray-900/30">
                <p className="text-[10px] text-gray-500 uppercase">Cobrado</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(op.paidAmount || 0, op.currency)}</p>
              </div>
            </div>
            {person && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <User size={12} className="text-gray-600" />
                {person.firstName} {person.lastName}
                {person.phone && <span className="ml-auto text-gray-500">{person.phone}</span>}
              </div>
            )}
          </div>
          {renderInlineExpenseForm(op.id, (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "EGRESO" : "INGRESO", v?.id, `Financiación - ${v?.name || "vehículo"}`, true)}

          <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/debts")}>
            <FileSignature size={14} className="mr-1.5" /> Ir a Deudas/Cuotas
          </Button>
        </div>
      );
    }

    // ── CIERRE / DOCUMENTACIÓN ──
    if (stepTitle.includes("Cierre") || stepTitle.includes("Documentación") || stepTitle.includes("Liquidación")) {
      const cierreTemplateType = op.type === "CONSIGNACION" ? "CONSIGNACION" : "BOLETO";
      const personKind: "client" | "supplier" = (op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "supplier" : "client";
      return (
        <div className="mb-4 space-y-3">
          {person ? (
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
                  <User size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{personLabel}</p>
                      <p className="text-sm font-semibold truncate">{person.firstName} {person.lastName}</p>
                    </div>
                    {!editingPerson && (
                      <button onClick={() => startEditingPerson(person)} className="text-gray-500 hover:text-blue-400 transition-colors p-1"><Edit3 size={12} /></button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {person.dni && <div className="flex items-center gap-1.5 text-gray-400"><Hash size={11} className="text-gray-600" /> DNI: {person.dni}</div>}
                {person.cuit && <div className="flex items-center gap-1.5 text-gray-400"><CreditCard size={11} className="text-gray-600" /> CUIT: {person.cuit}</div>}
                {person.phone && <div className="flex items-center gap-1.5 text-gray-400"><Phone size={11} className="text-gray-600" /> {person.phone}</div>}
                {person.email && <div className="flex items-center gap-1.5 text-gray-400"><Mail size={11} className="text-gray-600" /> {person.email}</div>}
                {(person.street || person.city) && (
                  <div className="flex items-center gap-1.5 text-gray-400 sm:col-span-2"><MapPin size={11} className="text-gray-600" /> {[person.street, person.streetNumber, person.city, person.province].filter(Boolean).join(", ")}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
              <UserCircle size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-300">Asociá {personKind === "supplier" ? "un proveedor" : "un comprador"}</p>
              <p className="text-xs text-gray-500 mt-1">Necesitás los datos para generar la documentación.</p>
              <div className="mt-3 max-w-xs mx-auto">
                {personKind === "supplier" ? (
                  <Select label="" value="" onChange={(e) => handleUpdateOp(op.id, { supplierId: e.target.value })} options={[{ value: "", label: "Seleccionar proveedor..." }, ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))]} />
                ) : (
                  <Select label="" value="" onChange={(e) => handleUpdateOp(op.id, { clientId: e.target.value })} options={[{ value: "", label: "Seleccionar cliente..." }, ...clients.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]} />
                )}
              </div>
            </div>
          )}

          {/* Inline person editing form */}
          {person && editingPerson && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Editar datos de {personLabel}</h4>
                <button onClick={() => setEditingPerson(false)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={personForm.firstName || ""} onChange={(e) => setPersonForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Nombre" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.lastName || ""} onChange={(e) => setPersonForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Apellido" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.dni || ""} onChange={(e) => setPersonForm((f) => ({ ...f, dni: e.target.value }))} placeholder="DNI" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.cuit || ""} onChange={(e) => setPersonForm((f) => ({ ...f, cuit: e.target.value }))} placeholder="CUIT" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.phone || ""} onChange={(e) => setPersonForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Teléfono" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.email || ""} onChange={(e) => setPersonForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.province || ""} onChange={(e) => setPersonForm((f) => ({ ...f, province: e.target.value }))} placeholder="Provincia" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.city || ""} onChange={(e) => setPersonForm((f) => ({ ...f, city: e.target.value }))} placeholder="Ciudad" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.street || ""} onChange={(e) => setPersonForm((f) => ({ ...f, street: e.target.value }))} placeholder="Calle" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={personForm.streetNumber || ""} onChange={(e) => setPersonForm((f) => ({ ...f, streetNumber: e.target.value }))} placeholder="Número" className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSavePersonInline(person.id, personKind)} disabled={savingPerson}>
                  {savingPerson ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPerson(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* OCR: Scan DNI */}
          {person && (
            <div className="flex gap-2 flex-wrap">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${scanning && scanType === "dni" ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-blue-500/30 hover:text-blue-400"}`}>
                {scanning && scanType === "dni" ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
                <span>{scanning && scanType === "dni" ? "Escaneando DNI..." : "Escanear DNI"}</span>
                <input ref={dniInputRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={scanning} onChange={(e) => { const f = e.target.files?.[0]; if (f && person) handleScanDni(f, person.id, personKind); e.target.value = ""; }} />
              </label>
              {!editingPerson && (
                <button onClick={() => startEditingPerson(person)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-blue-500/30 hover:text-blue-400 transition-colors text-xs">
                  <Edit3 size={14} /> Editar datos manualmente
                </button>
              )}
            </div>
          )}

          {/* Financial summary */}
          {op.totalAmount && (
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-[10px] text-gray-500 uppercase">Total</p><p className="text-sm font-bold">{formatCurrency(op.totalAmount, op.currency)}</p></div>
                <div><p className="text-[10px] text-gray-500 uppercase">{personKind === "supplier" ? "Pagado" : "Cobrado"}</p><p className="text-sm font-bold text-green-400">{formatCurrency(op.paidAmount || 0, op.currency)}</p></div>
                <div><p className="text-[10px] text-gray-500 uppercase">Restante</p><p className="text-sm font-bold text-yellow-400">{formatCurrency((op.totalAmount || 0) - (op.paidAmount || 0), op.currency)}</p></div>
              </div>
            </div>
          )}

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Cierre - ${v?.name || "vehículo"}`)}

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => handleGenerateDoc(cierreTemplateType)} disabled={generatingDoc}>
              <FileSignature size={14} className="mr-1.5" /> Generar {op.type === "CONSIGNACION" ? "liquidación" : "boleto de compra-venta"}
            </Button>
          </div>

          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck size={12} /> Documentación requerida
          </h4>
        </div>
      );
    }

    // ── TRANSFERENCIA ──
    if (stepTitle.includes("Transferencia")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-blue-400" />
              <span className="text-sm font-semibold">Gestión de Transferencia</span>
            </div>
            {v && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <Car size={12} className="text-gray-600" />
                <span className="text-gray-300 font-medium">{v.name}</span>
                {v.domain && <span className="text-blue-400 font-mono ml-auto">{v.domain}</span>}
              </div>
            )}
            {person && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <User size={12} className="text-gray-600" />
                <span className="text-gray-400">{personLabel}:</span>
                <span className="text-gray-300">{person.firstName} {person.lastName}</span>
                {person.dni && <span className="text-gray-500 ml-auto">DNI: {person.dni}</span>}
              </div>
            )}
          </div>
          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Transferencia - ${v?.name || "vehículo"}`)}

          <Button size="sm" variant="outline" onClick={() => handleGenerateDoc("BOLETO")} disabled={generatingDoc}>
            <FileText size={14} className="mr-1.5" /> Generar documentación de transferencia
          </Button>
        </div>
      );
    }

    // ── ENTREGA ──
    if (stepTitle.includes("Entrega")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-green-300">Entrega del Vehículo</span>
            </div>
            {v && (
              <div className="flex items-center gap-3 p-2 rounded bg-gray-900/20">
                {v.photos && v.photos.length > 0 ? (
                  <div className="w-14 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700"><img src={v.photos[0].url} alt="" className="w-full h-full object-cover" /></div>
                ) : <div className="w-14 h-12 rounded-lg flex-shrink-0 bg-gray-700/50 flex items-center justify-center"><Car size={18} className="text-gray-600" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.name}</p>
                  {v.domain && <p className="text-xs text-blue-400 font-mono">{v.domain}</p>}
                </div>
              </div>
            )}
            {person && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/20 text-xs">
                <User size={12} className="text-gray-500" />
                <span className="text-gray-300">{person.firstName} {person.lastName}</span>
                {person.phone && <span className="text-gray-500 ml-auto"><Phone size={10} className="inline mr-1" />{person.phone}</span>}
              </div>
            )}
            {op.totalAmount && (
              <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-900/20 text-xs">
                <span className="text-gray-400">{(op.type === "COMPRA" || (op.type === "COMPRA_VENTA" && isCompraPhase)) ? "Pagado" : "Cobrado"} / Total</span>
                <span className={`font-bold ${(op.paidAmount || 0) >= (op.totalAmount || 0) ? "text-green-400" : "text-yellow-400"}`}>{formatCurrency(op.paidAmount || 0, op.currency)} / {formatCurrency(op.totalAmount, op.currency)}</span>
              </div>
            )}
          </div>

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Entrega - ${v?.name || "vehículo"}`)}
        </div>
      );
    }

    // ── CONTRATO DE CONSIGNACIÓN ──
    if (stepTitle.includes("Contrato")) {
      return (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Handshake size={16} className="text-yellow-400" />
              <span className="text-sm font-semibold">Contrato de Consignación</span>
            </div>
            {person ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                  <User size={12} className="text-gray-600" />
                  <span className="text-gray-300 font-medium">{person.firstName} {person.lastName}</span>
                </div>
                {person.dni && <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs"><Hash size={12} className="text-gray-600" /><span className="text-gray-400">DNI: {person.dni}</span></div>}
                {person.phone && <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs"><Phone size={12} className="text-gray-600" /><span className="text-gray-400">{person.phone}</span></div>}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-yellow-500/5 border border-yellow-500/20 text-xs">
                <AlertTriangle size={12} className="text-yellow-400" />
                <span className="text-yellow-300">Asociá el consignante para generar el contrato</span>
              </div>
            )}
            {v && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900/30 text-xs mt-1">
                <Car size={12} className="text-gray-600" />
                <span className="text-gray-300">{v.name}</span>
                {v.domain && <span className="text-blue-400 font-mono ml-auto">{v.domain}</span>}
              </div>
            )}
            {op.totalAmount && (
              <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-900/30 text-xs">
                <span className="text-gray-500">Precio mínimo de venta</span>
                <span className="text-white font-bold">{formatCurrency(op.totalAmount, op.currency)}</span>
              </div>
            )}
          </div>

          {renderInlineExpenseForm(op.id, "EGRESO", v?.id, `Contrato - ${v?.name || "vehículo"}`)}

          <Button size="sm" variant="outline" onClick={() => handleGenerateDoc("CONSIGNACION")} disabled={generatingDoc}>
            <FileSignature size={14} className="mr-1.5" /> Generar contrato de consignación
          </Button>
        </div>
      );
    }

    // No matching panel
    return null;
  };
  const enCurso = operations.filter((o) => o.status === "EN_CURSO").length;
  const completadas = operations.filter((o) => o.status === "COMPLETADA").length;
  const thisMonth = operations.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (selectedOp) {
    const tc = TYPE_CONFIG[selectedOp.type] || TYPE_CONFIG.VENTA;
    const sc = STATUS_CONFIG[selectedOp.status] || STATUS_CONFIG.EN_CURSO;
    const doneSteps = selectedOp.steps.filter((s) => s.status === "COMPLETADO" || s.status === "OMITIDO");
    const pendingSteps = selectedOp.steps.filter((s) => s.status !== "COMPLETADO" && s.status !== "OMITIDO");
    const activeStep = pendingSteps[0] || null;
    const upcomingSteps = pendingSteps.slice(1);
    const assistant = getAssistantMessage(selectedOp);

    // Compute action for active step
    const activeStepAction = activeStep ? (() => {
      const opData = {
        id: selectedOp.id,
        type: selectedOp.type,
        vehicleName: selectedOp.vehicle?.name,
        clientName: selectedOp.client ? `${selectedOp.client.firstName} ${selectedOp.client.lastName}` : undefined,
        totalAmount: selectedOp.totalAmount,
        paidAmount: selectedOp.paidAmount || 0,
        depositAmount: selectedOp.depositAmount,
        remainingAmount: selectedOp.financial?.remaining,
        currency: selectedOp.currency,
      };
      return getStepAction(activeStep.title, opData);
    })() : null;

    return (
      <div className="space-y-4 sm:space-y-5">
        {/* Feedback toast */}
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${feedback.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
            {feedback.message}
          </div>
        )}

        {/* Top nav bar */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOp(null)} className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{tc.icon}</span>
              <h1 className="text-xl font-bold">{tc.label}</h1>
              {selectedOp.vehicle && <span className="text-sm text-gray-400">· {selectedOp.vehicle.name}</span>}
              <Badge variant={sc.variant}>{sc.label}</Badge>
            </div>
          </div>
          {selectedOp.status === "EN_CURSO" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                const willExpand = expandedSteps.size < selectedOp.steps.length;
                setExpandedSteps(willExpand ? new Set(selectedOp.steps.map((s) => s.id)) : new Set());
              }}>
                <Settings2 size={14} className="mr-1" /> {expandedSteps.size >= selectedOp.steps.length ? "Colapsar" : "Ver todo"}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleUpdateOp(selectedOp.id, { status: "CANCELADA" })}>
                <Ban size={14} className="mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  ASSISTANT HERO CARD — the main thing the dealer sees        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`relative overflow-hidden rounded-xl border p-5 sm:p-6 ${
          selectedOp.status === "COMPLETADA" ? "bg-green-500/10 border-green-500/30" :
          selectedOp.status === "CANCELADA" ? "bg-red-500/10 border-red-500/30" :
          "bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border-blue-500/30"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-4xl flex-shrink-0">{assistant.emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold">{assistant.message}</h2>
              <p className="text-sm text-gray-400 mt-1">{assistant.detail}</p>
            </div>
            {activeStep && selectedOp.status === "EN_CURSO" && (
              <div className="flex-shrink-0 flex flex-col gap-2">
                {activeStepAction && (
                  <Button onClick={() => handleStepAction(activeStepAction)} disabled={generatingDoc}>
                    {activeStepAction.type === "generate_doc" ? <FileText size={16} className="mr-2" /> : activeStepAction.type === "create_payment" ? <Receipt size={16} className="mr-2" /> : <Zap size={16} className="mr-2" />}
                    {activeStepAction.label}
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* Stepped progress indicator */}
          <div className="mt-5 flex gap-1">
            {selectedOp.steps.map((step) => (
              <div
                key={step.id}
                className="flex-1 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step.status === "COMPLETADO" ? tc.color :
                    step.status === "OMITIDO" ? "#374151" :
                    step.id === activeStep?.id ? `${tc.color}80` : "#1f2937",
                }}
                title={`${step.order}. ${step.title} — ${step.status === "COMPLETADO" ? "Hecho" : step.status === "OMITIDO" ? "Omitido" : "Pendiente"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-500">{doneSteps.length} de {selectedOp.steps.length} completados</span>
            <span className="text-[10px] text-gray-500">{progress(selectedOp)}%</span>
          </div>
        </div>

        {/* Smart Alerts — only show if there are real warnings */}
        {selectedOp.alerts && selectedOp.alerts.length > 0 && (
          <div className="space-y-2">
            {selectedOp.alerts.map((alert, i) => {
              const alertConfig = {
                error: { bg: "bg-red-500/10 border-red-500/30", icon: <AlertCircle size={16} className="text-red-400 flex-shrink-0" />, text: "text-red-300" },
                warning: { bg: "bg-yellow-500/10 border-yellow-500/30", icon: <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />, text: "text-yellow-300" },
                info: { bg: "bg-blue-500/10 border-blue-500/30", icon: <Info size={16} className="text-blue-400 flex-shrink-0" />, text: "text-blue-300" },
                success: { bg: "bg-green-500/10 border-green-500/30", icon: <Sparkles size={16} className="text-green-400 flex-shrink-0" />, text: "text-green-300" },
              }[alert.type];
              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${alertConfig.bg}`}>
                  {alertConfig.icon}
                  <span className={`text-sm ${alertConfig.text}`}>{alert.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  PERSISTENT FINANCIAL SUMMARY — always visible                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {(() => {
          const v = selectedOp.vehicle;
          const vehicleCost = selectedOp.currency === "USD" ? v?.priceUSD : v?.priceARS;
          const egressos = (selectedOp.payments || []).filter((p) => p.type === "EGRESO");
          const totalExpenses = egressos.reduce((sum, p) => sum + (p.currency === "USD" ? p.amountUSD : p.amountARS), 0);
          const totalCost = (vehicleCost || 0) + totalExpenses;
          const salePrice = selectedOp.totalAmount || 0;
          const paid = selectedOp.paidAmount || 0;
          const remaining = salePrice - paid;
          const profit = (selectedOp.type === "VENTA" || selectedOp.type === "COMPRA_VENTA") && totalCost > 0 ? salePrice - totalCost : null;
          const profitPct = profit !== null && totalCost > 0 ? (profit / totalCost) * 100 : null;
          const isPositive = profit !== null && profit >= 0;

          // Don't show if there's absolutely no financial data
          if (!salePrice && !vehicleCost && totalExpenses === 0 && paid === 0) return null;

          return (
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={14} className="text-blue-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen Financiero</h3>
                {profitPct !== null && (
                  <span className={`ml-auto flex items-center gap-1 text-xs font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositive ? "+" : ""}{profitPct.toFixed(1)}%
                  </span>
                )}
              </div>

              {(selectedOp.type === "VENTA" || selectedOp.type === "COMPRA_VENTA") ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Costo Compra</p>
                    <p className="text-sm font-bold text-gray-300">{vehicleCost ? formatCurrency(vehicleCost, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg cursor-pointer transition-colors ${showExpenseDetail && egressos.length > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-gray-900/50 hover:bg-gray-800/80"}`} onClick={() => egressos.length > 0 && setShowExpenseDetail((v) => !v)}>
                    <p className="text-[10px] text-gray-500 uppercase">Gastos {egressos.length > 0 && <span className="text-gray-600">({egressos.length})</span>}</p>
                    <p className="text-sm font-bold text-red-400">{totalExpenses > 0 ? formatCurrency(totalExpenses, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400 uppercase">Precio Venta</p>
                    <p className="text-sm font-bold text-white">{salePrice ? formatCurrency(salePrice, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${isPositive ? "bg-green-500/5 border border-green-500/20" : profit !== null ? "bg-red-500/5 border border-red-500/20" : "bg-gray-900/50"}`}>
                    <p className={`text-[10px] uppercase ${isPositive ? "text-green-400" : profit !== null ? "text-red-400" : "text-gray-500"}`}>Rentabilidad</p>
                    <p className={`text-sm font-bold ${isPositive ? "text-green-400" : profit !== null ? "text-red-400" : "text-gray-500"}`}>{profit !== null ? `${isPositive ? "+" : ""}${formatCurrency(profit, selectedOp.currency)}` : "—"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Cobrado</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(paid, selectedOp.currency)}</p>
                    {remaining > 0 && <p className="text-[10px] text-yellow-400 mt-0.5">Falta {formatCurrency(remaining, selectedOp.currency)}</p>}
                  </div>
                </div>
              ) : selectedOp.type === "COMPRA" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400 uppercase">Monto Compra</p>
                    <p className="text-sm font-bold text-white">{salePrice ? formatCurrency(salePrice, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg cursor-pointer transition-colors ${showExpenseDetail && egressos.length > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-gray-900/50 hover:bg-gray-800/80"}`} onClick={() => egressos.length > 0 && setShowExpenseDetail((v) => !v)}>
                    <p className="text-[10px] text-gray-500 uppercase">Gastos {egressos.length > 0 && <span className="text-gray-600">({egressos.length})</span>}</p>
                    <p className="text-sm font-bold text-red-400">{totalExpenses > 0 ? formatCurrency(totalExpenses, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Pagado</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(paid, selectedOp.currency)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Restante</p>
                    <p className={`text-sm font-bold ${remaining > 0 ? "text-yellow-400" : "text-green-400"}`}>{remaining > 0 ? formatCurrency(remaining, selectedOp.currency) : "Completo ✓"}</p>
                  </div>
                </div>
              ) : (
                /* CONSIGNACION */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400 uppercase">Precio Venta</p>
                    <p className="text-sm font-bold text-white">{salePrice ? formatCurrency(salePrice, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg cursor-pointer transition-colors ${showExpenseDetail && egressos.length > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-gray-900/50 hover:bg-gray-800/80"}`} onClick={() => egressos.length > 0 && setShowExpenseDetail((v) => !v)}>
                    <p className="text-[10px] text-gray-500 uppercase">Gastos {egressos.length > 0 && <span className="text-gray-600">({egressos.length})</span>}</p>
                    <p className="text-sm font-bold text-red-400">{totalExpenses > 0 ? formatCurrency(totalExpenses, selectedOp.currency) : "—"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Cobrado</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(paid, selectedOp.currency)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-900/50">
                    <p className="text-[10px] text-gray-500 uppercase">Restante</p>
                    <p className={`text-sm font-bold ${remaining > 0 ? "text-yellow-400" : "text-green-400"}`}>{remaining > 0 ? formatCurrency(remaining, selectedOp.currency) : "Completo ✓"}</p>
                  </div>
                </div>
              )}

              {/* Expandable expense detail */}
              {egressos.length > 0 && showExpenseDetail && (
                <div className="mt-3 rounded-lg border border-gray-700/30 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {egressos.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-700/20 last:border-0 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 truncate">{p.concept}</p>
                          <p className="text-[10px] text-gray-600">{formatDate(p.date)}</p>
                        </div>
                        <span className="text-red-400 font-medium ml-3 flex-shrink-0">-{formatCurrency(p.currency === "USD" ? p.amountUSD : p.amountARS, p.currency)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 bg-gray-800/60 border-t border-gray-700/30 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">Total Gastos</span>
                    <span className="text-xs font-bold text-red-400">{formatCurrency(totalExpenses, selectedOp.currency)}</span>
                  </div>
                </div>
              )}

              {/* Compact payment progress bar */}
              {salePrice > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, salePrice > 0 ? (paid / salePrice) * 100 : 0)}%`, backgroundColor: paid >= salePrice ? "#22c55e" : "#3b82f6" }} />
                  </div>
                  <span className="text-[10px] text-gray-500 tabular-nums">{salePrice > 0 ? Math.min(100, (paid / salePrice) * 100).toFixed(0) : 0}% {selectedOp.type === "COMPRA" ? "pagado" : "cobrado"}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  ACTIVE STEP — smart panel with step-specific content          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeStep && selectedOp.status === "EN_CURSO" && (() => {
          const checks = activeStep.checkItems || [];
          const checkedCount = checks.filter((c) => c.checked).length;
          const allDone = checks.length > 0 && checkedCount === checks.length;

          return (
            <Card>
              {/* Step header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: `${tc.color}20`, color: tc.color }}>
                    {activeStep.order}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{activeStep.title}</h3>
                    {activeStep.description && <p className="text-xs text-gray-400 mt-0.5">{activeStep.description}</p>}
                  </div>
                </div>
                {checks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${checks.length ? (checkedCount / checks.length) * 100 : 0}%`, backgroundColor: allDone ? "#22c55e" : tc.color }} />
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${allDone ? "text-green-400" : "text-gray-400"}`}>{checkedCount}/{checks.length}</span>
                  </div>
                )}
              </div>

              {/* Smart contextual panel */}
              {renderStepSmartPanel(activeStep, selectedOp)}

              {/* ══════ CHECKLIST — always rendered ══════ */}
              {checks.length > 0 && (
                <div className="space-y-1 mb-4">
                  {checks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleToggleCheck(selectedOp.id, activeStep.id, item.id)}
                      disabled={loadingChecks.has(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${item.checked ? "bg-green-500/5" : "bg-gray-800/50 hover:bg-gray-800"} ${loadingChecks.has(item.id) ? "opacity-70" : ""}`}
                    >
                      {loadingChecks.has(item.id) ? <Loader2 size={18} className="text-blue-400 flex-shrink-0 animate-spin" /> : item.checked ? <CheckSquare size={18} className="text-green-400 flex-shrink-0" /> : <Square size={18} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0" />}
                      <span className={`text-sm flex-1 ${item.checked ? "text-gray-500 line-through" : "text-gray-200"}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add custom check */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCheckLabel[activeStep.id] || ""}
                  onChange={(e) => setNewCheckLabel((prev) => ({ ...prev, [activeStep.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCheck(selectedOp.id, activeStep.id); }}
                  placeholder="+ Agregar tarea personalizada..."
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {newCheckLabel[activeStep.id]?.trim() && (
                  <button onClick={() => handleAddCheck(selectedOp.id, activeStep.id)} className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700/50">
                <Button size="sm" onClick={() => {
                  if (!allDone && checks.length > 0) {
                    if (!window.confirm(`Hay ${checks.length - checkedCount} tarea${checks.length - checkedCount > 1 ? "s" : ""} sin completar. ¿Querés marcar el paso como completado igual?`)) return;
                  }
                  handleStepUpdate(selectedOp.id, activeStep.id, "COMPLETADO");
                }}>
                  <CheckCircle2 size={14} className="mr-1.5" /> {allDone ? "✓ Todo listo, completar paso" : "Marcar como completado"}
                </Button>
                {activeStep.optional && (
                  <Button size="sm" variant="ghost" onClick={() => handleStepUpdate(selectedOp.id, activeStep.id, "OMITIDO")}>
                    <SkipForward size={14} className="mr-1" /> Omitir este paso
                  </Button>
                )}
                {activeStepAction && (
                  <Button size="sm" variant="outline" onClick={() => handleStepAction(activeStepAction)} disabled={generatingDoc}>
                    {activeStepAction.type === "generate_doc" ? <FileText size={14} className="mr-1" /> : activeStepAction.type === "create_payment" ? <Receipt size={14} className="mr-1" /> : <ExternalLink size={14} className="mr-1" />}
                    {generatingDoc ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                    {activeStepAction.label}
                  </Button>
                )}
              </div>
            </Card>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  WHAT'S COMING — upcoming compact                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {upcomingSteps.length > 0 && selectedOp.status === "EN_CURSO" && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ArrowRight size={12} /> Lo que viene después
            </h3>
            <div className="space-y-1.5">
              {upcomingSteps.map((step) => {
                const catConfig = step.category ? STEP_CATEGORIES[step.category] : null;
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/30 border border-gray-700/30 cursor-pointer hover:border-gray-600/50 transition-colors"
                    onClick={() => toggleStep(step.id)}
                  >
                    <span className="text-sm font-medium text-gray-500 w-5 text-center">{step.order}</span>
                    <CircleDot size={14} className="text-gray-600" />
                    <span className="text-sm text-gray-400 flex-1">{step.title}</span>
                    {step.optional && <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-500 rounded">Opcional</span>}
                    {catConfig && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${catConfig.color}10`, color: `${catConfig.color}90` }}>
                        {catConfig.label}
                      </span>
                    )}
                    {expandedSteps.has(step.id) ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expanded upcoming step overlay (when clicked) */}
        {upcomingSteps.filter((s) => expandedSteps.has(s.id)).map((step) => {
          const checks = step.checkItems || [];
          const checkedCount = checks.filter((c) => c.checked).length;
          const stepAction = (() => {
            const opData = {
              id: selectedOp.id, type: selectedOp.type,
              vehicleName: selectedOp.vehicle?.name,
              clientName: selectedOp.client ? `${selectedOp.client.firstName} ${selectedOp.client.lastName}` : undefined,
              totalAmount: selectedOp.totalAmount, paidAmount: selectedOp.paidAmount || 0,
              depositAmount: selectedOp.depositAmount, remainingAmount: selectedOp.financial?.remaining,
              currency: selectedOp.currency,
            };
            return getStepAction(step.title, opData);
          })();
          return (
            <Card key={step.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">{step.order}.</span>
                  <h4 className="text-sm font-semibold text-gray-300">{step.title}</h4>
                  <span className="text-[10px] text-gray-500">— Próximamente</span>
                </div>
                <button onClick={() => toggleStep(step.id)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
              </div>
              {step.description && <p className="text-xs text-gray-500 mb-3">{step.description}</p>}

              {/* Smart contextual panel */}
              {renderStepSmartPanel(step, selectedOp)}

              {checks.length > 0 && (
                <div className="space-y-1">
                  {checks.map((item) => (
                    <div key={item.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${loadingChecks.has(item.id) ? "opacity-70" : ""}`}>
                      <button onClick={() => handleToggleCheck(selectedOp.id, step.id, item.id)} disabled={loadingChecks.has(item.id)} className="flex-shrink-0">
                        {loadingChecks.has(item.id) ? <Loader2 size={14} className="text-blue-400 animate-spin" /> : item.checked ? <CheckSquare size={14} className="text-green-400" /> : <Square size={14} className="text-gray-600" />}
                      </button>
                      <span className={`${item.checked ? "text-gray-500 line-through" : "text-gray-400"}`}>{item.label}</span>
                    </div>
                  ))}
                  {checks.length > 0 && <p className="text-[10px] text-gray-600 mt-1">{checkedCount}/{checks.length} completados</p>}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedOp.status === "EN_CURSO" && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => {
                      const unchecked = checks.filter((c) => !c.checked).length;
                      if (unchecked > 0) {
                        if (!window.confirm(`Hay ${unchecked} tarea${unchecked > 1 ? "s" : ""} sin completar. ¿Querés marcar el paso como completado igual?`)) return;
                      }
                      handleStepUpdate(selectedOp.id, step.id, "COMPLETADO");
                    }}>
                      <CheckCircle2 size={14} className="mr-1" /> Completar
                    </Button>
                    {step.optional && (
                      <Button size="sm" variant="ghost" onClick={() => handleStepUpdate(selectedOp.id, step.id, "OMITIDO")}>
                        <SkipForward size={14} className="mr-1" /> Omitir
                      </Button>
                    )}
                    {stepAction && (
                      <Button size="sm" variant="outline" onClick={() => handleStepAction(stepAction)} disabled={generatingDoc}>
                        {stepAction.type === "generate_doc" ? <FileText size={14} className="mr-1" /> : stepAction.type === "create_payment" ? <Receipt size={14} className="mr-1" /> : <ExternalLink size={14} className="mr-1" />}
                        {stepAction.label}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  DONE — completed steps as compact success list                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {doneSteps.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-green-500" /> Completado ({doneSteps.length})
            </h3>
            <div className="space-y-1">
              {doneSteps.map((step) => {
                const isExpanded = expandedSteps.has(step.id);
                const checks = step.checkItems || [];
                return (
                  <div key={step.id}>
                    <div
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-colors group"
                      onClick={() => toggleStep(step.id)}
                    >
                      {step.status === "COMPLETADO" ? <CheckCircle2 size={14} className="text-green-500" /> : <SkipForward size={14} className="text-gray-500" />}
                      <span className="text-sm text-gray-500 flex-1">{step.order}. {step.title}</span>
                      {step.completedAt && <span className="text-[10px] text-gray-600">{formatDate(step.completedAt)}</span>}
                      {selectedOp.status === "EN_CURSO" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStepUpdate(selectedOp.id, step.id, "PENDIENTE"); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-yellow-400 transition-all"
                          title="Reabrir paso"
                        >
                          <Undo2 size={12} />
                        </button>
                      )}
                      {isExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                    </div>
                    {isExpanded && (
                      <div className="ml-8 mb-2">
                        {/* Smart contextual panel for completed step */}
                        {renderStepSmartPanel(step, selectedOp)}
                        {checks.length > 0 && (
                          <div className="space-y-0.5">
                            {checks.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 px-2 py-1 text-xs">
                                {item.checked ? <CheckSquare size={12} className="text-green-500/50" /> : <Square size={12} className="text-gray-600" />}
                                <span className="text-gray-600">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  DATOS DE LA OPERACIÓN (collapsible info panel)                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div>
          <button
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
            onClick={() => setExpandedSteps((prev) => {
              const next = new Set(prev);
              if (next.has("__info")) next.delete("__info"); else next.add("__info");
              return next;
            })}
          >
            <span className="flex items-center gap-2"><Info size={12} /> Datos de la operación</span>
            {expandedSteps.has("__info") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {expandedSteps.has("__info") && (
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><Car size={16} className="text-gray-400" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Vehículo</p>
                    {selectedOp.vehicle ? (
                      <>
                        <p className="text-sm font-medium truncate">{selectedOp.vehicle.name}</p>
                        {selectedOp.vehicle.domain && <p className="text-xs text-gray-400">{selectedOp.vehicle.domain}</p>}
                      </>
                    ) : selectedOp.status === "EN_CURSO" ? (
                      <div className="flex items-center gap-2">
                        <LinkIcon size={12} className="text-yellow-400" />
                        <Select label="" value="" onChange={(e) => handleUpdateOp(selectedOp.id, { vehicleId: e.target.value })} options={[{ value: "", label: "Vincular vehículo..." }, ...vehicles.map((v) => ({ value: v.id, label: v.name }))]} />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No vinculado</p>
                    )}
                  </div>
                </div>

                {/* Person */}
                {(selectedOp.type === "VENTA" || selectedOp.type === "CONSIGNACION" || selectedOp.type === "COMPRA_VENTA") && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><UserCircle size={16} className="text-gray-400" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{selectedOp.type === "CONSIGNACION" ? "Consignante" : "Comprador"}</p>
                      {selectedOp.client ? (
                        <>
                          <p className="text-sm font-medium truncate">{selectedOp.client.firstName} {selectedOp.client.lastName}</p>
                          {selectedOp.client.phone && <p className="text-xs text-gray-400">{selectedOp.client.phone}</p>}
                        </>
                      ) : selectedOp.status === "EN_CURSO" ? (
                        <Select label="" value="" onChange={(e) => handleUpdateOp(selectedOp.id, { clientId: e.target.value })} options={[{ value: "", label: "Vincular..." }, ...clients.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]} />
                      ) : (
                        <p className="text-sm text-gray-500">No vinculado</p>
                      )}
                    </div>
                  </div>
                )}
                {(selectedOp.type === "COMPRA" || selectedOp.type === "COMPRA_VENTA") && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><Truck size={16} className="text-gray-400" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide">Proveedor</p>
                      {selectedOp.supplier ? (
                        <>
                          <p className="text-sm font-medium truncate">{selectedOp.supplier.firstName} {selectedOp.supplier.lastName}</p>
                          {selectedOp.supplier.phone && <p className="text-xs text-gray-400">{selectedOp.supplier.phone}</p>}
                        </>
                      ) : selectedOp.status === "EN_CURSO" ? (
                        <Select label="" value="" onChange={(e) => handleUpdateOp(selectedOp.id, { supplierId: e.target.value })} options={[{ value: "", label: "Vincular..." }, ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))]} />
                      ) : (
                        <p className="text-sm text-gray-500">No vinculado</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><DollarSign size={16} className="text-gray-400" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Monto</p>
                    {selectedOp.totalAmount ? (
                      <>
                        <p className="text-sm font-bold">{formatCurrency(selectedOp.totalAmount, selectedOp.currency)}</p>
                        {selectedOp.financial && selectedOp.financial.status !== "SIN_MONTO" && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${selectedOp.financial.percentage}%`, backgroundColor: selectedOp.financial.color }} />
                            </div>
                            <span className="text-[10px] text-gray-500">{selectedOp.financial.label}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Sin monto</p>
                    )}
                  </div>
                </div>

                {/* Options */}
                {selectedOp.status === "EN_CURSO" && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><Settings2 size={16} className="text-gray-400" /></div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide">Opciones</p>
                      <div className="flex flex-wrap gap-1.5">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input type="checkbox" checked={!!selectedOp.hasDeposit} onChange={(e) => handleUpdateOp(selectedOp.id, { hasDeposit: e.target.checked })} className="rounded bg-gray-700 border-gray-600 w-3 h-3" />
                          <span className="text-gray-400">Seña</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input type="checkbox" checked={!!selectedOp.includesTransfer} onChange={(e) => handleUpdateOp(selectedOp.id, { includesTransfer: e.target.checked })} className="rounded bg-gray-700 border-gray-600 w-3 h-3" />
                          <span className="text-gray-400">Transferencia</span>
                        </label>
                        {(selectedOp.type === "VENTA" || selectedOp.type === "COMPRA_VENTA") && (
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="checkbox" checked={!!selectedOp.isFinanced} onChange={(e) => handleUpdateOp(selectedOp.id, { isFinanced: e.target.checked })} className="rounded bg-gray-700 border-gray-600 w-3 h-3" />
                            <span className="text-gray-400">Financiado</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {selectedOp.payments && selectedOp.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                    <Receipt size={14} /> Pagos Registrados
                  </h4>
                  <div className="space-y-1.5">
                    {selectedOp.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-700/30 last:border-0">
                        <div>
                          <p className="text-gray-300">{p.concept}</p>
                          <p className="text-gray-600 text-[10px]">{formatDate(p.date)}</p>
                        </div>
                        <span className={`font-medium ${p.type === "INGRESO" ? "text-green-400" : "text-red-400"}`}>
                          {p.type === "INGRESO" ? "+" : "-"}{formatCurrency(p.currency === "USD" ? p.amountUSD : p.amountARS, p.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOp.notes && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <h4 className="text-xs font-semibold text-gray-400 mb-1">Notas</h4>
                  <p className="text-sm text-gray-400">{selectedOp.notes}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-600 mt-4">Creada {formatDate(selectedOp.createdAt)}</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${feedback.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Operaciones</h1>
          <p className="text-gray-400 text-sm mt-1">Gestioná compras, ventas y consignaciones paso a paso</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Operación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <p className="text-xs text-gray-400">En Curso</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{enCurso}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Completadas</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{completadas}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Este Mes</p>
          <p className="text-2xl font-bold text-white mt-1">{thisMonth}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Filter size={14} />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
        >
          <option value="">Todos los tipos</option>
          <option value="COMPRA">Compra</option>
          <option value="VENTA">Venta</option>
          <option value="CONSIGNACION">Consignación</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
        >
          <option value="">Todos los estados</option>
          <option value="EN_CURSO">En Curso</option>
          <option value="COMPLETADA">Completada</option>
          <option value="BLOQUEADA">Bloqueada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {/* Operations list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : operations.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Creá tu primera operación</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Las operaciones tracean todo el proceso de compra, venta o consignación de un vehículo: desde el primer contacto hasta la entrega y el pago final.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-center">
                <span className="text-xl block mb-1">📥</span>
                <p className="text-xs font-medium text-blue-300">Compra</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Adquirís un vehículo</p>
              </div>
              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-center">
                <span className="text-xl block mb-1">📤</span>
                <p className="text-xs font-medium text-green-300">Venta</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Vendés a un cliente</p>
              </div>
              <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-center">
                <span className="text-xl block mb-1">🤝</span>
                <p className="text-xs font-medium text-yellow-300">Consignación</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Te dejan un auto para vender</p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear mi primera operación
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {operations.map((op) => {
            const tc = TYPE_CONFIG[op.type] || TYPE_CONFIG.VENTA;
            const sc = STATUS_CONFIG[op.status] || STATUS_CONFIG.EN_CURSO;
            const pct = progress(op);
            return (
              <div key={op.id} className="relative">
                <div
                  className={`p-4 rounded-xl border cursor-pointer hover:border-gray-600 transition-colors ${tc.bgColor} ${tc.borderColor}`}
                  onClick={() => setSelectedOp(op)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{tc.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{tc.label}</span>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {op.vehicle?.name || "Sin vehículo"}
                          {op.client && ` · ${op.client.firstName} ${op.client.lastName}`}
                          {op.supplier && ` · ${op.supplier.firstName} ${op.supplier.lastName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {op.totalAmount ? (
                        <span className="text-sm font-medium hidden sm:block">{formatCurrency(op.totalAmount, op.currency)}</span>
                      ) : null}
                      <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: tc.color }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === op.id ? null : op.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenu === op.id && (
                          <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                            {op.status === "EN_CURSO" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateOp(op.id, { status: "CANCELADA" }); setActionMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-gray-700"
                              >
                                <Ban size={14} /> Cancelar
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(op.id); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-500" />
                    </div>
                  </div>
                  {/* Mobile progress */}
                  <div className="sm:hidden mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: tc.color }} />
                    </div>
                    <span className="text-xs text-gray-400">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create operation modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Operación" size="lg">
        <div className="space-y-4">
          {/* Type selector as cards */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Operación</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, type: key }))}
                  className={`p-3 rounded-lg border text-center transition-colors ${form.type === key ? `${cfg.bgColor} ${cfg.borderColor}` : "bg-gray-800/50 border-gray-700 hover:border-gray-600"}`}
                >
                  <span className="text-2xl block">{cfg.icon}</span>
                  <span className="text-xs font-medium mt-1 block">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Vehículo (opcional)"
            value={form.vehicleId}
            onChange={(e) => {
              const vid = e.target.value;
              const v = vehicles.find((x) => x.id === vid);
              setForm((f) => {
                const updates: typeof f = { ...f, vehicleId: vid };
                // Auto-fill amount from vehicle price if not already set
                if (v && !f.totalAmount) {
                  const price = f.currency === "USD" && v.priceUSD ? v.priceUSD : v.priceARS;
                  if (price) updates.totalAmount = String(price);
                }
                return updates;
              });
            }}
            options={[{ value: "", label: "Seleccionar vehículo..." }, ...vehicles.map((v) => ({ value: v.id, label: v.name }))]}
          />

          {(form.type === "VENTA" || form.type === "CONSIGNACION") && (
            <Select
              label={form.type === "VENTA" ? "Cliente/Comprador (opcional)" : "Consignante (opcional)"}
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              options={[{ value: "", label: "Seleccionar cliente..." }, ...clients.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]}
            />
          )}

          {form.type === "COMPRA" && (
            <Select
              label="Proveedor (opcional)"
              value={form.supplierId}
              onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
              options={[{ value: "", label: "Seleccionar proveedor..." }, ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))]}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monto (opcional)"
              type="number"
              value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
              placeholder="0"
            />
            <Select
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              options={[{ value: "ARS", label: "ARS" }, { value: "USD", label: "USD" }]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones sobre la operación..."
            />
          </div>

          {/* Context flags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Opciones de la operación</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm cursor-pointer hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={form.hasDeposit}
                  onChange={(e) => setForm((f) => ({ ...f, hasDeposit: e.target.checked }))}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span className="text-gray-300">Incluye seña</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm cursor-pointer hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={form.includesTransfer}
                  onChange={(e) => setForm((f) => ({ ...f, includesTransfer: e.target.checked }))}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span className="text-gray-300">Transferencia</span>
              </label>
              {(form.type === "VENTA") && (
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isFinanced}
                    onChange={(e) => setForm((f) => ({ ...f, isFinanced: e.target.checked }))}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <span className="text-gray-300">Financiado</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.type || creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear Operación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal open={showDocPreview} onClose={() => setShowDocPreview(false)} title="Documento Generado" size="lg">
        <div className="space-y-4">
          <div className="bg-white text-black p-6 rounded-lg max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed font-serif">
            {docContent}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDocPreview(false)}>Cerrar</Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(docContent); }}>
              Copiar
            </Button>
            <Button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:serif;white-space:pre-wrap;padding:2rem;max-width:800px;margin:auto}</style></head><body></body></html>"); w.document.close(); w.document.body.textContent = docContent; w.print(); } }}>
              Imprimir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
