// Flexible operation step definitions with conditional logic
export interface StepDefinition {
  title: string;
  description: string;
  category: "CORE" | "FINANCIERO" | "DOCUMENTAL" | "LOGISTICO";
  optional?: boolean;
  /** Key from Operation metadata that must be truthy for this step to appear */
  condition?: string;
  /** Default checklist items created with this step */
  defaultChecks?: string[];
}

export interface OperationContext {
  includesTransfer?: boolean;
  hasDeposit?: boolean;
  isFinanced?: boolean;
  paymentMethod?: string;
}

export const OPERATION_STEPS: Record<string, StepDefinition[]> = {
  COMPRA: [
    {
      title: "Ingreso y Verificación",
      description: "Inspeccionar el vehículo, evaluar su estado y documentación",
      category: "CORE",
      defaultChecks: [
        "Inspección mecánica general",
        "Estado de cubiertas",
        "Estado de tapizados",
        "Estado de pintura y carrocería",
        "Revisar daños o fallas",
        "Verificar kilometraje real",
        "Verificación policial (VPA)",
        "Control de título y cédula",
        "Verificar infracciones pendientes",
        "Verificar deuda de patentes",
        "Fotografías del vehículo",
      ],
    },
    {
      title: "Negociación de Compra",
      description: "Acordar precio de toma y forma de pago con el proveedor",
      category: "FINANCIERO",
      defaultChecks: ["Definir precio de toma", "Acordar forma de pago", "Establecer fecha de entrega"],
    },
    {
      title: "Seña al proveedor",
      description: "Registrar anticipo o seña al proveedor",
      category: "FINANCIERO",
      optional: true,
      condition: "hasDeposit",
      defaultChecks: ["Registrar egreso de seña en caja", "Generar recibo de seña"],
    },
    {
      title: "Pago al proveedor",
      description: "Registrar el pago total o saldo restante al proveedor",
      category: "FINANCIERO",
      defaultChecks: ["Registrar egreso en caja", "Confirmar recepción del vehículo", "Verificar documentación recibida (título, cédula verde, cédula azul)"],
    },
    {
      title: "Transferencia de Ingreso",
      description: "Gestionar la transferencia del dominio a nombre de la agencia",
      category: "DOCUMENTAL",
      optional: true,
      condition: "includesTransfer",
      defaultChecks: [
        "Formulario 08 firmado y certificado",
        "Verificación policial vigente",
        "DNRPA — Sellados y aranceles pagos",
        "Libre deuda de patentes e infracciones",
        "Informe de dominio",
      ],
    },
    {
      title: "Documentación y Alta",
      description: "Completar documentación y dar de alta el vehículo en el inventario",
      category: "DOCUMENTAL",
      defaultChecks: ["Generar boleto de compra-venta", "Archivar recibo de pago", "Dar de alta en inventario", "Cargar fotos al sistema"],
    },
  ],
  VENTA: [
    {
      title: "Preparación del Vehículo",
      description: "Puesta a punto del vehículo para la venta",
      category: "LOGISTICO",
      defaultChecks: [
        "Service mecánico / revisión técnica",
        "Limpieza interior y exterior",
        "Reparaciones necesarias",
        "Fotos profesionales actualizadas",
        "Publicar en portales (ML, redes, web)",
      ],
    },
    {
      title: "Presupuesto",
      description: "Generar presupuesto y enviarlo al cliente interesado",
      category: "FINANCIERO",
      defaultChecks: ["Generar presupuesto", "Enviar al cliente", "Confirmar aceptación del cliente"],
    },
    {
      title: "Seña del comprador",
      description: "Registrar seña o anticipo del comprador",
      category: "FINANCIERO",
      optional: true,
      condition: "hasDeposit",
      defaultChecks: ["Registrar ingreso de seña en caja", "Generar recibo de seña", "Marcar vehículo como reservado"],
    },
    {
      title: "Cobro",
      description: "Registrar el cobro total o saldo restante",
      category: "FINANCIERO",
      defaultChecks: ["Registrar ingreso en caja", "Confirmar pago completo"],
    },
    {
      title: "Financiación",
      description: "Configurar plan de pagos en cuotas",
      category: "FINANCIERO",
      optional: true,
      condition: "isFinanced",
      defaultChecks: ["Definir cantidad de cuotas", "Registrar deuda", "Acordar fechas de pago"],
    },
    {
      title: "Cierre de Venta",
      description: "Documentación de transferencia y cierre legal de la operación",
      category: "DOCUMENTAL",
      defaultChecks: [
        "Formulario 08 firmado y certificado",
        "Formulario 04 (si corresponde)",
        "B.T.V. vigente",
        "Título y cédula verde",
        "Manuales del vehículo",
        "Segunda llave (si aplica)",
        "Libre deuda de patentes e infracciones",
        "Generar boleto de compra-venta",
        "Imprimir y firmar documentos",
      ],
    },
    {
      title: "Entrega",
      description: "Confirmar la entrega del vehículo al comprador",
      category: "CORE",
      defaultChecks: [
        "Firma del boleto por ambas partes",
        "Entrega de llaves",
        "Entrega de documentación completa",
        "Actualizar estado del vehículo a vendido",
      ],
    },
  ],
  COMPRA_VENTA: [
    // ── FASE COMPRA ──
    {
      title: "Ingreso y Verificación",
      description: "Inspeccionar el vehículo, evaluar su estado y documentación",
      category: "CORE",
      defaultChecks: [
        "Inspección mecánica general",
        "Estado de cubiertas",
        "Estado de tapizados",
        "Estado de pintura y carrocería",
        "Revisar daños o fallas",
        "Verificar kilometraje real",
        "Verificación policial (VPA)",
        "Control de título y cédula",
        "Verificar infracciones pendientes",
        "Verificar deuda de patentes",
        "Fotografías del vehículo",
      ],
    },
    {
      title: "Negociación de Compra",
      description: "Acordar precio de toma y forma de pago con el proveedor",
      category: "FINANCIERO",
      defaultChecks: ["Definir precio de toma", "Acordar forma de pago", "Establecer fecha de entrega"],
    },
    {
      title: "Seña al proveedor",
      description: "Registrar anticipo o seña al proveedor",
      category: "FINANCIERO",
      optional: true,
      condition: "hasDeposit",
      defaultChecks: ["Registrar egreso de seña en caja", "Generar recibo de seña"],
    },
    {
      title: "Pago al proveedor",
      description: "Registrar el pago total o saldo restante al proveedor",
      category: "FINANCIERO",
      defaultChecks: ["Registrar egreso en caja", "Confirmar recepción del vehículo", "Verificar documentación recibida (título, cédula verde, cédula azul)"],
    },
    {
      title: "Transferencia de Ingreso",
      description: "Gestionar la transferencia del dominio a nombre de la agencia",
      category: "DOCUMENTAL",
      optional: true,
      condition: "includesTransfer",
      defaultChecks: [
        "Formulario 08 firmado y certificado",
        "Verificación policial vigente",
        "DNRPA — Sellados y aranceles pagos",
        "Libre deuda de patentes e infracciones",
        "Informe de dominio",
      ],
    },
    {
      title: "Documentación de Compra",
      description: "Completar documentación de compra y dar de alta el vehículo",
      category: "DOCUMENTAL",
      defaultChecks: ["Generar boleto de compra-venta", "Archivar recibo de pago", "Dar de alta en inventario", "Cargar fotos al sistema"],
    },
    // ── FASE VENTA ──
    {
      title: "Preparación del Vehículo",
      description: "Puesta a punto del vehículo para la venta",
      category: "LOGISTICO",
      defaultChecks: [
        "Service mecánico / revisión técnica",
        "Limpieza interior y exterior",
        "Reparaciones necesarias",
        "Fotos profesionales actualizadas",
        "Publicar en portales (ML, redes, web)",
      ],
    },
    {
      title: "Presupuesto",
      description: "Generar presupuesto y enviarlo al cliente interesado",
      category: "FINANCIERO",
      defaultChecks: ["Generar presupuesto", "Enviar al cliente", "Confirmar aceptación del cliente"],
    },
    {
      title: "Seña del comprador",
      description: "Registrar seña o anticipo del comprador",
      category: "FINANCIERO",
      optional: true,
      condition: "hasDeposit",
      defaultChecks: ["Registrar ingreso de seña en caja", "Generar recibo de seña", "Marcar vehículo como reservado"],
    },
    {
      title: "Cobro",
      description: "Registrar el cobro total o saldo restante",
      category: "FINANCIERO",
      defaultChecks: ["Registrar ingreso en caja", "Confirmar pago completo"],
    },
    {
      title: "Financiación",
      description: "Configurar plan de pagos en cuotas",
      category: "FINANCIERO",
      optional: true,
      condition: "isFinanced",
      defaultChecks: ["Definir cantidad de cuotas", "Registrar deuda", "Acordar fechas de pago"],
    },
    {
      title: "Cierre de Venta",
      description: "Documentación de transferencia y cierre legal de la operación",
      category: "DOCUMENTAL",
      defaultChecks: [
        "Formulario 08 firmado y certificado",
        "Formulario 04 (si corresponde)",
        "B.T.V. vigente",
        "Título y cédula verde",
        "Manuales del vehículo",
        "Segunda llave (si aplica)",
        "Libre deuda de patentes e infracciones",
        "Generar boleto de compra-venta",
        "Imprimir y firmar documentos",
      ],
    },
    {
      title: "Entrega",
      description: "Confirmar la entrega del vehículo al comprador",
      category: "CORE",
      defaultChecks: [
        "Firma del boleto por ambas partes",
        "Entrega de llaves",
        "Entrega de documentación completa",
        "Actualizar estado del vehículo a vendido",
      ],
    },
  ],
  CONSIGNACION: [
    {
      title: "Recepción e Inspección",
      description: "Recibir el vehículo e inspeccionar su estado",
      category: "CORE",
      defaultChecks: [
        "Inspeccionar estado general del vehículo",
        "Fotografías del vehículo",
        "Estado de cubiertas, tapizados y pintura",
        "Verificar documentación original (título, cédula)",
        "Verificar libre deuda de patentes",
        "Verificar infracciones pendientes",
        "Registrar vehículo en inventario",
      ],
    },
    {
      title: "Contrato de Consignación",
      description: "Firmar el contrato de consignación con el propietario",
      category: "DOCUMENTAL",
      defaultChecks: [
        "Generar contrato de consignación",
        "Definir precio mínimo de venta",
        "Acordar porcentaje de comisión",
        "Firmar por ambas partes",
        "Archivar copia firmada",
      ],
    },
    {
      title: "Preparación y Publicación",
      description: "Preparar el vehículo y publicarlo para la venta",
      category: "LOGISTICO",
      defaultChecks: [
        "Limpieza y service básico",
        "Fotos profesionales del vehículo",
        "Publicar en MercadoLibre",
        "Publicar en redes sociales",
        "Publicar en web de la agencia",
      ],
    },
    {
      title: "Seña del interesado",
      description: "Registrar seña del potencial comprador",
      category: "FINANCIERO",
      optional: true,
      condition: "hasDeposit",
      defaultChecks: ["Registrar ingreso de seña en caja", "Generar recibo de seña"],
    },
    {
      title: "Cierre y Liquidación",
      description: "Cerrar la operación: venta exitosa o devolución al propietario",
      category: "CORE",
      defaultChecks: [
        "Definir resultado (venta exitosa o devolución)",
        "Documentación de transferencia (F08, F04, BTV)",
        "Liquidar al consignante",
        "Generar factura de comisión",
        "Actualizar estado del vehículo",
      ],
    },
  ],
};

/** Resolve steps based on operation context; returns only applicable steps, ordered */
export function resolveSteps(type: string, context: OperationContext = {}): (StepDefinition & { order: number })[] {
  const all = OPERATION_STEPS[type] || [];
  const applicable = all.filter((s) => {
    if (!s.condition) return true;
    return !!(context as Record<string, unknown>)[s.condition];
  });
  return applicable.map((s, i) => ({ ...s, order: i + 1 }));
}

export const OPERATION_TYPES = [
  { value: "COMPRA_VENTA", label: "Compra-Venta", color: "#8b5cf6", icon: "🔄" },
  { value: "COMPRA", label: "Compra", color: "#3b82f6", icon: "📥" },
  { value: "VENTA", label: "Venta", color: "#22c55e", icon: "📤" },
  { value: "CONSIGNACION", label: "Consignación", color: "#f59e0b", icon: "🤝" },
] as const;

export const OPERATION_STATUSES = [
  { value: "EN_CURSO", label: "En Curso", color: "#3b82f6" },
  { value: "COMPLETADA", label: "Completada", color: "#22c55e" },
  { value: "CANCELADA", label: "Cancelada", color: "#ef4444" },
  { value: "BLOQUEADA", label: "Bloqueada", color: "#f59e0b" },
] as const;

export const STEP_STATUSES = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En Curso" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "OMITIDO", label: "Omitido" },
] as const;

export const STEP_CATEGORIES: Record<string, { label: string; color: string }> = {
  CORE: { label: "Principal", color: "#6366f1" },
  FINANCIERO: { label: "Financiero", color: "#22c55e" },
  DOCUMENTAL: { label: "Documental", color: "#3b82f6" },
  LOGISTICO: { label: "Logístico", color: "#f59e0b" },
};
