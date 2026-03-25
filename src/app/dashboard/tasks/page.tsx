"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  rating: number | null;
  supplierId: string | null;
  supplier: { id: string; firstName: string; lastName: string } | null;
  check: { id: string; label: string; category: string } | null;
  intake: { id: string; vehicle: { name: string; domain: string | null } | null } | null;
  expenses: {
    id: string;
    concept: string;
    amount: number;
    currency: string;
    supplier: { id: string; firstName: string; lastName: string } | null;
  }[];
  createdAt: string;
}

interface SupplierOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface CashAccountOption {
  id: string;
  name: string;
  currency: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccountOption[]>([]);
  const [search, setSearch] = useState("");
  const [showFinished, setShowFinished] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [completeRating, setCompleteRating] = useState(0);
  const [completeSupplierId, setCompleteSupplierId] = useState("");
  const [showNewSupplierInline, setShowNewSupplierInline] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierLastName, setNewSupplierLastName] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTaskId, setExpenseTaskId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({ concept: "", amount: "", currency: "ARS", supplierId: "", cashAccountId: "" });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTasks();
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers).catch(() => {});
    fetch("/api/cash").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCashAccounts(data);
      else if (data.accounts) setCashAccounts(data.accounts);
    }).catch(() => {});
  }, []);

  const filtered = tasks.filter((t) => {
    if (!showFinished && t.status === "FINALIZADA") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.intake?.vehicle?.name.toLowerCase().includes(q) ||
        t.check?.label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todo = filtered.filter((t) => t.status === "TODO");
  const enCurso = filtered.filter((t) => t.status === "EN_CURSO");
  const finalizadas = filtered.filter((t) => t.status === "FINALIZADA");

  const updateStatus = async (taskId: string, newStatus: string) => {
    if (newStatus === "FINALIZADA") {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setCompletingTask(task);
        setCompleteRating(0);
        setCompleteSupplierId(task.supplierId || "");
        setShowCompleteModal(true);
        return;
      }
    }
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch {
      // ignore
    }
  };

  const completeTask = async () => {
    if (!completingTask) return;
    try {
      await fetch(`/api/tasks/${completingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "FINALIZADA",
          rating: completeRating || null,
          supplierId: completeSupplierId || null,
        }),
      });
      setShowCompleteModal(false);
      setCompletingTask(null);
      fetchTasks();
    } catch {
      alert("Error al completar la tarea");
    }
  };

  const createSupplierInline = async () => {
    if (!newSupplierName) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: newSupplierName, lastName: newSupplierLastName, supplierType: "SERVICIOS" }),
      });
      const newSup = await res.json();
      setSuppliers((prev) => [...prev, newSup]);
      setCompleteSupplierId(newSup.id);
      setShowNewSupplierInline(false);
      setNewSupplierName("");
      setNewSupplierLastName("");
    } catch {
      alert("Error al crear proveedor");
    }
  };

  const addExpense = async () => {
    if (!expenseTaskId || !expenseForm.concept || !expenseForm.amount) return;
    try {
      await fetch(`/api/tasks/${expenseTaskId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: expenseForm.concept,
          amount: parseFloat(expenseForm.amount) || 0,
          currency: expenseForm.currency,
          supplierId: expenseForm.supplierId || null,
          cashAccountId: expenseForm.cashAccountId || null,
        }),
      });
      setShowExpenseModal(false);
      setExpenseForm({ concept: "", amount: "", currency: "ARS", supplierId: "", cashAccountId: "" });
      fetchTasks();
    } catch {
      alert("Error al agregar gasto");
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const renderTaskCard = (task: Task) => {
    const isExpanded = expandedTasks.has(task.id);
    const totalExpenses = task.expenses.reduce((s, e) => s + e.amount, 0);

    return (
      <div key={task.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="px-3 py-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-white flex-1">{task.title}</span>
            <select
              value={task.status}
              onChange={(e) => updateStatus(task.id, e.target.value)}
              className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white flex-shrink-0"
            >
              <option value="TODO">Pendiente</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>
          {task.intake?.vehicle && (
            <p className="text-xs text-blue-400">{task.intake.vehicle.name}</p>
          )}
          {task.check && (
            <p className="text-xs text-gray-500">{task.check.label}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {task.dueDate && (
              <span className="text-xs text-gray-500">{task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ""}</span>
            )}
            {task.supplier && (
              <Badge variant="info">{task.supplier.firstName} {task.supplier.lastName}</Badge>
            )}
            {totalExpenses > 0 && (
              <Badge variant="warning">${totalExpenses.toLocaleString()}</Badge>
            )}
            {task.status === "FINALIZADA" && task.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={10} className={s <= task.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setExpenseTaskId(task.id);
                setExpenseForm({ concept: "", amount: "", currency: "ARS", supplierId: "", cashAccountId: "" });
                setShowExpenseModal(true);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus size={12} /> Gasto
            </button>
            {task.expenses.length > 0 && (
              <button type="button" onClick={() => toggleExpanded(task.id)} className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1">
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {task.expenses.length} gasto{task.expenses.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
        {isExpanded && task.expenses.length > 0 && (
          <div className="px-3 pb-3 space-y-1">
            {task.expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between text-xs px-2 py-1.5 bg-gray-900/50 rounded">
                <span className="text-gray-400">{exp.concept}</span>
                <div className="flex items-center gap-2">
                  {exp.supplier && <span className="text-gray-500">{exp.supplier.firstName}</span>}
                  <span className="text-white">${exp.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Tareas</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showFinished}
              onChange={(e) => setShowFinished(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-blue-600"
            />
            Mostrar finalizadas
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tareas..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODO */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <h2 className="text-sm font-semibold text-gray-300">Pendientes</h2>
            <Badge variant="default">{todo.length}</Badge>
          </div>
          <div className="space-y-2">{todo.map(renderTaskCard)}</div>
          {todo.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">Sin tareas pendientes</p>
          )}
        </div>

        {/* EN_CURSO */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h2 className="text-sm font-semibold text-gray-300">En curso</h2>
            <Badge variant="info">{enCurso.length}</Badge>
          </div>
          <div className="space-y-2">{enCurso.map(renderTaskCard)}</div>
          {enCurso.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">Sin tareas en curso</p>
          )}
        </div>

        {/* FINALIZADA */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold text-gray-300">Finalizadas</h2>
            <Badge variant="success">{finalizadas.length}</Badge>
          </div>
          <div className="space-y-2">{finalizadas.map(renderTaskCard)}</div>
          {finalizadas.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">Sin tareas finalizadas</p>
          )}
        </div>
      </div>

      {/* Complete Task Modal */}
      <Modal open={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Finalizar tarea" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">¿Cómo se realizó el trabajo?</p>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Puntuación</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCompleteRating(s)}
                  className="p-1"
                >
                  <Star size={24} className={s <= completeRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                </button>
              ))}
            </div>
          </div>

          {/* Supplier */}
          <div>
            <Select
              label="Proveedor"
              value={completeSupplierId}
              onChange={(e) => setCompleteSupplierId(e.target.value)}
              options={[
                { value: "", label: "Seleccionar proveedor" },
                ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })),
              ]}
            />
            {!showNewSupplierInline && (
              <button type="button" onClick={() => setShowNewSupplierInline(true)} className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
                <Plus size={12} /> Crear nuevo proveedor
              </button>
            )}
            {showNewSupplierInline && (
              <div className="mt-2 p-3 border border-gray-700 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nombre" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
                  <Input label="Apellido" value={newSupplierLastName} onChange={(e) => setNewSupplierLastName(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={createSupplierInline}>Crear</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSupplierInline(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowCompleteModal(false)}>Cancelar</Button>
            <Button type="button" onClick={completeTask}>Finalizar tarea</Button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Agregar gasto" size="md">
        <div className="space-y-4">
          <Input label="Concepto" value={expenseForm.concept} onChange={(e) => setExpenseForm({ ...expenseForm, concept: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            <Select label="Moneda" value={expenseForm.currency} onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })} options={[
              { value: "ARS", label: "ARS" },
              { value: "USD", label: "USD" },
            ]} />
          </div>
          <Select
            label="Proveedor"
            value={expenseForm.supplierId}
            onChange={(e) => setExpenseForm({ ...expenseForm, supplierId: e.target.value })}
            options={[
              { value: "", label: "Sin proveedor" },
              ...suppliers.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })),
            ]}
          />
          <Select
            label="Caja"
            value={expenseForm.cashAccountId}
            onChange={(e) => setExpenseForm({ ...expenseForm, cashAccountId: e.target.value })}
            options={[
              { value: "", label: "Sin caja" },
              ...cashAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
            <Button type="button" onClick={addExpense}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
