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
    title: "Inventario de Vehículos",
    description:
      "Gestioná tu stock completo con fotos, especificaciones técnicas, precios en ARS/USD y estado de cada unidad.",
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description:
      "Administrá clientes y prospectos, historial de interacciones, seguimiento de leads y pipeline de ventas.",
  },
  {
    icon: Wallet,
    title: "Caja y Finanzas",
    description:
      "Múltiples cuentas (efectivo, banco, USD), movimientos categorizados, deudas con pagos parciales y reportes.",
  },
  {
    icon: BarChart3,
    title: "Reportes y Analytics",
    description:
      "Dashboard con métricas en tiempo real: ventas, rentabilidad, stock, marcas más vendidas y tendencias.",
  },
  {
    icon: CalendarDays,
    title: "Agenda y Calendario",
    description:
      "Programá test drives, seguimientos, pagos, entregas y reuniones. Todo vinculado a clientes y vehículos.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    description:
      "Enviá mensajes, fichas de vehículos y recordatorios de pago directo desde la plataforma vía WhatsApp API.",
  },
  {
    icon: ShoppingBag,
    title: "MercadoLibre",
    description:
      "Publicá vehículos, gestioná preguntas, sincronizá métricas y controlá tus listings desde un solo lugar.",
  },
  {
    icon: Globe,
    title: "Facebook e Instagram",
    description:
      "Publicá automáticamente en tu página de Facebook e Instagram con fotos y datos del vehículo.",
  },
];

const stats = [
  { value: "100%", label: "Cloud" },
  { value: "3", label: "Integraciones" },
  { value: "24/7", label: "Disponible" },
  { value: "∞", label: "Vehículos" },
];

const plans = [
  {
    name: "Plan V6",
    price: "$90.000",
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
    price: "$150.000",
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
    price: "$180.000",
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
    price: "$200.000",
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
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#integrations" className="text-sm text-gray-400 hover:text-white transition-colors">
                Integraciones
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
              La plataforma #1 para agencias de autos en Argentina
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Gestioná tu agencia
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              de forma inteligente
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Inventario, clientes, finanzas, calendario, reportes y publicación en
            MercadoLibre, Facebook e Instagram — todo desde un solo lugar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
            >
              Empezar gratis
              <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors border border-gray-700"
            >
              Ver funcionalidades
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Todo lo que necesitás para tu agencia
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Desde el ingreso del vehículo hasta la venta final, cubrimos cada
              paso del proceso.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Publicá en todas las plataformas
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Conectá MercadoLibre, Facebook, Instagram y WhatsApp en minutos.
                Publicá vehículos, respondé preguntas y enviá mensajes sin salir
                de Autogestor.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Publicación con un click en MercadoLibre",
                  "Posts automáticos en Facebook e Instagram",
                  "Mensajes y fichas de vehículos por WhatsApp",
                  "Sincronización de métricas y preguntas",
                  "Templates de mensajes personalizables",
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
            Tu agencia en el bolsillo
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Accedé desde cualquier dispositivo. Autogestor funciona como app
            nativa en Android e iOS, o como PWA instalable desde el navegador.
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
              Empezá a gestionar mejor tu agencia
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
              Creá tu cuenta gratis en segundos y descubrí todo lo que
              Autogestor puede hacer por tu negocio.
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
                  <a href="#features" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-white transition-colors">
                    Integraciones
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
