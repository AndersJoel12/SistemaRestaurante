import React from 'react';

// 1. CONFIGURACIÓN CENTRALIZADA
// Definimos el comportamiento visual y semántico (accesibilidad) de cada tipo.
const NOTIFICATION_CONFIG = {
    success: {
        bg: "bg-green-600",
        icon: "✅",
        role: "status",      // "Status" es educado (no interrumpe)
        live: "polite",      // Espera a que el usuario termine de escuchar
        label: "Éxito"
    },
    error: {
        bg: "bg-red-600",
        icon: "🛑",
        role: "alert",       // "Alert" es urgente (interrumpe)
        live: "assertive",   // Lee esto INMEDIATAMENTE
        label: "Error"
    },
    warning: {
        bg: "bg-yellow-600",
        icon: "⚠️",
        role: "status",
        live: "polite",
        label: "Advertencia"
    },
    default: {
        bg: "bg-gray-600",
        icon: "ℹ️",
        role: "status",
        live: "polite",
        label: "Información"
    }
};

const Notification = ({ notification }) => {
    // Si no hay notificación, no renderizamos nada (limpieza del DOM)
    if (!notification) return null;

    const { type, message } = notification;

    // 2. SELECCIÓN DE ESTILO
    const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;

    return (
        <div
            // 3. ROLES Y ARIA (Lo que pediste)
            role={config.role}
            aria-live={config.live}
            aria-atomic="true" // Asegura que se lea todo el contenido si cambia
            
            // Name/Label para contexto adicional
            aria-label={`Notificación de ${config.label}: ${message}`}

            className={`
                fixed top-4 right-4 z-[60] 
                p-4 rounded-lg shadow-2xl 
                text-white font-bold 
                flex items-center gap-3
                transition-all duration-300 ease-in-out transform translate-y-0
                animate-fade-in-down
                ${config.bg}
            `}
        >
            {/* Icono Visual (Oculto al lector porque ya usamos el rol y label) */}
            <span className="text-xl" aria-hidden="true">
                {config.icon}
            </span>

            <div className="flex flex-col">
                {/* Texto del mensaje */}
                <span className="text-sm md:text-base">
                    {message}
                </span>
            </div>
        </div>
    );
};

export default Notification;