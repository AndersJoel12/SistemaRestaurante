import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/empleados'; 

const ROL_OPTIONS = ["Administrador", "Cocinero", "Mesero"];

const GestionUsuarios = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("");

  // --- 1. CARGA DE DATOS (Lógica preservada) ---
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/`);
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("🔴 [FETCH] Error:", error);
      setMessage({ type: "error", text: "No se pudo cargar la lista de usuarios." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // --- 2. FILTRADO (Lógica preservada) ---
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((user) => {
      const term = searchTerm.toLowerCase();
      const cedulaStr = user.cedula ? String(user.cedula) : "";
      
      const nombreCompleto = `${user.name || user.nombre || ""} ${user.last_name || user.apellido || ""}`.toLowerCase();
      const usuarioStr = (user.username || user.usuario || "").toLowerCase();

      const matchesSearch = 
        usuarioStr.includes(term) ||
        nombreCompleto.includes(term) ||
        cedulaStr.includes(term);

      const matchesRol = filterRol === "" || user.rol === filterRol;
      return matchesSearch && matchesRol;
    });
  }, [usuarios, searchTerm, filterRol]);

  // --- 3. HANDLERS (Lógica preservada) ---
  const handleFormChange = (arg1, arg2) => {
    let name, value;
    if (arg1 && arg1.target) {
        name = arg1.target.name;
        value = arg1.target.value;
    } else {
        name = arg1;
        value = arg2;
    }
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (item = null) => {
    setMessage(null);
    if (item) {
      const isActive = item.is_active ?? item.activo ?? true;
      
      setEditingItem({
        id: item.id,
        usuario: item.username || item.usuario || "", 
        nombre: item.name || item.nombre || item.first_name || "",
        apellido: item.last_name || item.apellido || "", 
        cedula: item.cedula ? String(item.cedula) : "",
        email: item.email || "",
        rol: item.rol || "Mesonero",
        activo: isActive ? "true" : "false",
        password: "",
        confirmPassword: "" 
      });
    } else {
      setEditingItem({
        id: null,
        usuario: "", nombre: "", apellido: "", cedula: "", email: "",
        rol: "Mesonero",
        activo: "true",
        password: "",
        confirmPassword: ""
      });
    }
  };

  const handleSave = async () => {
    console.log("🔵 [SAVE] Iniciando proceso...");
    setLoading(true);
    setMessage(null);

    try {
        // A. Limpieza de datos (Strings)
        const cedulaStr = String(editingItem.cedula || "").trim();
        const usuarioStr = String(editingItem.usuario || "").trim();
        const nombreStr = String(editingItem.nombre || "").trim();
        const apellidoStr = String(editingItem.apellido || "").trim();
        const emailStr = String(editingItem.email || "").trim();
        
        const pass = editingItem.password || "";
        const confirm = editingItem.confirmPassword || "";

        // B. Validaciones Obligatorias
        if (!usuarioStr || !nombreStr || !cedulaStr) {
          setMessage({ type: "error", text: "Usuario, Nombre y Cédula son obligatorios." });
          setLoading(false);
          return;
        }

        // C. Validaciones de Contraseña
        if (editingItem.id) {
            if (pass.length > 0) {
                if (pass !== confirm) {
                    setMessage({ type: "error", text: "Las contraseñas no coinciden." });
                    setLoading(false); return;
                }
                if (pass.length < 4) { 
                    setMessage({ type: "error", text: "Contraseña muy corta." });
                    setLoading(false); return;
                }
            }
        } else {
            if (!pass) {
                setMessage({ type: "error", text: "La contraseña es obligatoria." });
                setLoading(false); return;
            }
            if (pass !== confirm) {
                setMessage({ type: "error", text: "Las contraseñas no coinciden." });
                setLoading(false); return;
            }
        }

        // D. Payload
        const isUserActive = editingItem.activo === "true";

        const payload = {
          username: usuarioStr,
          first_name: nombreStr,
          last_name: apellidoStr,
          is_active: isUserActive,
          
          name: nombreStr,
          usuario: usuarioStr,
          nombre: nombreStr,
          apellido: apellidoStr,
          activo: isUserActive,

          cedula: cedulaStr,
          email: emailStr,
          rol: editingItem.rol,
        };

        // E. Password
        if (pass.length > 0) {
            payload.password = pass;
        }

        console.log("🚀 [SAVE] Enviando a API:", payload);

        let response;
        if (editingItem.id) {
            const updateUrl = `${API_URL}/${editingItem.id}/`;
            response = await axios.patch(updateUrl, payload);
            
            setUsuarios(prev => prev.map(u => u.id === editingItem.id ? response.data : u));
            setMessage({ type: "success", text: "Usuario actualizado correctamente." });
        } else {
            response = await axios.post(`${API_URL}/`, payload);
            setUsuarios(prev => [...prev, response.data]);
            setMessage({ type: "success", text: "Usuario creado exitosamente." });
        }
        setEditingItem(null); 

    } catch (error) {
        console.error("🔴 [SAVE] Error:", error);
        if (error.response?.data) {
            const errData = error.response.data;
            if (error.response.status === 404) {
                setMessage({ type: "error", text: "Error 404: Usuario no encontrado." });
            } else if (errData.detail) {
                  setMessage({ type: "error", text: `Error: ${errData.detail}` });
            } else {
                const firstKey = Object.keys(errData)[0];
                const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
                
                let fieldName = firstKey;
                if (firstKey === 'password') fieldName = 'Contraseña';
                if (firstKey === 'username') fieldName = 'Usuario';
                
                setMessage({ type: "error", text: `Error en '${fieldName}': ${msg}` });
            }
        } else {
            setMessage({ type: "error", text: "Error de conexión con el servidor." });
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar usuario?`)) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}/`);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      setMessage({ type: "warning", text: "Usuario eliminado." });
    } catch (error) {
      setMessage({ type: "error", text: "Error al eliminar (quizás tiene registros vinculados)." });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER RESPONSIVE ---
  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-24">
      
      {/* Contenedor Principal con padding adaptativo */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6">
          <h1 className="text-2xl md:text-4xl font-extrabold text-yellow-400">Gestión de Usuarios</h1>
          {loading && <span className="text-sm animate-pulse font-medium bg-red-900 px-3 py-1 rounded-full">Procesando...</span>}
        </div>

        {/* Alerta Visible Fuera del Modal */}
        {!editingItem && <MessageAlert msg={message} />}

        {/* BARRA DE CONTROL (Stack en mobile, Row en Desktop) */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md sticky top-2 z-10">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-2/3">
             {/* El input y select son w-full en mobile, y el select tiene w-auto en sm+ */}
             <input type="text" placeholder="🔍 Buscar por nombre, usuario o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"/>
             <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}
               className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer">
               <option value="">Todos los Roles</option>
               {ROL_OPTIONS.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
             </select>
          </div>
          <button onClick={() => openModal(null)} disabled={loading} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95">
            + Crear Usuario
          </button>
        </div>

        {/* --- VISTA MÓVIL (CARDS) - Se oculta en MD --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredUsuarios.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl text-gray-500 col-span-full shadow-md">No se encontraron usuarios.</div>
            ) : (
                filteredUsuarios.map((user) => {
                    const isActive = user.is_active ?? user.activo ?? false; 
                    const statusClass = isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

                    return (
                        <div key={user.id} className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100">
                            
                            {/* Línea Principal: Nombre y Estado */}
                            <div className="flex justify-between items-center pb-2 border-b">
                                <h3 className="font-extrabold text-xl text-gray-800 leading-tight">
                                    {user.name || user.first_name || user.nombre} {user.last_name || user.apellido}
                                </h3>
                                <span className={`py-1 px-3 rounded-full text-xs font-bold ${statusClass}`}>
                                    {isActive ? "ACTIVO" : "INACTIVO"}
                                </span>
                            </div>

                            {/* Detalle 1: Usuario y Cédula */}
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-gray-600">Usuario:</span>
                                <span className="font-bold text-red-700">{user.username || user.usuario}</span>
                            </div>

                            {/* Detalle 2: Rol */}
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-gray-600">Rol:</span>
                                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded text-xs font-bold">{user.rol}</span>
                            </div>

                            {/* Detalle 3: Email y Cédula */}
                             <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                                <span>C.I: {user.cedula}</span>
                                <span className="text-blue-600 truncate max-w-[50%]">{user.email || "Sin correo"}</span>
                            </div>


                            {/* Acciones */}
                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button onClick={() => openModal(user)} className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* --- VISTA DE ESCRITORIO (TABLE) - Se oculta en Móvil --- */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-gray-600 uppercase text-xs font-bold tracking-wider">
                <th className="py-4 px-6 text-left">Usuario</th>
                <th className="py-4 px-6 text-left">Nombre Completo</th>
                <th className="py-4 px-6 text-left">Correo</th>
                <th className="py-4 px-6 text-left">Rol</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {filteredUsuarios.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron usuarios.</td></tr>
              ) : (
                filteredUsuarios.map((user) => {
                  const isActive = user.is_active ?? user.activo ?? false; 
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 px-6 text-left font-bold text-gray-800 text-base">
                        {user.username || user.usuario}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <div className="font-medium text-gray-800">{user.name || user.first_name || user.nombre} {user.last_name || user.apellido}</div>
                        <div className="text-xs text-gray-400">C.I: {user.cedula}</div>
                      </td>
                      <td className="py-3 px-6 text-left text-blue-600 truncate max-w-xs">
                        {user.email || "---"}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                          {user.rol}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                          isActive ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                        }`}>
                          {isActive ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center space-x-4 opacity-80 group-hover:opacity-100">
                        <button onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 transition-all">Editar</button>
                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 font-semibold underline decoration-2 decoration-red-200 hover:decoration-red-600 transition-all">Eliminar</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RESPONSIVE (Optimizando la estructura interna) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            
            <div className="bg-red-800 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingItem.id ? "Editar" : "Crear"} Usuario</h2>
              <button onClick={() => setEditingItem(null)} className="text-white hover:text-gray-300 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              
              <div className="mb-4"><MessageAlert msg={message} /></div> {/* Alerta DENTRO del Modal */}
              
              <div className="space-y-5">
                
                {/* SECCIÓN 1: CREDENCIALES */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-1">Credenciales de Acceso</h3>
                    <InputField label="Usuario (Login)" name="usuario" value={editingItem.usuario} onChange={handleFormChange} />
                    
                    {/* Grid adaptativo para Contraseñas */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="w-full">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {editingItem.id ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                            </label>
                            <input 
                              type="password" name="password" value={editingItem.password} 
                              onChange={(e) => handleFormChange(e.target.name, e.target.value)}
                              placeholder={editingItem.id ? "Dejar vacío para no cambiar" : "Obligatoria"}
                              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
                            <input 
                              type="password" name="confirmPassword" value={editingItem.confirmPassword} 
                              onChange={(e) => handleFormChange(e.target.name, e.target.value)}
                              placeholder="Repetir"
                              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: DATOS PERSONALES */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-1">Datos Personales</h3>
                    {/* Grid adaptativo para Nombre/Apellido */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <InputField label="Nombre" name="nombre" value={editingItem.nombre} onChange={handleFormChange} />
                        <InputField label="Apellido" name="apellido" value={editingItem.apellido} onChange={handleFormChange} />
                    </div>
                    {/* Grid adaptativo para Cédula/Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Cédula" name="cedula" value={editingItem.cedula} onChange={handleFormChange} />
                        <InputField label="Email" name="email" type="email" value={editingItem.email} onChange={handleFormChange} />
                    </div>
                </div>
                
                {/* SECCIÓN 3: PERMISOS (Grid adaptativo) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
                        <select name="rol" value={editingItem.rol} onChange={handleFormChange} className="w-full border border-gray-300 bg-white p-3 rounded-lg focus:ring-2 focus:ring-red-500">
                            {ROL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                        <select name="activo" value={editingItem.activo} onChange={handleFormChange} className="w-full border border-gray-300 bg-white p-3 rounded-lg focus:ring-2 focus:ring-red-500">
                            <option value="true">✅ Activo</option>
                            <option value="false">⛔ Inactivo</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button type="button" onClick={handleSave} disabled={loading} className="px-5 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 shadow-md disabled:opacity-50 transition-transform active:scale-95">
                      {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <NavBar/>
    </div>
  );
};

export default GestionUsuarios;