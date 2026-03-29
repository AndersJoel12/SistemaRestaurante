import React from "react";

// Componente de Campo de Entrada Estable (CORRECCIÓN CLAVE para el foco)
// React.memo evita que se re-dibuje si sus props no cambian.
const InputField = React.memo(
  ({
    label,
    name,
    type = "text",
    options = null,
    maxLength = undefined,
    value,
    onChange,
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 capitalize">
        {label}
      </label>
      {type === "select" ? (
        <select
          name={name}
          value={value || ""}
          // --> El 'onChange' ahora es más genérico y limpio
          onChange={(e) => onChange(name, e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          maxLength={maxLength}
        />
      )}
    </div>
  )
);

export default InputField;