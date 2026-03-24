// Smart suggestions engine: analyzes operation state and returns alerts + next actions

export interface OperationAlert {
  type: "warning" | "error" | "info" | "success";
  message: string;
  priority?: number; // lower = more urgent (1-5)
}

interface OperationData {
  type: string;
  status: string;
  vehicleId?: string | null;
  clientId?: string | null;
  supplierId?: string | null;
  totalAmount?: number | null;
  paidAmount?: number;
  currency?: string;
  includesTransfer?: boolean;
  hasDeposit?: boolean;
  depositAmount?: number | null;
  isFinanced?: boolean;
  steps: { status: string; title: string; optional?: boolean; category?: string }[];
  createdAt: string | Date;
}

export function getOperationAlerts(op: OperationData): OperationAlert[] {
  const alerts: OperationAlert[] = [];
  if (op.status !== "EN_CURSO") return alerts;

  const completedTitles = new Set(op.steps.filter((s) => s.status === "COMPLETADO").map((s) => s.title));
  const pendingRequired = op.steps.filter((s) => !s.optional && s.status === "PENDIENTE");
  const totalSteps = op.steps.length;
  const completedSteps = op.steps.filter((s) => s.status === "COMPLETADO" || s.status === "OMITIDO").length;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;
  const paid = op.paidAmount || 0;

  // === FINANCIAL VALIDATION (highest priority) ===
  if (op.totalAmount && op.totalAmount > 0) {
    const remaining = op.totalAmount - paid;

    // Risk: vehicle delivered without full payment
    if (op.type === "VENTA" && completedTitles.has("Entrega") && remaining > 0) {
      alerts.push({ type: "error", message: `Vehículo entregado con saldo pendiente: $${Math.round(remaining).toLocaleString("es-AR")}`, priority: 1 });
    }
    // Overpayment
    else if (paid > op.totalAmount) {
      alerts.push({ type: "warning", message: `Cobro excedido por $${Math.round(paid - op.totalAmount).toLocaleString("es-AR")}`, priority: 2 });
    }
    // Partial payment warning when nearing completion
    else if (remaining > 0 && progress > 0.6) {
      alerts.push({ type: "warning", message: `Saldo pendiente: $${Math.round(remaining).toLocaleString("es-AR")} ${op.currency || "ARS"}`, priority: 2 });
    }
  }

  // Deposit flag but no deposit recorded
  if (op.hasDeposit && op.depositAmount && paid < op.depositAmount) {
    alerts.push({ type: "info", message: `Seña de $${Math.round(op.depositAmount).toLocaleString("es-AR")} pendiente — registrala y generá el recibo`, priority: 3 });
  }

  // Deposit paid → suggest receipt if step not done
  if (op.hasDeposit && op.depositAmount && paid >= op.depositAmount) {
    const receiptStepDone = completedTitles.has("Seña al proveedor") || completedTitles.has("Seña del comprador") || completedTitles.has("Seña del interesado");
    if (!receiptStepDone) {
      alerts.push({ type: "success", message: "Seña cobrada — marcá el paso como completado", priority: 4 });
    }
  }

  // === MISSING ENTITIES ===
  if (op.type === "VENTA" || op.type === "COMPRA_VENTA") {
    if (!op.vehicleId) alerts.push({ type: "warning", message: "Vinculá un vehículo a esta operación", priority: 3 });
    if (!op.clientId && progress > 0.4) alerts.push({ type: "warning", message: "Vinculá un comprador a esta operación", priority: 3 });
    if (!op.totalAmount && progress > 0.3) alerts.push({ type: "warning", message: "Definí el monto de la operación", priority: 3 });
    if (completedTitles.has("Documentación") && !op.clientId) {
      alerts.push({ type: "error", message: "Documentos generados sin comprador vinculado", priority: 1 });
    }
  }

  if (op.type === "COMPRA" || op.type === "COMPRA_VENTA") {
    if (!op.vehicleId) alerts.push({ type: "warning", message: "Vinculá un vehículo a esta compra", priority: 3 });
    if (!op.supplierId) alerts.push({ type: "warning", message: "Vinculá un proveedor a esta compra", priority: 3 });
    if (!op.totalAmount && progress > 0.3) alerts.push({ type: "warning", message: "Definí el monto de compra", priority: 3 });
  }

  if (op.type === "CONSIGNACION") {
    if (!op.vehicleId) alerts.push({ type: "warning", message: "Vinculá un vehículo a consignar", priority: 3 });
    if (!op.clientId && !op.supplierId) alerts.push({ type: "warning", message: "Vinculá al consignante", priority: 3 });
  }

  // === DOCUMENT GENERATION PROMPTS ===
  // If operation is >50% and no document step is completed, prompt
  if (progress > 0.5) {
    const docSteps = op.steps.filter((s) => s.title === "Presupuesto" || s.title === "Documentación" || s.title === "Contrato");
    const anyDocDone = docSteps.some((s) => s.status === "COMPLETADO");
    if (docSteps.length > 0 && !anyDocDone) {
      alerts.push({ type: "info", message: "Operación avanzada — generá los documentos necesarios", priority: 4 });
    }
  }

  // === STALE OPERATION ===
  const ageMs = Date.now() - new Date(op.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 7 && progress < 0.5) {
    alerts.push({ type: "info", message: `Operación abierta hace ${Math.floor(ageDays)} días con poco avance`, priority: 4 });
  }

  // === NEAR COMPLETION ===
  if (pendingRequired.length === 1 && pendingRequired[0]) {
    alerts.push({ type: "success", message: `¡Último paso! Completá "${pendingRequired[0].title}" para cerrar la operación`, priority: 5 });
  } else if (pendingRequired.length === 0 && op.steps.some((s) => s.status === "PENDIENTE" && s.optional)) {
    alerts.push({ type: "success", message: "Todos los pasos requeridos listos — podés cerrar o completar los opcionales", priority: 5 });
  }

  // Sort by priority (most urgent first)
  return alerts.sort((a, b) => (a.priority || 5) - (b.priority || 5));
}

export function getNextSuggestedStep(op: OperationData): string | null {
  const firstPending = op.steps.find((s) => s.status === "PENDIENTE" && !s.optional);
  return firstPending?.title || op.steps.find((s) => s.status === "PENDIENTE")?.title || null;
}
