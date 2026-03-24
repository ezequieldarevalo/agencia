// Actionable suggestions: maps operation steps to concrete actions with pre-filled data

export interface StepAction {
  label: string;
  type: "navigate" | "generate_doc" | "create_payment";
  /** Route path or template type */
  target: string;
  /** Pre-filled data for the action */
  prefill?: Record<string, string | number | boolean>;
  icon: string; // Lucide icon name for UI
}

/** Map of step title → action suggestion based on operation type */
const STEP_ACTIONS: Record<string, (op: ActionableOperationData) => StepAction | null> = {
  // COMPRA / COMPRA_VENTA steps
  "Ingreso y Verificación": () => ({
    label: "Ir a Inventario",
    type: "navigate",
    target: "/dashboard/vehicles",
    icon: "Car",
  }),
  "Negociación de Compra": () => null,
  "Pago al proveedor": (op) => ({
    label: "Registrar egreso",
    type: "create_payment",
    target: "/dashboard/cash",
    prefill: {
      type: "EGRESO",
      concept: `Compra - ${op.vehicleName || "vehículo"}`,
      amount: op.totalAmount || 0,
      currency: op.currency,
      operationId: op.id,
    },
    icon: "DollarSign",
  }),
  "Cobro": (op) => ({
    label: "Registrar ingreso en caja",
    type: "create_payment",
    target: "/dashboard/cash",
    prefill: {
      type: "INGRESO",
      concept: `Venta - ${op.vehicleName || "vehículo"}`,
      amount: op.remainingAmount || op.totalAmount || 0,
      currency: op.currency,
      operationId: op.id,
    },
    icon: "DollarSign",
  }),
  "Seña al proveedor": (op) => ({
    label: "Registrar seña",
    type: "create_payment",
    target: "/dashboard/cash",
    prefill: {
      type: "EGRESO",
      concept: `Seña - ${op.vehicleName || "vehículo"}`,
      amount: op.depositAmount || 0,
      currency: op.currency,
      operationId: op.id,
    },
    icon: "DollarSign",
  }),
  "Seña del comprador": (op) => ({
    label: "Registrar seña + Generar recibo",
    type: "create_payment",
    target: "/dashboard/cash",
    prefill: {
      type: "INGRESO",
      concept: `Seña - ${op.vehicleName || "vehículo"}`,
      amount: op.depositAmount || 0,
      currency: op.currency,
      operationId: op.id,
    },
    icon: "DollarSign",
  }),
  "Seña del interesado": (op) => ({
    label: "Registrar seña",
    type: "create_payment",
    target: "/dashboard/cash",
    prefill: {
      type: "INGRESO",
      concept: `Seña - ${op.vehicleName || "vehículo"}`,
      amount: op.depositAmount || 0,
      currency: op.currency,
      operationId: op.id,
    },
    icon: "DollarSign",
  }),
  // VENTA / COMPRA_VENTA steps
  "Preparación del Vehículo": () => null,
  "Presupuesto": () => ({
    label: "Generar presupuesto",
    type: "generate_doc",
    target: "PRESUPUESTO",
    icon: "FileText",
  }),
  "Financiación": () => ({
    label: "Configurar deuda/cuotas",
    type: "navigate",
    target: "/dashboard/debts",
    icon: "CreditCard",
  }),
  "Cierre de Venta": () => ({
    label: "Generar boleto de compra-venta",
    type: "generate_doc",
    target: "BOLETO",
    icon: "FileText",
  }),
  "Entrega": () => null,
  // COMPRA transfer & docs
  "Transferencia de Ingreso": () => ({
    label: "Ver trámite de transferencia",
    type: "navigate",
    target: "/dashboard/operations",
    icon: "FileCheck",
  }),
  "Documentación y Alta": () => ({
    label: "Generar boleto de compra-venta",
    type: "generate_doc",
    target: "BOLETO",
    icon: "FileText",
  }),
  "Documentación de Compra": () => ({
    label: "Generar boleto de compra-venta",
    type: "generate_doc",
    target: "BOLETO",
    icon: "FileText",
  }),
  // CONSIGNACION steps
  "Recepción e Inspección": () => ({
    label: "Ir a Inventario",
    type: "navigate",
    target: "/dashboard/vehicles",
    icon: "Car",
  }),
  "Contrato de Consignación": (op) => ({
    label: "Generar contrato de consignación",
    type: "generate_doc",
    target: op.type === "CONSIGNACION" ? "CONSIGNACION" : "CONTRATO",
    icon: "FileText",
  }),
  "Preparación y Publicación": () => ({
    label: "Publicar en integraciones",
    type: "navigate",
    target: "/dashboard/integrations",
    icon: "Share2",
  }),
  "Cierre y Liquidación": () => null,
};

export interface ActionableOperationData {
  id: string;
  type: string;
  vehicleName?: string;
  clientName?: string;
  totalAmount?: number | null;
  paidAmount?: number;
  depositAmount?: number | null;
  remainingAmount?: number;
  currency: string;
}

/** Get the actionable suggestion for a specific step */
export function getStepAction(stepTitle: string, op: ActionableOperationData): StepAction | null {
  const factory = STEP_ACTIONS[stepTitle];
  return factory ? factory(op) : null;
}

/** Recommended template type based on operation type and step */
export function getRecommendedTemplate(opType: string, stepTitle: string): string | null {
  const map: Record<string, Record<string, string>> = {
    COMPRA: { "Documentación y Alta": "BOLETO" },
    VENTA: { "Presupuesto": "PRESUPUESTO", "Cierre de Venta": "BOLETO", "Seña del comprador": "RECIBO_SENA" },
    COMPRA_VENTA: { "Documentación de Compra": "BOLETO", "Presupuesto": "PRESUPUESTO", "Cierre de Venta": "BOLETO", "Seña del comprador": "RECIBO_SENA" },
    CONSIGNACION: { "Contrato de Consignación": "CONSIGNACION", "Seña del interesado": "RECIBO_SENA" },
  };
  return map[opType]?.[stepTitle] || null;
}

/** Financial status for an operation */
export interface FinancialStatus {
  status: "PENDIENTE" | "PARCIAL" | "COMPLETO" | "EXCEDIDO" | "SIN_MONTO";
  label: string;
  color: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  percentage: number;
}

export function getFinancialStatus(totalAmount: number | null | undefined, paidAmount: number): FinancialStatus {
  if (!totalAmount || totalAmount <= 0) {
    return { status: "SIN_MONTO", label: "Sin monto", color: "#6b7280", totalAmount: 0, paidAmount, remaining: 0, percentage: 0 };
  }
  const remaining = totalAmount - paidAmount;
  const percentage = Math.min(Math.round((paidAmount / totalAmount) * 100), 100);

  if (paidAmount <= 0) {
    return { status: "PENDIENTE", label: "Pendiente", color: "#ef4444", totalAmount, paidAmount, remaining, percentage: 0 };
  }
  if (paidAmount >= totalAmount) {
    return { status: paidAmount > totalAmount ? "EXCEDIDO" : "COMPLETO", label: paidAmount > totalAmount ? "Excedido" : "Completo", color: paidAmount > totalAmount ? "#f59e0b" : "#22c55e", totalAmount, paidAmount, remaining: Math.max(0, remaining), percentage: 100 };
  }
  return { status: "PARCIAL", label: "Parcial", color: "#3b82f6", totalAmount, paidAmount, remaining, percentage };
}
