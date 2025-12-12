import React from "react";

const InputField = React.memo(
  ({
    label,
    name,
    type = "text",
    options = null,
    value,
    onChange,
    error, // 🆕 Nueva prop para manejar mensajes de error
    className = "",
    ...props // (placeholder, disabled, maxLength, id, etc.)
  }) => {
    
    // 1. GENERACIÓN DE ID:
    // Si no pasas un 'id' explícito, usamos el 'name'. 
    // Esto es CRUCIAL para que el click en el label funcione.
    const inputId = props.id || name;
    
    // 2. ESTILOS DINÁMICOS:
    // Si hay error, borde rojo. Si no, borde gris/azul.
    const borderClass = error 
      ? "border-red-500 focus:ring-red-200 bg-red-50" 
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white";

    return (
      <div className="mb-4">
        {/* LABEL ACCESIBLE */}
        {label && (
          <label 
            htmlFor={inputId} // 🔗 Conexión con el input
            className="block text-sm font-bold text-gray-700 capitalize mb-1"
          >
            {label}
            {/* Indicador visual de obligatorio si pasas required */}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {type === "select" ? (
          <div className="relative">
            <select
              id={inputId}
              name={name}
              value={value || ""}
              onChange={onChange}
              // ARIA: Avisamos al navegador si hay error
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : undefined}
              className={`
                appearance-none w-full rounded-xl border p-3 shadow-sm 
                focus:outline-none focus:ring-2 transition-colors
                ${borderClass} ${className}
              `}
              {...props}
            >
              {/* Opción por defecto (Placeholder para Select) */}
              {props.placeholder && (
                <option value="" disabled>
                  {props.placeholder}
                </option>
              )}

              {/* Mapeo seguro de opciones */}
              {options && options.map((opt) => {
                // Soportamos array de strings ["A", "B"] u objetos [{value: 1, label: "A"}]
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            
            {/* Flecha personalizada para el select (opcional, mejora UX) */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        ) : (
          <input
            id={inputId}
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            // ARIA: Accesibilidad para errores
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            className={`
              block w-full rounded-xl border p-3 shadow-sm 
              focus:outline-none focus:ring-2 transition-colors
              ${borderClass} ${className}
            `}
            {...props}
          />
        )}

        {/* MENSAJE DE ERROR */}
        {error && (
          <p 
            id={`${name}-error`} // Conecta con aria-describedby
            className="mt-1 text-sm text-red-600 font-medium animate-pulse"
            role="alert"
          >
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }
);

export default InputField;