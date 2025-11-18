import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- CAMBIO ---
// La URL ahora apunta a 'empleados' (o como se llame tu endpoint)
// Asegúrate de que esta sea la URL base correcta para tu CRUD de usuarios
const API_URL = 'http://localhost:8000/api/empleados/'; // <-- RUTA CORREGIDA

const rolOptions = ["Administrador", "Mesonero", "Cocinero", "Cajero"];
const estadoOptions = [
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" },
];

const GestionUsuarios = () => {
  const [message, setMessage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // --- CAMBIO (Lógica de Carga con Axios) ---
  useEffect(() => {
    const cargarUsuarios = async () => {
      // Usamos API_URL directamente (ya incluye la barra al final)
      const url = API_URL; 
      console.log(`[DEBUG] 1. Cargando usuarios desde: ${url}`);
      try {
        // --- AQUÍ VA TU LÓGICA DE AUTENTICACIÓN ---
        // const token = localStorage.getItem('mi_token');
        // if (!token) { /* ...manejar error... */ }
        // const config = { headers: { 'Authorization': `Token ${token}` } };
        // const response = await axios.get(url, config);
        
        // (Quitando autenticación temporalmente por el 401)
        const response = await axios.get(url); // <-- GET a /api/empleados/
        
        console.log("[DEBUG] 2. Usuarios recibidos:", response.data);
        
        if (Array.isArray(response.data)) {
          setUsuarios(response.data);
        } else {
          console.warn("[DEBUG] La API no devolvió un array de usuarios.");
          setUsuarios([]);
        }

      } catch (error) {
        console.error("--- ¡ERROR AL CARGAR USUARIOS! ---");
        if (error.response) {
          console.error("[DEBUG] Error Data:", error.response.data);
          console.error("[DEBUG] Error Status:", error.response.status);
          if (error.response.status === 401) {
            setMessage({ type: "error", text: "Error 401: No autorizado. Necesitas iniciar sesión." });
          } else {
            setMessage({ type: "error", text: "No se pudieron cargar los usuarios. Revisa la consola." });
          }
        } else if (error.request) {
          console.error("[DEBUG] Error Request (¿CORS o servidor caído?):", error.request);
           setMessage({ type: "error", text: "Error de red. ¿El servidor está corriendo?" });
        } else {
          console.error("[DEBUG] Error General:", error.message);
        }
      }
    };

    cargarUsuarios();
  }, []);

  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  // --- CAMBIO (Lógica de Guardado con Axios) ---
  const handleSave = async (data) => {
    setMessage(null);

    // ... (Validaciones no cambian) ...
    if (!data.usuario || data.usuario.trim() === "") { /* ... */ return; }
    if (!data.nombre || data.nombre.trim() === "") { /* ... */ return; }
    if (!data.apellido || data.apellido.trim() === "") { /* ... */ return; }
    if (!data.cedula || data.cedula.trim() === "") { /* ... */ return; }
    if (!data.email || data.email.trim() === "") { /* ... */ return; }

    const datosAGuardar = {
      ...data,
      activo: data.activo === "true" || data.activo === true,
      usuario: data.usuario.trim(),
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      cedula: data.cedula.trim(),
    };

    try {
      if (datosAGuardar.id) {
        // --- REAL (UPDATE / PUT) ---
        // Apunta a /api/empleados/ID/
        const url = `${API_URL}${datosAGuardar.id}/`; 
        console.log(`[DEBUG] 3. Actualizando (PUT) en: ${url}`);
        
        // (Aquí también necesitarás los headers de autenticación)
        const response = await axios.put(url, datosAGuardar); 

        console.log("[DEBUG] 4. Actualización exitosa:", response.data);
        setUsuarios(usuarios.map((item) =>
          item.id === response.data.id ? response.data : item
        ));
        setMessage({
          type: "success",
          text: `Usuario actualizado con éxito.`,
        });

      } else {
        // --- REAL (CREATE / POST) ---
        // Apunta a /api/empleados/
        const url = API_URL; 
        console.log(`[DEBUG] 3. Creando (POST) en: ${url}`);

        // (Aquí también necesitarás los headers de autenticación)
        const response = await axios.post(url, datosAGuardar);

        console.log("[DEBUG] 4. Creación exitosa:", response.data);
        setUsuarios([...usuarios, response.data]);
        setMessage({ type: "success", text: `Usuario creado con éxito.` });
      }
    } catch (error) {
      console.error("--- ¡ERROR AL GUARDAR USUARIO! ---");
      if (error.response) {
        console.error("[DEBUG] Error Data:", error.response.data);
        console.error("[DEBUG] Error Status:", error.response.status);
         if (error.response.status === 401) {
             setMessage({ type: "error", text: "Error 401: No autorizado." });
         } else if (error.response.status === 400) {
             setMessage({ type: "error", text: "Error 400: Datos incorrectos. Revisa la consola." });
             console.log("Datos enviados:", datosAGuardar);
         } else {
            setMessage({ type: "error", text: `Error ${error.response.status}. Revisa la consola.` });
         }
      } else if (error.request) {
        console.error("[DEBUG] Error Request:", error.request);
        setMessage({ type: "error", text: "Error de red o CORS al guardar." });
      } else {
        console.error("[DEBUG] Error General:", error.message);
      }
    }
    
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    console.log("[DEBUG] Abriendo modal para editar:", item);
    setMessage(null);
    const itemData = {
      ...item,
      activo: item.activo ? "true" : "false",
    };
    setEditingItem(itemData);
  };

  // --- CAMBIO (Lógica de Borrado con Axios) ---
  const handleDelete = async (itemId) => {
    if (window.confirm(`¿Seguro que quieres eliminar el Usuario ID ${itemId}?`)) {
      
      // Apunta a /api/empleados/ID/
      const url = `${API_URL}${itemId}/`; 
      console.log(`[DEBUG] 5. Eliminando (DELETE) en: ${url}`);
      try {
        // --- REAL (DELETE) ---
        // (Aquí también necesitarás los headers de autenticación)
        await axios.delete(url);

        console.log("[DEBUG] 6. Eliminación exitosa.");
        const updatedList = usuarios.filter((item) => item.id !== itemId);
        setUsuarios(updatedList);
        setMessage({ type: "warning", text: `Usuario eliminado.` });

      } catch (error) {
        console.error("--- ¡ERROR AL ELIMINAR USUARIO! ---");
        if (error.response) {
          console.error("[DEBUG] Error Data:", error.response.data);
          console.error("[DEBUG] Error Status:", error.response.status);
           if (error.response.status === 401) {
             setMessage({ type: "error", text: "Error 401: No autorizado." });
           } else {
             setMessage({ type: "error", text: "No se pudo eliminar el usuario." });
           }
        } else if (error.request) {
          console.error("[DEBUG] Error Request:", error.request);
        } else {
          console.error("[DEBUG] Error General:", error.message);
        }
      }
    }
    setEditingItem(null);
  };

  const handleCreateNew = () => {
    console.log("[DEBUG] Abriendo formulario para crear nuevo usuario.");
    setMessage(null);
    setEditingItem({
      usuario: "",
      nombre: "",
      apellido: "",
      cedula: "",
      email: "",
      rol: "Mesonero",
      activo: "true",
      id: null,
    });
  };

  // ... (renderForm y renderTableContent no necesitan cambios, 
  // ya que solo leen los estados locales, que están correctos) ...

  const renderForm = () => {
    if (!editingItem) return null;

    const isNew = editingItem.id === null;
    const title = isNew ? "Crear Nuevo USUARIO" : "Editar USUARIO";

    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">{title}</h2>
        <div className="space-y-4">
          <InputField
            label="Usuario"
            name="usuario"
            value={editingItem.usuario}
            onChange={handleFormChange}
          />

          <div className="flex space-x-4">
            <div className="w-1/2">
              <InputField
                label="Nombre"
                name="nombre"
                value={editingItem.nombre}
                onChange={handleFormChange}
              />
            </div>
            <div className="w-1/2">
              <InputField
                label="Apellido"
                name="apellido"
                value={editingItem.apellido}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <InputField
            label="Cédula (Ej: V-12345678)"
            name="cedula"
            value={editingItem.cedula}
            onChange={handleFormChange}
          />

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

  const renderTableContent = () => {
    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Usuario</th>
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Apellido</th>
              <th className="py-3 px-6 text-left">Cédula</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Rol</th>
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
                  {user.usuario}
                </td>
                <td className="py-3 px-6 text-left">{user.nombre}</td>
                <td className="py-3 px-6 text-left">{user.apellido}</td>
                <td className="py-3 px-6 text-left">{user.cedula}</td>
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
                <td colSpan="9" className="text-center text-gray-500 py-8">
                  Cargando usuarios o no hay datos en el servidor...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <MessageAlert msg={message} />

      <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6">
        <h1 className="text-3xl font-extrabold text-center text-yellow-400">
          Gestión de Usuarios
        </h1>
      </div>

      <div className="mb-6 flex justify-end items-center bg-white p-4 rounded-xl shadow-md">
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