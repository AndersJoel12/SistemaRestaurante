import React from "react";

const InputField = React.memo(
  ({
    label,
    name,
    type = "text",
    options = null,
    value,
    onChange,
    className = "", // Permite pasar clases extra si hace falta
    ...props // 🔥 MAGIA: Atrapa todo lo demás (placeholder, maxLength, disabled, inputMode, etc.)
  }) => (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
          {label}
        </label>
      )}
      
      {type === "select" ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange} // ✅ CORRECCIÓN: Pasa el evento estándar 'e'
          className={`mt-1 block w-full border border-gray-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white ${className}`}
          {...props} // Pasa el resto de propiedades
        >
          {options && options.map((opt) => (
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
          onChange={onChange} // ✅ CORRECCIÓN: Pasa el evento estándar 'e'
          className={`mt-1 block w-full border border-gray-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
          {...props} // Pasa placeholder, maxLength, inputMode, etc. automáticaente
        />
      )}
    </div>
  )
);

export default InputField;