"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  DollarSign,
  FileText,
  Plus,
  Search,
  Trash2,
  User,
  Wrench,
  X,
  Star,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
interface VehicleData {
  name: string;
  brand: string;
  model: string;
  year: string;
  version: string;
  domain: string;
  engineNumber: string;
  chassisNumber: string;
  kilometers: string;
  fuel: string;
  color: string;
  category: string;
}

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  category: "ESTADO" | "DOCUMENTO";
  tasks: TaskItem[];
  expanded: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "EN_CURSO" | "FINALIZADA";
  dueDate: string;
  dueTime: string;
  supplierId: string;
  supplierName: string;
  rating: number | null;
  expenses: ExpenseItem[];
}

interface ExpenseItem {
  id: string;
  concept: string;
  amount: string;
  currency: string;
  supplierId: string;
  supplierName: string;
  cashAccountId: string;
}

interface PaymentItem {
  id: string;
  concept: string;
  amount: string;
  currency: string;
  cashAccountId: string;
}

interface PersonData {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  province: string;
  city: string;
  street: string;
  streetNumber: string;
}

interface SupplierOption {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
}

interface CashAccountOption {
  id: string;
  name: string;
  currency: string;
}

// ─── Default checks ──────────────────────────────────────────────
const defaultConditionChecks: Omit<CheckItem, "id" | "tasks" | "expanded">[] = [
  { label: "Pintura", checked: false, category: "ESTADO" },
  { label: "Chapa / Carrocería", checked: false, category: "ESTADO" },
  { label: "Motor", checked: false, category: "ESTADO" },
  { label: "Caja de cambios", checked: false, category: "ESTADO" },
  { label: "Frenos", checked: false, category: "ESTADO" },
  { label: "Suspensión", checked: false, category: "ESTADO" },
  { label: "Neumáticos", checked: false, category: "ESTADO" },
  { label: "Interior / Tapizado", checked: false, category: "ESTADO" },
  { label: "Aire acondicionado", checked: false, category: "ESTADO" },
  { label: "Sistema eléctrico", checked: false, category: "ESTADO" },
  { label: "Luces", checked: false, category: "ESTADO" },
  { label: "Vidrios / Espejos", checked: false, category: "ESTADO" },
  { label: "Escape", checked: false, category: "ESTADO" },
  { label: "Dirección", checked: false, category: "ESTADO" },
  { label: "Embrague", checked: false, category: "ESTADO" },
];

const defaultDocumentChecks: Omit<CheckItem, "id" | "tasks" | "expanded">[] = [
  { label: "Título del automotor", checked: false, category: "DOCUMENTO" },
  { label: "Cédula verde", checked: false, category: "DOCUMENTO" },
  { label: "Cédula azul", checked: false, category: "DOCUMENTO" },
  { label: "Verificación policial", checked: false, category: "DOCUMENTO" },
  { label: "VTV (Verificación Técnica)", checked: false, category: "DOCUMENTO" },
  { label: "Libre de deuda patente", checked: false, category: "DOCUMENTO" },
  { label: "Libre de deuda infracciones", checked: false, category: "DOCUMENTO" },
  { label: "Seguro vigente", checked: false, category: "DOCUMENTO" },
  { label: "08 firmado", checked: false, category: "DOCUMENTO" },
  { label: "CETA (Certificado de Transferencia)", checked: false, category: "DOCUMENTO" },
  { label: "DNI del titular", checked: false, category: "DOCUMENTO" },
];

const SECTIONS = [
  { key: "preparacion", label: "Preparación", icon: Wrench },
  { key: "tareas", label: "Tareas", icon: ClipboardList },
  { key: "analisis", label: "Análisis", icon: DollarSign },
  { key: "documentacion", label: "Documentación", icon: FileText },
  { key: "comprador", label: "Comprador", icon: User },
  { key: "boleto", label: "Boleto", icon: FileText },
];

let nextId = 1;
function genId() {
  return `local_${nextId++}`;
}

// ─── Main Component ──────────────────────────────────────────────
export default function NewVehicleIntakePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);

  // Section 1: Preparación
  const [vehicle, setVehicle] = useState<VehicleData>({
    name: "", brand: "", model: "", year: "", version: "", domain: "",
    engineNumber: "", chassisNumber: "", kilometers: "", fuel: "", color: "", category: "AUTOS_Y_CAMIONETAS",
  });
  const [cedulaMode, setCedulaMode] = useState<"manual" | "cedula">("manual");

  // Condition checks
  const [conditionChecks, setConditionChecks] = useState<CheckItem[]>(
    defaultConditionChecks.map((c) => ({ ...c, id: genId(), tasks: [], expanded: false }))
  );

  // Document checks
  const [documentChecks, setDocumentChecks] = useState<CheckItem[]>(
    defaultDocumentChecks.map((c) => ({ ...c, id: genId(), tasks: [], expanded: false }))
  );

  // Seller (person we buy from)
  const [seller, setSeller] = useState<PersonData>({
    id: "", firstName: "", lastName: "", dni: "", email: "", phone: "", birthDate: "", province: "", city: "", street: "", streetNumber: "",
  });
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerResults, setSellerResults] = useState<ClientOption[]>([]);
  const [showSellerDropdown, setShowSellerDropdown] = useState(false);
  const [showNewSellerModal, setShowNewSellerModal] = useState(false);
  const [sellerDuplicateWarning, setSellerDuplicateWarning] = useState<ClientOption | null>(null);

  // Purchase price & travel expenses
  const [purchasePrice, setPurchasePrice] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  // Buyer
  const [buyer, setBuyer] = useState<PersonData>({
    id: "", firstName: "", lastName: "", dni: "", email: "", phone: "", birthDate: "", province: "", city: "", street: "", streetNumber: "",
  });
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerResults, setBuyerResults] = useState<ClientOption[]>([]);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [showNewBuyerModal, setShowNewBuyerModal] = useState(false);

  // Suppliers & Accounts
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccountOption[]>([]);

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalCheckId, setTaskModalCheckId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskItem>({
    id: "", title: "", description: "", status: "TODO", dueDate: "", dueTime: "",
    supplierId: "", supplierName: "", rating: null, expenses: [],
  });

  // ─── Fetch reference data ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers).catch(() => {});
    fetch("/api/cash").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCashAccounts(data);
      else if (data.accounts) setCashAccounts(data.accounts);
    }).catch(() => {});
  }, []);

  // ─── Seller search ─────────────────────────────────────────────
  const searchClients = useCallback(async (query: string, type: "seller" | "buyer") => {
    if (query.length < 2) {
      if (type === "seller") setSellerResults([]);
      else setBuyerResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.clients || [];
      if (type === "seller") setSellerResults(results);
      else setBuyerResults(results);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchClients(sellerSearch, "seller"), 300);
    return () => clearTimeout(timer);
  }, [sellerSearch, searchClients]);

  useEffect(() => {
    const timer = setTimeout(() => searchClients(buyerSearch, "buyer"), 300);
    return () => clearTimeout(timer);
  }, [buyerSearch, searchClients]);

  // ─── OCR from cedula ───────────────────────────────────────────
  const handleCedulaScan = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "cedula_vehiculo");
    try {
      const res = await fetch("/api/ai/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (data.result) {
        setVehicle((prev) => ({
          ...prev,
          domain: data.result.domain || prev.domain,
          brand: data.result.brand || prev.brand,
          model: data.result.model || prev.model,
          year: data.result.year || prev.year,
          engineNumber: data.result.engineNumber || prev.engineNumber,
          chassisNumber: data.result.chassisNumber || prev.chassisNumber,
          name: data.result.brand && data.result.model ? `${data.result.brand} ${data.result.model} ${data.result.year || ""}`.trim() : prev.name,
        }));
      }
    } catch {
      alert("Error al procesar la cédula");
    }
  };

  const handleDniScan = async (file: File, target: "seller" | "buyer") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "dni");
    try {
      const res = await fetch("/api/ai/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (data.result) {
        const personData: Partial<PersonData> = {
          firstName: data.result.firstName || "",
          lastName: data.result.lastName || "",
          dni: data.result.dni || "",
          birthDate: data.result.birthDate || "",
        };
        if (target === "seller") setSeller((prev) => ({ ...prev, ...personData }));
        else setBuyer((prev) => ({ ...prev, ...personData }));
      }
    } catch {
      alert("Error al procesar el DNI");
    }
  };

  // ─── Check management ──────────────────────────────────────────
  const toggleCheck = (checkId: string, isDocument: boolean) => {
    const setter = isDocument ? setDocumentChecks : setConditionChecks;
    setter((prev) =>
      prev.map((c) => {
        if (c.id !== checkId) return c;
        // Only allow manual check if no pending tasks
        const pendingTasks = c.tasks.filter((t) => t.status !== "FINALIZADA");
        if (pendingTasks.length > 0 && !c.checked) return c;
        return { ...c, checked: !c.checked };
      })
    );
  };

  const toggleCheckExpanded = (checkId: string, isDocument: boolean) => {
    const setter = isDocument ? setDocumentChecks : setConditionChecks;
    setter((prev) => prev.map((c) => (c.id === checkId ? { ...c, expanded: !c.expanded } : c)));
  };

  const openAddTask = (checkId: string) => {
    setTaskModalCheckId(checkId);
    setTaskForm({
      id: "", title: "", description: "", status: "TODO", dueDate: "", dueTime: "",
      supplierId: "", supplierName: "", rating: null, expenses: [],
    });
    setShowTaskModal(true);
  };

  const saveTask = () => {
    if (!taskForm.title) return;
    const newTask: TaskItem = { ...taskForm, id: taskForm.id || genId() };

    // Find which check list it belongs to
    const updateChecks = (checks: CheckItem[]) =>
      checks.map((c) => {
        if (c.id !== taskModalCheckId) return c;
        const existing = c.tasks.findIndex((t) => t.id === newTask.id);
        if (existing >= 0) {
          const updated = [...c.tasks];
          updated[existing] = newTask;
          // Auto-check if all tasks are done
          const allDone = updated.every((t) => t.status === "FINALIZADA");
          return { ...c, tasks: updated, checked: allDone };
        }
        return { ...c, tasks: [...c.tasks, newTask] };
      });

    setConditionChecks((prev) => updateChecks(prev));
    setDocumentChecks((prev) => updateChecks(prev));
    setShowTaskModal(false);
  };

  const removeTask = (checkId: string, taskId: string, isDocument: boolean) => {
    const setter = isDocument ? setDocumentChecks : setConditionChecks;
    setter((prev) =>
      prev.map((c) => {
        if (c.id !== checkId) return c;
        return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
      })
    );
  };

  const updateTaskStatus = (checkId: string, taskId: string, status: TaskItem["status"], isDocument: boolean) => {
    const setter = isDocument ? setDocumentChecks : setConditionChecks;
    setter((prev) =>
      prev.map((c) => {
        if (c.id !== checkId) return c;
        const tasks = c.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
        const allDone = tasks.length > 0 && tasks.every((t) => t.status === "FINALIZADA");
        return { ...c, tasks, checked: allDone };
      })
    );
  };

  // ─── Payments ──────────────────────────────────────────────────
  const addPayment = () => {
    setPayments((prev) => [...prev, { id: genId(), concept: "VIATICO", amount: "", currency: "ARS", cashAccountId: "" }]);
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // ─── Select seller from search ────────────────────────────────
  const selectSeller = (client: ClientOption) => {
    setSeller({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      dni: client.dni || "",
      email: client.email || "",
      phone: client.phone || "",
      birthDate: "",
      province: "",
      city: "",
      street: "",
      streetNumber: "",
    });
    setSellerSearch(`${client.firstName} ${client.lastName}`);
    setShowSellerDropdown(false);
  };

  const selectBuyer = (client: ClientOption) => {
    setBuyer({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      dni: client.dni || "",
      email: client.email || "",
      phone: client.phone || "",
      birthDate: "",
      province: "",
      city: "",
      street: "",
      streetNumber: "",
    });
    setBuyerSearch(`${client.firstName} ${client.lastName}`);
    setShowBuyerDropdown(false);
  };

  // ─── Save new seller ──────────────────────────────────────────
  const saveNewSeller = async () => {
    // Check for duplicate DNI
    if (seller.dni) {
      try {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(seller.dni)}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.clients || [];
        const duplicate = results.find((c: ClientOption) => c.dni === seller.dni);
        if (duplicate) {
          setSellerDuplicateWarning(duplicate);
          return;
        }
      } catch {
        // continue
      }
    }
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: seller.firstName,
          lastName: seller.lastName,
          dni: seller.dni,
          email: seller.email,
          phone: seller.phone,
          province: seller.province,
          city: seller.city,
          street: seller.street,
          streetNumber: seller.streetNumber,
          clientType: "CLIENTE",
        }),
      });
      const newClient = await res.json();
      setSeller((prev) => ({ ...prev, id: newClient.id }));
      setSellerSearch(`${seller.firstName} ${seller.lastName}`);
      setShowNewSellerModal(false);
    } catch {
      alert("Error al crear el cliente");
    }
  };

  // ─── Compute totals for analysis ──────────────────────────────
  const allTasks = [...conditionChecks, ...documentChecks].flatMap((c) => c.tasks);
  const totalExpenses = allTasks.reduce(
    (sum, t) => sum + t.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    0
  );
  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPurchase = parseFloat(purchasePrice) || 0;
  const totalCost = totalPurchase + totalPayments + totalExpenses;

  // ─── Check if we can generate boleto ──────────────────────────
  const canGenerateBoleto =
    vehicle.name && vehicle.domain && seller.firstName && seller.lastName && seller.dni &&
    buyer.firstName && buyer.lastName && buyer.dni && purchasePrice;

  // ─── Save intake ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        vehicle,
        seller,
        buyer,
        purchasePrice: parseFloat(purchasePrice) || 0,
        payments: payments.map((p) => ({ ...p, amount: parseFloat(p.amount) || 0 })),
        conditionChecks: conditionChecks.map((c) => ({
          label: c.label,
          checked: c.checked,
          category: c.category,
          tasks: c.tasks.map((t) => ({
            title: t.title,
            description: t.description,
            status: t.status,
            dueDate: t.dueDate || null,
            dueTime: t.dueTime || null,
            supplierId: t.supplierId || null,
            rating: t.rating,
            expenses: t.expenses.map((e) => ({
              concept: e.concept,
              amount: parseFloat(e.amount) || 0,
              currency: e.currency,
              supplierId: e.supplierId || null,
              cashAccountId: e.cashAccountId || null,
            })),
          })),
        })),
        documentChecks: documentChecks.map((c) => ({
          label: c.label,
          checked: c.checked,
          category: c.category,
          tasks: c.tasks.map((t) => ({
            title: t.title,
            description: t.description,
            status: t.status,
            dueDate: t.dueDate || null,
            dueTime: t.dueTime || null,
            supplierId: t.supplierId || null,
            rating: t.rating,
            expenses: t.expenses.map((e) => ({
              concept: e.concept,
              amount: parseFloat(e.amount) || 0,
              currency: e.currency,
              supplierId: e.supplierId || null,
              cashAccountId: e.cashAccountId || null,
            })),
          })),
        })),
      };

      const res = await fetch("/api/vehicles/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id) {
        router.push("/dashboard/vehicles");
      }
    } catch {
      alert("Error al guardar el alta");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render checks list ────────────────────────────────────────
  const renderChecks = (checks: CheckItem[], isDocument: boolean) => (
    <div className="space-y-2">
      {checks.map((check) => {
        const pendingTasks = check.tasks.filter((t) => t.status !== "FINALIZADA").length;
        const completedTasks = check.tasks.filter((t) => t.status === "FINALIZADA").length;
        return (
          <div key={check.id} className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/30">
              <button
                type="button"
                onClick={() => toggleCheck(check.id, isDocument)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  check.checked
                    ? "bg-green-500 border-green-500"
                    : pendingTasks > 0
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                {check.checked && <Check size={12} className="text-white" />}
              </button>
              <span className={`text-sm flex-1 ${check.checked ? "text-green-400 line-through" : "text-gray-300"}`}>
                {check.label}
              </span>
              {check.tasks.length > 0 && (
                <span className="text-xs text-gray-500">
                  {completedTasks}/{check.tasks.length} tareas
                </span>
              )}
              <button
                type="button"
                onClick={() => openAddTask(check.id)}
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Tarea
              </button>
              {check.tasks.length > 0 && (
                <button type="button" onClick={() => toggleCheckExpanded(check.id, isDocument)}>
                  {check.expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </button>
              )}
            </div>
            {check.expanded && check.tasks.length > 0 && (
              <div className="px-4 py-2 space-y-2 bg-gray-900/50">
                {check.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(check.id, task.id, e.target.value as TaskItem["status"], isDocument)}
                      className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                    >
                      <option value="TODO">Pendiente</option>
                      <option value="EN_CURSO">En curso</option>
                      <option value="FINALIZADA">Finalizada</option>
                    </select>
                    <span className={`text-sm flex-1 ${task.status === "FINALIZADA" ? "text-green-400 line-through" : "text-gray-300"}`}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">{task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ""}</span>
                    )}
                    {task.status === "FINALIZADA" && task.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= task.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => removeTask(check.id, task.id, isDocument)} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Person search component ───────────────────────────────────
  const renderPersonSearch = (
    label: string,
    searchValue: string,
    onSearchChange: (v: string) => void,
    results: ClientOption[],
    showDropdown: boolean,
    setShowDropdown: (v: boolean) => void,
    onSelect: (c: ClientOption) => void,
    person: PersonData,
    onOpenNew: () => void,
    onDniScan: (file: File) => void,
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-400 uppercase">{label}</h4>
        <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
          <Camera size={14} />
          Escanear DNI
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onDniScan(file);
          }} />
        </label>
      </div>
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar por nombre, DNI..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
              >
                <span>{c.firstName} {c.lastName}</span>
                <span className="text-xs text-gray-500">{c.dni || ""}</span>
              </button>
            ))}
          </div>
        )}
        {showDropdown && searchValue.length >= 2 && results.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
            <p className="text-sm text-gray-400 mb-2">No se encontraron resultados</p>
            <Button type="button" size="sm" onClick={onOpenNew}>
              <Plus size={14} className="mr-1" /> Crear nuevo
            </Button>
          </div>
        )}
      </div>
      {person.id && (
        <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{person.firstName} {person.lastName}</span>
            <button type="button" onClick={() => {
              if (label.includes("vendedor")) {
                setSeller({ id: "", firstName: "", lastName: "", dni: "", email: "", phone: "", birthDate: "", province: "", city: "", street: "", streetNumber: "" });
                setSellerSearch("");
              } else {
                setBuyer({ id: "", firstName: "", lastName: "", dni: "", email: "", phone: "", birthDate: "", province: "", city: "", street: "", streetNumber: "" });
                setBuyerSearch("");
              }
            }} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            {person.dni && <span>DNI: {person.dni}</span>}
            {person.phone && <span>Tel: {person.phone}</span>}
            {person.email && <span>Email: {person.email}</span>}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Section content renderers ─────────────────────────────────
  const renderPreparacion = () => (
    <div className="space-y-6">
      {/* Vehicle Data */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Datos del Vehículo</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={cedulaMode === "cedula" ? "primary" : "outline"}
              size="sm"
              onClick={() => setCedulaMode("cedula")}
            >
              <Camera size={14} className="mr-1" /> Desde Cédula
            </Button>
            <Button
              type="button"
              variant={cedulaMode === "manual" ? "primary" : "outline"}
              size="sm"
              onClick={() => setCedulaMode("manual")}
            >
              Manual
            </Button>
          </div>
        </div>
        {cedulaMode === "cedula" && (
          <div className="mb-4">
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-blue-500/50 transition-colors">
              <Camera size={32} className="text-gray-500" />
              <span className="text-sm text-gray-400">Tomar foto o subir imagen de la cédula</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCedulaScan(file);
                }}
              />
            </label>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Nombre" value={vehicle.name} onChange={(e) => setVehicle({ ...vehicle, name: e.target.value })} className="sm:col-span-2 lg:col-span-3" />
          <Input label="Marca" value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} />
          <Input label="Modelo" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
          <Input label="Año" type="number" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />
          <Input label="Versión" value={vehicle.version} onChange={(e) => setVehicle({ ...vehicle, version: e.target.value })} />
          <Input label="Dominio" value={vehicle.domain} onChange={(e) => setVehicle({ ...vehicle, domain: e.target.value })} />
          <Input label="Kilómetros" type="number" value={vehicle.kilometers} onChange={(e) => setVehicle({ ...vehicle, kilometers: e.target.value })} />
          <Input label="Nro. Motor" value={vehicle.engineNumber} onChange={(e) => setVehicle({ ...vehicle, engineNumber: e.target.value })} />
          <Input label="Nro. Chasis" value={vehicle.chassisNumber} onChange={(e) => setVehicle({ ...vehicle, chassisNumber: e.target.value })} />
          <Select label="Combustible" value={vehicle.fuel} onChange={(e) => setVehicle({ ...vehicle, fuel: e.target.value })} options={[
            { value: "", label: "Seleccionar" },
            { value: "NAFTA", label: "Nafta" },
            { value: "DIESEL", label: "Diesel" },
            { value: "GNC", label: "GNC" },
            { value: "HIBRIDO", label: "Híbrido" },
            { value: "ELECTRICO", label: "Eléctrico" },
          ]} />
          <Input label="Color" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} />
          <Select label="Categoría" value={vehicle.category} onChange={(e) => setVehicle({ ...vehicle, category: e.target.value })} options={[
            { value: "AUTOS_Y_CAMIONETAS", label: "Autos y Camionetas" },
            { value: "MOTOS", label: "Motos" },
            { value: "CAMIONES", label: "Camiones" },
            { value: "OTROS", label: "Otros" },
          ]} />
        </div>
      </Card>

      {/* Condition Checks */}
      <Card>
        <h3 className="text-base font-semibold mb-4">Checklist del Vehículo</h3>
        <p className="text-xs text-gray-500 mb-3">Revisá cada punto. Podés tildar directamente o agregar tareas que al completarse marquen el check automáticamente.</p>
        {renderChecks(conditionChecks, false)}
      </Card>

      {/* Seller */}
      <Card>
        {renderPersonSearch(
          "Datos del vendedor (a quién le compramos)",
          sellerSearch,
          setSellerSearch,
          sellerResults,
          showSellerDropdown,
          setShowSellerDropdown,
          selectSeller,
          seller,
          () => setShowNewSellerModal(true),
          (file) => handleDniScan(file, "seller"),
        )}
      </Card>

      {/* Purchase price */}
      <Card>
        <h3 className="text-base font-semibold mb-4">Precio de compra</h3>
        <Input
          label="Monto"
          type="number"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="Ingresá el precio de compra"
        />
      </Card>

      {/* Travel expenses / payments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Gastos por viáticos</h3>
          <Button type="button" variant="outline" size="sm" onClick={addPayment}>
            <Plus size={14} className="mr-1" /> Agregar pago
          </Button>
        </div>
        {payments.length === 0 && (
          <p className="text-sm text-gray-500">No hay pagos cargados</p>
        )}
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border border-gray-800 rounded-lg p-3">
              <Select
                label="Concepto"
                value={payment.concept}
                onChange={(e) => setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, concept: e.target.value } : p)))}
                options={[
                  { value: "VIATICO", label: "Viático" },
                  { value: "FLETE", label: "Flete" },
                  { value: "OTRO", label: "Otro" },
                ]}
              />
              <Input
                label="Monto"
                type="number"
                value={payment.amount}
                onChange={(e) => setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, amount: e.target.value } : p)))}
              />
              <Select
                label="Caja"
                value={payment.cashAccountId}
                onChange={(e) => setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, cashAccountId: e.target.value } : p)))}
                options={[
                  { value: "", label: "Seleccionar caja" },
                  ...cashAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
                ]}
              />
              <div className="flex justify-end">
                <Button type="button" variant="danger" size="sm" onClick={() => removePayment(payment.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Document Checks */}
      <Card>
        <h3 className="text-base font-semibold mb-4">Checklist de Documentos</h3>
        <p className="text-xs text-gray-500 mb-3">Verificá cada documento. Si falta alguno, podés crear tareas para gestionarlo.</p>
        {renderChecks(documentChecks, true)}
      </Card>
    </div>
  );

  const renderTareas = () => {
    const allCheckTasks = [...conditionChecks, ...documentChecks].flatMap((c) =>
      c.tasks.map((t) => ({ ...t, checkLabel: c.label, checkId: c.id, isDocument: c.category === "DOCUMENTO" }))
    );
    const todo = allCheckTasks.filter((t) => t.status === "TODO");
    const enCurso = allCheckTasks.filter((t) => t.status === "EN_CURSO");
    const finalizadas = allCheckTasks.filter((t) => t.status === "FINALIZADA");

    const renderTaskCard = (task: typeof allCheckTasks[0]) => (
      <div key={task.id} className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{task.title}</span>
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.checkId, task.id, e.target.value as TaskItem["status"], task.isDocument)}
            className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="TODO">Pendiente</option>
            <option value="EN_CURSO">En curso</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>
        <p className="text-xs text-gray-500">{task.checkLabel}</p>
        {task.dueDate && (
          <p className="text-xs text-gray-500">{task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ""}</p>
        )}
        {task.expenses.length > 0 && (
          <p className="text-xs text-gray-400">
            Gastos: ${task.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toLocaleString()}
          </p>
        )}
      </div>
    );

    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Tareas del alta</h3>
        <p className="text-xs text-gray-500">Todas las tareas asociadas a los checks del vehículo y documentos.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TODO */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <h4 className="text-sm font-semibold text-gray-300">Pendientes</h4>
              <Badge variant="default">{todo.length}</Badge>
            </div>
            <div className="space-y-2">{todo.map(renderTaskCard)}</div>
          </Card>
          {/* EN_CURSO */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h4 className="text-sm font-semibold text-gray-300">En curso</h4>
              <Badge variant="info">{enCurso.length}</Badge>
            </div>
            <div className="space-y-2">{enCurso.map(renderTaskCard)}</div>
          </Card>
          {/* FINALIZADA */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h4 className="text-sm font-semibold text-gray-300">Finalizadas</h4>
              <Badge variant="success">{finalizadas.length}</Badge>
            </div>
            <div className="space-y-2">{finalizadas.map(renderTaskCard)}</div>
          </Card>
        </div>
      </div>
    );
  };

  const renderAnalisis = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Análisis de costos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-xs text-gray-400 mb-1">Precio de compra</p>
          <p className="text-xl font-bold text-white">${totalPurchase.toLocaleString()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-400 mb-1">Viáticos</p>
          <p className="text-xl font-bold text-yellow-400">${totalPayments.toLocaleString()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-400 mb-1">Gastos en tareas</p>
          <p className="text-xl font-bold text-orange-400">${totalExpenses.toLocaleString()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-400 mb-1">Costo total</p>
          <p className="text-xl font-bold text-red-400">${totalCost.toLocaleString()}</p>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Desglose de gastos</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Precio de compra</span>
            <span className="text-white">${totalPurchase.toLocaleString()}</span>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span className="text-gray-400">{p.concept === "VIATICO" ? "Viático" : p.concept === "FLETE" ? "Flete" : "Otro"}</span>
              <span className="text-white">${(parseFloat(p.amount) || 0).toLocaleString()}</span>
            </div>
          ))}
          {allTasks.filter((t) => t.expenses.length > 0).map((t) => (
            <div key={t.id} className="flex justify-between text-sm">
              <span className="text-gray-400">{t.title}</span>
              <span className="text-white">${t.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-semibold">
            <span className="text-gray-300">Total</span>
            <span className="text-white">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDocumentacion = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Estado de documentación</h3>
      <p className="text-xs text-gray-500">Vista de solo lectura del estado de cada documento.</p>
      <Card>
        <div className="space-y-2">
          {documentChecks.map((check) => (
            <div key={check.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/30">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                check.checked ? "bg-green-500 border-green-500" : "border-red-500 bg-red-500/10"
              }`}>
                {check.checked ? <Check size={12} className="text-white" /> : <X size={12} className="text-red-400" />}
              </div>
              <span className={`text-sm flex-1 ${check.checked ? "text-green-400" : "text-red-400"}`}>
                {check.label}
              </span>
              <Badge variant={check.checked ? "success" : "danger"}>
                {check.checked ? "OK" : "Pendiente"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderComprador = () => (
    <div className="space-y-4">
      <Card>
        {renderPersonSearch(
          "Datos del comprador",
          buyerSearch,
          setBuyerSearch,
          buyerResults,
          showBuyerDropdown,
          setShowBuyerDropdown,
          selectBuyer,
          buyer,
          () => setShowNewBuyerModal(true),
          (file) => handleDniScan(file, "buyer"),
        )}
      </Card>

      {/* New buyer modal */}
      <Modal open={showNewBuyerModal} onClose={() => setShowNewBuyerModal(false)} title="Nuevo comprador" size="lg">
        <div className="space-y-4">
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
              <Camera size={14} /> Escanear DNI
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDniScan(file, "buyer");
              }} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre" value={buyer.firstName} onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })} />
            <Input label="Apellido" value={buyer.lastName} onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })} />
            <Input label="DNI" value={buyer.dni} onChange={(e) => setBuyer({ ...buyer, dni: e.target.value })} />
            <Input label="Fecha de nacimiento" type="date" value={buyer.birthDate} onChange={(e) => setBuyer({ ...buyer, birthDate: e.target.value })} />
            <Input label="Email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
            <Input label="Teléfono" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
            <Input label="Provincia" value={buyer.province} onChange={(e) => setBuyer({ ...buyer, province: e.target.value })} />
            <Input label="Ciudad" value={buyer.city} onChange={(e) => setBuyer({ ...buyer, city: e.target.value })} />
            <Input label="Calle" value={buyer.street} onChange={(e) => setBuyer({ ...buyer, street: e.target.value })} />
            <Input label="Número" value={buyer.streetNumber} onChange={(e) => setBuyer({ ...buyer, streetNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowNewBuyerModal(false)}>Cancelar</Button>
            <Button type="button" onClick={async () => {
              try {
                const res = await fetch("/api/clients", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    firstName: buyer.firstName,
                    lastName: buyer.lastName,
                    dni: buyer.dni,
                    email: buyer.email,
                    phone: buyer.phone,
                    province: buyer.province,
                    city: buyer.city,
                    street: buyer.street,
                    streetNumber: buyer.streetNumber,
                    clientType: "CLIENTE",
                  }),
                });
                const newClient = await res.json();
                setBuyer((prev) => ({ ...prev, id: newClient.id }));
                setBuyerSearch(`${buyer.firstName} ${buyer.lastName}`);
                setShowNewBuyerModal(false);
              } catch { alert("Error al crear el cliente"); }
            }}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  const renderBoleto = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Boleto de compra-venta</h3>
      {!canGenerateBoleto ? (
        <Card>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-yellow-400 font-medium mb-2">Información incompleta</p>
              <p className="text-xs text-gray-400 mb-3">Para generar el boleto de compra-venta necesitás completar:</p>
              <ul className="space-y-1 text-xs text-gray-500">
                {!vehicle.name && <li>• Nombre del vehículo</li>}
                {!vehicle.domain && <li>• Dominio del vehículo</li>}
                {!seller.firstName && <li>• Datos del vendedor</li>}
                {!seller.dni && <li>• DNI del vendedor</li>}
                {!buyer.firstName && <li>• Datos del comprador</li>}
                {!buyer.dni && <li>• DNI del comprador</li>}
                {!purchasePrice && <li>• Precio de compra</li>}
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Vehículo</p>
                <p className="text-white">{vehicle.name}</p>
                <p className="text-gray-500 text-xs">{vehicle.domain}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Precio</p>
                <p className="text-white">${(parseFloat(purchasePrice) || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Vendedor</p>
                <p className="text-white">{seller.firstName} {seller.lastName}</p>
                <p className="text-gray-500 text-xs">DNI: {seller.dni}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Comprador</p>
                <p className="text-white">{buyer.firstName} {buyer.lastName}</p>
                <p className="text-gray-500 text-xs">DNI: {buyer.dni}</p>
              </div>
            </div>
            <Button type="button" onClick={() => {
              // Generate boleto via API
              alert("Generando boleto de compra-venta...");
            }}>
              <FileText size={16} className="mr-2" /> Generar Boleto
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  const sectionRenderers = [
    renderPreparacion,
    renderTareas,
    renderAnalisis,
    renderDocumentacion,
    renderComprador,
    renderBoleto,
  ];

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/vehicles")}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Nueva Alta de Vehículo</h1>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {SECTIONS.map((section, i) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === i
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div>{sectionRenderers[activeSection]()}</div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <Button
          variant="outline"
          onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
          disabled={activeSection === 0}
        >
          <ArrowLeft size={16} className="mr-2" /> Anterior
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar borrador"}
          </Button>
          {activeSection < SECTIONS.length - 1 ? (
            <Button onClick={() => setActiveSection(activeSection + 1)}>
              Siguiente <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Finalizar Alta"}
            </Button>
          )}
        </div>
      </div>

      {/* New Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nueva Tarea" size="lg">
        <div className="space-y-4">
          <Input label="Título" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            <Input label="Hora (opcional)" type="time" value={taskForm.dueTime} onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })} />
          </div>
          <Select
            label="Proveedor (opcional)"
            value={taskForm.supplierId}
            onChange={(e) => {
              const sup = suppliers.find((s) => s.id === e.target.value);
              setTaskForm({
                ...taskForm,
                supplierId: e.target.value,
                supplierName: sup ? `${sup.firstName} ${sup.lastName}` : "",
              });
            }}
            options={[
              { value: "", label: "Sin proveedor" },
              ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })),
            ]}
          />

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-400">Gastos</h4>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setTaskForm({
                  ...taskForm,
                  expenses: [...taskForm.expenses, { id: genId(), concept: "", amount: "", currency: "ARS", supplierId: "", supplierName: "", cashAccountId: "" }],
                });
              }}>
                <Plus size={14} className="mr-1" /> Agregar gasto
              </Button>
            </div>
            {taskForm.expenses.map((exp, idx) => (
              <div key={exp.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-2 border border-gray-800 rounded-lg p-3">
                <Input
                  label="Concepto"
                  value={exp.concept}
                  onChange={(e) => {
                    const updated = [...taskForm.expenses];
                    updated[idx] = { ...updated[idx], concept: e.target.value };
                    setTaskForm({ ...taskForm, expenses: updated });
                  }}
                />
                <Input
                  label="Monto"
                  type="number"
                  value={exp.amount}
                  onChange={(e) => {
                    const updated = [...taskForm.expenses];
                    updated[idx] = { ...updated[idx], amount: e.target.value };
                    setTaskForm({ ...taskForm, expenses: updated });
                  }}
                />
                <Select
                  label="Proveedor"
                  value={exp.supplierId}
                  onChange={(e) => {
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    const updated = [...taskForm.expenses];
                    updated[idx] = { ...updated[idx], supplierId: e.target.value, supplierName: sup ? `${sup.firstName} ${sup.lastName}` : "" };
                    setTaskForm({ ...taskForm, expenses: updated });
                  }}
                  options={[
                    { value: "", label: "Sin proveedor" },
                    ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })),
                  ]}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="danger" size="sm" onClick={() => {
                    setTaskForm({ ...taskForm, expenses: taskForm.expenses.filter((_, i) => i !== idx) });
                  }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowTaskModal(false)}>Cancelar</Button>
            <Button type="button" onClick={saveTask}>Guardar Tarea</Button>
          </div>
        </div>
      </Modal>

      {/* New Seller Modal */}
      <Modal open={showNewSellerModal} onClose={() => setShowNewSellerModal(false)} title="Nuevo vendedor" size="lg">
        <div className="space-y-4">
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
              <Camera size={14} /> Escanear DNI
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDniScan(file, "seller");
              }} />
            </label>
          </div>
          {sellerDuplicateWarning && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400 mb-2">Ya existe una persona con ese DNI:</p>
              <p className="text-sm text-white">{sellerDuplicateWarning.firstName} {sellerDuplicateWarning.lastName} - DNI: {sellerDuplicateWarning.dni}</p>
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => {
                selectSeller(sellerDuplicateWarning);
                setSellerDuplicateWarning(null);
                setShowNewSellerModal(false);
              }}>Seleccionar esta persona</Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre" value={seller.firstName} onChange={(e) => setSeller({ ...seller, firstName: e.target.value })} />
            <Input label="Apellido" value={seller.lastName} onChange={(e) => setSeller({ ...seller, lastName: e.target.value })} />
            <Input label="DNI" value={seller.dni} onChange={(e) => setSeller({ ...seller, dni: e.target.value })} />
            <Input label="Fecha de nacimiento" type="date" value={seller.birthDate} onChange={(e) => setSeller({ ...seller, birthDate: e.target.value })} />
            <Input label="Email" value={seller.email} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
            <Input label="Teléfono" value={seller.phone} onChange={(e) => setSeller({ ...seller, phone: e.target.value })} />
            <Input label="Provincia" value={seller.province} onChange={(e) => setSeller({ ...seller, province: e.target.value })} />
            <Input label="Ciudad" value={seller.city} onChange={(e) => setSeller({ ...seller, city: e.target.value })} />
            <Input label="Calle" value={seller.street} onChange={(e) => setSeller({ ...seller, street: e.target.value })} />
            <Input label="Número" value={seller.streetNumber} onChange={(e) => setSeller({ ...seller, streetNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => { setShowNewSellerModal(false); setSellerDuplicateWarning(null); }}>Cancelar</Button>
            <Button type="button" onClick={saveNewSeller}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
