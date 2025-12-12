import React from "react";

// 1. CONFIGURACIÓN (Patrón de Diccionario)
// Definimos cómo se comporta cada tipo de alerta.
const ALERT_CONFIG = {
  error: {
    styles: "bg-red-50 text-red-800 border-red-500",
    icon: "🛑",
    role: "alert", // "Alert" interrumpe al lector de pantalla (prioridad alta)
    title: "Error"
  },
  warning: {
    styles: "bg-yellow-50 text-yellow-800 border-yellow-500",
    icon: "⚠️",
    role: "status", // "Status" es educado, lee el mensaje cuando hay silencio
    title: "Advertencia"
  },
  success: {
    styles: "bg-green-50 text-green-800 border-green-500",
    icon: "✅",
    role: "status",
    title: "Éxito"
  },
  // Fallback por defecto
  default: {
    styles: "bg-blue-50 text-blue-800 border-blue-500",
    icon: "ℹ️",
    role: "status",
    title: "Información"
  }
};

const MessageAlert = ({ msg }) => {
  // Si no hay mensaje, no renderizamos nada (Evita renderizado vacío)
  if (!msg) return null;

  // 2. SELECCIÓN DE CONFIGURACIÓN
  // Buscamos la config según el tipo (error, warning, etc.)
  // Si no existe, usamos 'default'.
  const config = ALERT_CONFIG[msg.type] || ALERT_CONFIG.default;

  return (
    <div
      // 3. ROLES ARIA DINÁMICOS
      // Si es error, usa role="alert". Si es éxito, usa role="status".
      role={config.role}
      
      // aria-live: Refuerza el comportamiento del rol
      // "assertive" = interrumpe (para errores). "polite" = espera (para éxitos).
      aria-live={config.role === "alert" ? "assertive" : "polite"}
      
      className={`
        flex items-start gap-3 
        p-4 mb-4 rounded-lg border-l-4 shadow-sm
        transition-all duration-300 animate-fade-in-down
        ${config.styles}
      `}
    >
      {/* Icono visual (Oculto al lector porque el rol ya alerta) */}
      <span className="text-xl" aria-hidden="true">
        {config.icon}
      </span>

      <div className="flex-1">
        {/* Título semántico (opcional, pero ayuda) */}
        <strong className="block font-bold text-sm uppercase tracking-wide opacity-90 mb-0.5">
          {config.title}
        </strong>
        <span className="font-medium text-sm sm:text-base">
          {msg.text}
        </span>
      </div>
    </div>
  );
};

export default MessageAlert;