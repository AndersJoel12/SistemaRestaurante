import React, { useState, useEffect, useCallback } from "react";
import InputField from "../components/InputField.jsx";
import {
  USUARIO_KEY,
  initialUsuarios,
  loadData,
  saveData,
} from "../utils/cache.js";

// Opciones para los <select>
const rolOptions = ["Administrador", "Mesonero", "Cocinero", "Cajero"];
const estadoOptions = [
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" },
];

const GestionUsuarios = ({ setMessage }) => {
  // --- ESTADOS DE DATOS (Solo Usuarios) ---
  // --> CORRECCIÓN 1 (Redundancia Arreglada):
  const [usuarios, setUsuarios] = useState(() =>
    loadData(USUARIO_KEY, initialUsuarios)
  );
  const [editingItem, setEditingItem] = useState(null);

  // --> CORRECCIÓN 1 (Continuación):
  useEffect(() => {
    const cachedUsuarios = localStorage.getItem(USUARIO_KEY);
    if (!cachedUsuarios || JSON.parse(cachedUsuarios).length === 0) {
      saveData(USUARIO_KEY, initialUsuarios);
    }
  }, []);

  // Manejador de cambios estable
  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  // --- LÓGICA CRUD (Solo Usuarios) ---

  const handleSave = (data) => {
    // --- VALIDACIONES ESPECÍFICAS DE USUARIO ---
    if (
      !data.inicial ||
      data.inicial.trim() === "" ||
      data.inicial.trim().length > 1
    ) {
      setMessage({
        type: "error",
        text: "La Inicial debe ser una sola letra y no puede estar vacía.",
      });
      return;
    }
    if (!data.apellido || data.apellido.trim() === "") {
      setMessage({
        type: "error",
        text: "El Apellido no puede estar vacío.",
      });
      return;
    }
    if (!data.email || data.email.trim() === "") {
      setMessage({ type: "error", text: "El Email no puede estar vacío." });
      return;
    }

    // --> CORRECCIÓN 2 (Booleanos y Limpieza de Datos):
    // Limpiamos y preparamos los datos antes de guardar
    const datosAGuardar = {
      ...data,
      activo: data.activo === "true" || data.activo === true,
      inicial: data.inicial.trim().toUpperCase(),
      apellido: data.apellido.trim(),
    };

    if (datosAGuardar.id) {
      // UPDATE
      const updatedList = usuarios.map((item) =>
        item.id === datosAGuardar.id ? datosAGuardar : item
      );
      setUsuarios(updatedList);
      saveData(USUARIO_KEY, updatedList);
      setMessage({
        type: "success",
        text: `Usuario actualizado con éxito.`,
      });
    } else {
      // CREATE
      const newId = Date.now();
      const newItem = { ...datosAGuardar, id: newId };
      const newList = [...usuarios, newItem];
      setUsuarios(newList);
      saveData(USUARIO_KEY, newList);
      setMessage({ type: "success", text: `Usuario creado con éxito.` });
    }
    setEditingItem(null); // Cierra el formulario
  };

  const handleEdit = (item) => {
    setMessage(null);
    // --> CORRECCIÓN 2 (Booleanos):
    // Convertimos el booleano (true) a texto ("true") para el formulario
    const itemData = {
      ...item,
      activo: item.activo ? "true" : "false",
    };
    setEditingItem(itemData);
  };

  const handleDelete = (itemId) => {
    if (window.confirm(`¿Seguro que quieres eliminar el Usuario ID ${itemId}?`)) {
      const updatedList = usuarios.filter((item) => item.id !== itemId);
      setUsuarios(updatedList);
      saveData(USUARIO_KEY, updatedList);
      setMessage({ type: "warning", text: `Usuario eliminado del caché.` });
    }
    setEditingItem(null);
  };

  const handleCreateNew = () => {
    setMessage(null);
    setEditingItem({
      inicial: "",
      apellido: "",
      email: "",
      rol: "Mesonero",
      activo: "true", // El formulario usa "true" (string)
      id: null,
    });
  };

  // --- RENDERIZADO DEL FORMULARIO ---
  const renderForm = () => {
    if (!editingItem) return null;

    const isNew = editingItem.id === null;
    const title = isNew ? "Crear Nuevo USUARIO" : "Editar USUARIO";

    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">{title}</h2>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/4">
              <InputField
                label="Inicial (1ra letra)"
                name="inicial"
                maxLength={1}
                value={editingItem.inicial}
                onChange={handleFormChange}
              />
            </div>
            <div className="w-3/4">
              <InputField
                label="Apellido(s)"
                name="apellido"
                value={editingItem.apellido}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <InputField
            label="Email (Acceso)"
            name="email"
            type="email"
            value={editingItem.email}
            onChange={handleFormChange}
          />
          <InputField
            label="Rol"
            name="rol"
            type="select"
            options={rolOptions}
            value={editingItem.rol}
            onChange={handleFormChange}
          />
          {!isNew && (
            <InputField
              label="Estado de Cuenta"
              name="activo"
              type="select"
              options={estadoOptions}
              value={editingItem.activo}
              onChange={handleFormChange}
            />
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSave(editingItem)}
              className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 font-semibold transition"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERIZADO DEL CONTENIDO DE LA TABLA ---
  const renderTableContent = () => {
    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Inicial</th>
              <th className="py-3 px-6 text-left">Apellido</th>
              <th className="py-3 px-6 text-left">Email</th>
á             <th className="py-3 px-6 text-left">Rol</th>
              <th className="py-3 px-6 text-center">Estado</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm font-light divide-y divide-gray-200">
            {usuarios.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {user.id}
                </td>
                <td className="py-3 px-6 text-left font-bold">
                  {user.inicial}
                </td>
                <td className="py-3 px-6 text-left">{user.apellido}</td>
                <td className="py-3 px-6 text-left">{user.email}</td>
                <td className="py-3 px-6 text-left font-medium">
                  {user.rol}
                </td>
                <td className="py-3 px-6 text-center">
                  <span
                    className={`py-1 px-3 rounded-full text-xs font-semibold ${
                      user.activo
                        ? "bg-green-200 text-green-600"
                        : "bg-red-200 text-red-600"
                    }`}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-6 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 font-medium transition"
                	>
                      Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-8">
                  No hay usuarios registrados en el caché.
        _         </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // --- RENDERIZADO PRINCIPAL DEL MÓDULO ---
  return (
    <div>
    t <div className="mb-6 flex justify-end">
        <button
          onClick={handleCreateNew}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          + Crear Nuevo USUARIO
        </button>
      </div>
      {renderForm()}
      {renderTableContent()}
    </div>
  );
};

export default GestionUsuarios;