import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// URL de tu API
const API_URL = 'http://localhost:8000/api/empleados/'; 

// --- MODIFICADO: Se eliminó "Cajero" ---
const rolOptions = ["Administrador", "Mesonero", "Cocinero"];

const estadoOptions = [
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" },
];

const GestionUsuarios = () => {
  const [message, setMessage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("");

  // --- 2. CARGA DE DATOS ---
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`[DEBUG] Cargando usuarios desde: ${API_URL}`);
      const response = await axios.get(API_URL);
      
      if (Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error("--- ERROR AL CARGAR ---", error);
      manejarError(error, "cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const filteredUsuarios = usuarios.filter((user) => {
    // 1. Filtro por texto
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
        user.usuario?.toLowerCase().includes(term) ||
        user.nombre?.toLowerCase().includes(term) ||
        user.apellido?.toLowerCase().includes(term) ||
        user.cedula?.includes(term);

    // 2. Filtro por Rol
    const matchesRol = filterRol === "" || user.rol === filterRol;

    return matchesSearch && matchesRol;
  });

  // --- 3. GUARDAR ---
  const handleSave = async (data) => {
    setMessage(null);

    if (!data.usuario?.trim()) return setMessage({type:"error", text:"Falta el Usuario"});
    if (!data.nombre?.trim()) return setMessage({type:"error", text:"Falta el Nombre"});
    if (!data.cedula?.trim()) return setMessage({type:"error", text:"Falta la Cédula"});

    const payload = {
      usuario: data.usuario.trim(),
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      cedula: data.cedula.trim(),
      email: data.email.trim(),
      rol: data.rol,
      activo: data.activo === "true" || data.activo === true,
    };

    if (!data.id) {
        payload.password = "123456"; 
    }

    setLoading(true);

    try {
      if (data.id) {
        const url = `${API_URL}${data.id}/`;
        const response = await axios.put(url, payload);
        setUsuarios(prev => prev.map(item => item.id === data.id ? response.data : item));
        setMessage({ type: "success", text: "Usuario actualizado correctamente." });
      } else {
        const response = await axios.post(API_URL, payload);
        setUsuarios(prev => [...prev, response.data]);
        setMessage({ type: "success", text: "Usuario creado correctamente (Pass default: 123456)." });
      }
      setEditingItem(null);
    } catch (error) {
      console.error("--- ERROR AL GUARDAR ---", error);
      if (error.response && error.response.status === 400) {
          const errorData = error.response.data;
          const primerCampo = Object.keys(errorData)[0]; 
          const mensaje = errorData[primerCampo];
          setMessage({ type: "error", text: `Error en '${primerCampo}': ${mensaje}` });
      } else {
          manejarError(error, "guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 4. ELIMINAR ---
  const handleDelete = async (itemId) => {
    if (!window.confirm(`¿Estás seguro de eliminar el usuario ID ${itemId}?`)) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}${itemId}/`);
      setUsuarios(prev => prev.filter(item => item.id !== itemId));
      setMessage({ type: "warning", text: "Usuario eliminado correctamente." });
    } catch (error) {
      console.error("--- ERROR AL ELIMINAR ---", error);
      manejarError(error, "eliminar");
    } finally {
        setLoading(false);
    }
  };

  const manejarError = (error, accion) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) setMessage({ type: "error", text: "Sesión expirada. Por favor logueate de nuevo." });
      else if (status === 403) setMessage({ type: "error", text: "No tienes permisos para esta acción." });
      else setMessage({ type: "error", text: `Error ${status} al ${accion}.` });
    } else if (error.request) {
      setMessage({ type: "error", text: "Error de conexión. Verifica si el servidor Django está activo." });
    } else {
      setMessage({ type: "error", text: "Ocurrió un error inesperado." });
    }
  };

  const handleCreateNew = () => {
    setMessage(null);
    setEditingItem({
      id: null,
      usuario: "",
      nombre: "",
      apellido: "",
      cedula: "",
      email: "",
      rol: "Mesonero",
      activo: "true",
    });
  };

  const handleEdit = (item) => {
    setMessage(null);
    setEditingItem({
      ...item,
      activo: item.activo ? "true" : "false", 
    });
  };

  const renderForm = () => {
    if (!editingItem) return null;
    const isNew = editingItem.id === null;

    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500 animate-fade-in-down">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          {isNew ? "Crear Nuevo USUARIO" : "Editar USUARIO"}
        </h2>
        
        <div className="space-y-4">
          <InputField label="Usuario (Login)" name="usuario" value={editingItem.usuario} onChange={handleFormChange} />
          
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <div className="w-full md:w-1/2">
              <InputField label="Nombre" name="nombre" value={editingItem.nombre} onChange={handleFormChange} />
            </div>
            <div className="w-full md:w-1/2">
              <InputField label="Apellido" name="apellido" value={editingItem.apellido} onChange={handleFormChange} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <div className="w-full md:w-1/2">
                 <InputField label="Cédula" name="cedula" value={editingItem.cedula} onChange={handleFormChange} />
            </div>
            <div className="w-full md:w-1/2">
                <InputField label="Email" name="email" type="email" value={editingItem.email} onChange={handleFormChange} />
            </div>
          </div>
          
          <InputField label="Rol" name="rol" type="select" options={rolOptions} value={editingItem.rol} onChange={handleFormChange} />

          {!isNew && (
            <InputField 
              label="Estado" 
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
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSave(editingItem)}
              disabled={loading}
              className={`px-6 py-2 text-white rounded-lg font-semibold transition shadow-lg flex items-center
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-700 hover:bg-red-600"}`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    if (loading && usuarios.length === 0) {
        return <div className="text-center py-10 text-gray-500">Cargando usuarios...</div>;
    }

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Usuario</th>
              <th className="py-3 px-6 text-left">Nombre Completo</th>
              <th className="py-3 px-6 text-left">Rol</th>
              <th className="py-3 px-6 text-center">Estado</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm font-light divide-y divide-gray-200">
            {filteredUsuarios.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-6 text-left">{user.id}</td>
                <td className="py-3 px-6 text-left font-bold">{user.usuario}</td>
                <td className="py-3 px-6 text-left">
                    <div className="flex flex-col">
                        <span>{user.nombre} {user.apellido}</span>
                        <span className="text-xs text-gray-400">{user.cedula}</span>
                    </div>
                </td>
                <td className="py-3 px-6 text-left">
                    <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded text-xs">
                        {user.rol}
                    </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`py-1 px-3 rounded-full text-xs font-semibold ${user.activo ? "bg-green-200 text-green-600" : "bg-red-200 text-red-600"}`}>
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-6 text-center space-x-3">
                  <button 
                    onClick={() => handleEdit(user)} 
                    className="text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsuarios.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <MessageAlert msg={message} />
      
      <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-yellow-400">Gestión de Usuarios</h1>
        {loading && <span className="text-sm animate-pulse">Procesando...</span>}
      </div>

      {/* BARRA DE HERRAMIENTAS: BUSCADOR Y FILTROS */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
            {/* Buscador de Texto */}
            <input 
                type="text" 
                placeholder="Buscar por Nombre, Usuario o Cédula..." 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {/* Selector de Rol */}
            <select 
                className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 bg-white"
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
            >
                <option value="">Todos los Roles</option>
                {rolOptions.map((rol, index) => (
                    <option key={index} value={rol}>{rol}</option>
                ))}
            </select>
        </div>

        <button 
            onClick={handleCreateNew} 
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition transform hover:scale-105 disabled:opacity-50"
            disabled={loading}
        >
          + Crear Usuario
        </button>
      </div>
      
      {renderForm()}
      {renderTableContent()}
    </div>
  );
};

export default GestionUsuarios;