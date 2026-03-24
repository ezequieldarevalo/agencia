import Link from "next/link";
import {
  Car,
  Users,
  BarChart3,
  Wallet,
  CalendarDays,
  MessageCircle,
  ShoppingBag,
  Globe,
  Smartphone,
  Shield,
  ChevronRight,
  Check,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Car,
    title: "Sabé exactamente dónde está cada auto",
    description:
      "Stock completo con fotos, precios, estado y disponibilidad. Nunca más preguntarte '¿a cuánto lo puse?' o '¿ese ya se vendió?'.",
  },
  {
    icon: Users,
    title: "No pierdas nunca un contacto",
    description:
      "Cada cliente, cada consulta, cada seguimiento registrado. Cuando te preguntan '¿qué onda ese auto?', tenés todo el historial.",
  },
  {
    icon: Wallet,
    title: "Controlá cada peso que entra y sale",
    description:
      "Caja con múltiples cuentas, movimientos categorizados y saldo en tiempo real. Sabé exactamente cuánto ganás con cada operación.",
  },
  {
    icon: BarChart3,
    title: "Decisiones con datos, no intuición",
    description:
      "Dashboard con métricas reales: rentabilidad por vehículo, tendencias de venta, stock parado. Sabé qué funciona y qué no.",
  },
  {
    icon: CalendarDays,
    title: "Que nada se te pase",
    description:
      "Agenda de entregas, test drives, seguimientos y pagos. Todo vinculado a la operación para que no pierdas ningún compromiso.",
  },
  {
    icon: MessageCircle,
    title: "Respondé desde un solo lugar",
    description:
      "WhatsApp integrado: mandá fichas, respondé consultas y hacé seguimiento sin cambiar de app.",
  },
  {
    icon: ShoppingBag,
    title: "Publicá una vez, llegá a todos",
    description:
      "MercadoLibre, Facebook e Instagram conectados. Un click y tu vehículo está en todas las plataformas.",
  },
];

const plans = [
  {
    name: "Plan V6",
    price: "$70.000",
    period: "/mes",
    description: "Ideal para arrancar",
    features: [
      "Inventario",
      "Catálogo web básico",
      "Conexión a Mercado Libre",
      "Conexión a Meta (Facebook e Instagram)",
      "Conexión a WhatsApp para sincronizar catálogo",
      "Usuarios ilimitados",
    ],
    cta: "Empezar ahora",
    highlighted: false,
  },
  {
    name: "Plan V12",
    price: "$130.000",
    period: "/mes",
    description: "Para agencias en crecimiento",
    features: [
      "Todo lo del Plan V6",
      "Página web avanzada",
      "Registro de compra y proveedor",
      "Registro de gastos",
      "Registro de venta y cliente",
      "Tablero con registro de operaciones y rentabilidades mensuales",
    ],
    cta: "Probar 14 días gratis",
    highlighted: true,
  },
  {
    name: "Plan V12 Pro",
    price: "$160.000",
    period: "/mes",
    description: "Gestión completa con caja y prospectos",
    features: [
      "Todo lo del Plan V12",
      "Módulo de caja",
      "Módulo de seguimiento de consultas de prospectos",
    ],
    cta: "Probar 14 días gratis",
    highlighted: false,
  },
  {
    name: "Plan V12 Premium",
    price: "$180.000",
    period: "/mes",
    description: "El pack completo",
    features: [
      "Todo lo del Plan V12 Pro",
      "Módulo de deudas",
    ],
    cta: "Probar 14 días gratis",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">A</span>
              </div>
              <span className="text-xl font-bold">Autogestor</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cómo funciona
              </a>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Beneficios
              </a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Precios
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-2"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <Zap size={14} className="text-blue-400" />
            <span className="text-sm text-blue-400">
              Para agencias de autos en Argentina
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            No pierdas ventas
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              por desorden
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Desde que comprás un auto hasta que lo entregás,
            todo en un solo lugar. Sabé exactamente qué hacer con cada vehículo,
            cuánto cobraste y qué te falta.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
            >
              Probalo 14 días gratis
              <ArrowRight size={20} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors border border-gray-700"
            >
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-red-400/90 mb-6">
                ¿Te suena esto?
              </h2>
              <ul className="space-y-4">
                {[
                  "No sabés cuánto ganaste el mes pasado",
                  "Tenés autos parados que nadie publicó",
                  "Un cliente preguntó y nadie le respondió a tiempo",
                  "La seña la cobraste, pero no la registraste",
                  "Te olvidaste de hacer la transferencia de un auto vendido",
                ].map((problem) => (
                  <li key={problem} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-600/20 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-red-400 text-xs">✕</span>
                    </div>
                    <span className="text-gray-400">{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-400/90 mb-6">
                Con Autogestor:
              </h2>
              <ul className="space-y-4">
                {[
                  "Ves la rentabilidad de cada operación al instante",
                  "Publicás en MercadoLibre, Facebook e Instagram en un click",
                  "Cada consulta queda registrada con seguimiento automático",
                  "Cada cobro se vincula a la operación — sabés cuánto falta",
                  "El sistema te avisa qué pasos te quedan por completar",
                ].map((solution) => (
                  <li key={solution} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check size={12} className="text-green-400" />
                    </div>
                    <span className="text-gray-300">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Así de simple funciona
          </h2>
          <p className="text-lg text-gray-400 mb-16 max-w-2xl mx-auto">
            En minutos tenés todo configurado. Sin instalaciones, sin técnicos, sin complicaciones.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Cargá tu stock",
                description: "Subí tus vehículos con fotos, precios y estado. En un click los publicás en todas las plataformas.",
              },
              {
                step: "2",
                title: "Operá con control",
                description: "Cada compra, venta o consignación tiene pasos claros. Sabés exactamente qué hiciste y qué te falta.",
              },
              {
                step: "3",
                title: "Cobrá y controlá",
                description: "Registrá cada peso que entra y sale. Vinculá pagos a operaciones y sabé cuánto ganás con cada auto.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Todo conectado, nada se pierde
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Cada parte de tu agencia trabaja junta: stock, clientes, pagos,
              publicaciones y documentos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <feature.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Highlight */}
      <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Llegá a más compradores sin esfuerzo extra
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Conectá MercadoLibre, Facebook, Instagram y WhatsApp en minutos.
                Publicá, respondé y vendé sin salir de Autogestor.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Publicá en MercadoLibre sin salir del sistema",
                  "Compartí autos automáticamente en Facebook e IG",
                  "Enviá fichas y respondé consultas por WhatsApp",
                  "Métricas de visitas y preguntas sincronizadas",
                  "Templates de mensajes listos para usar",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check size={12} className="text-green-400" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-8 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Conectá tus cuentas ahora
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "MercadoLibre",
                  icon: ShoppingBag,
                  color: "bg-yellow-600",
                  desc: "Publicaciones, preguntas, métricas",
                },
                {
                  name: "WhatsApp",
                  icon: MessageCircle,
                  color: "bg-green-600",
                  desc: "Mensajes, templates, recordatorios",
                },
                {
                  name: "Facebook",
                  icon: Globe,
                  color: "bg-blue-600",
                  desc: "Posts en tu página de FB",
                },
                {
                  name: "Instagram",
                  icon: Globe,
                  color: "bg-pink-600",
                  desc: "Publicaciones con fotos",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                >
                  <div
                    className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <integration.icon size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">{integration.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{integration.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
            <Smartphone size={14} className="text-purple-400" />
            <span className="text-sm text-purple-400">Disponible en móvil</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Gestioná desde donde estés
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            ¿Estás en la calle viendo un auto? ¿En la feria? Accedé desde el celular
            como si fuera una app nativa. Todo sincronizado en tiempo real.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: Smartphone,
                title: "App Nativa",
                desc: "Android e iOS con Capacitor",
              },
              {
                icon: Globe,
                title: "PWA",
                desc: "Instalable desde Safari o Chrome",
              },
              {
                icon: Shield,
                title: "Seguridad",
                desc: "Datos encriptados y sesiones JWT",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6"
              >
                <item.icon size={28} className="text-purple-400 mx-auto mb-3" />
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Planes simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Elegí el plan que se adapte a tu agencia. Probá gratis por 14 días.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${
                  plan.highlighted
                    ? "bg-blue-600 border-2 border-blue-500 relative"
                    : "bg-gray-900 border border-gray-800"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} /> Más popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p
                  className={`text-sm mt-1 ${
                    plan.highlighted ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.highlighted ? "text-blue-200" : "text-green-400"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Tu agencia merece funcionar mejor
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
              14 días gratis. Sin tarjeta de crédito. Configuralo en minutos
              y empezá a vender con control.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
              >
                Crear cuenta gratis
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-blue-700/50 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors border border-blue-500/30"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="text-lg font-bold">Autogestor</span>
              </div>
              <p className="text-sm text-gray-500">
                Sistema de gestión integral para agencias de autos en Argentina.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Beneficios
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Cuenta</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Registrarse
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <span className="cursor-default">Términos de servicio</span>
                </li>
                <li>
                  <span className="cursor-default">Política de privacidad</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Autogestor. Todos los derechos reservados.
            </p>
            <p className="text-sm text-gray-600">autogestor.com.ar</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
