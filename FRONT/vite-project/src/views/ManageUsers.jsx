import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

// --- CONFIGURACIÓN ---
const API_URL = "http://localhost:8000/api/empleados";
const DEFAULT_ROL = "mesero";
const ROL_OPTIONS = ["administrador", "cocinero", DEFAULT_ROL];

const normalizeUser = (item) => {
  const isActive = item?.is_active ?? item?.activo ?? true; // Uso de Optional Chaining (item?)
  const rol = item?.rol || DEFAULT_ROL;

  return {
    id: item?.id || null,
    username: item?.username || item?.usuario || "",
    nombre: item?.name || item?.nombre || item?.first_name || "",
    apellido: item?.last_name || item?.apellido || "",
    cedula: item?.cedula ? String(item.cedula) : "",
    email: item?.email || "",
    rol: rol,
    activo: isActive ? "true" : "false", // 'true'/'false' como strings para inputs de radio/select
    password: "",
    confirmPassword: "",
  };
};

const GestionUsuarios = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false); // Filtros

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState(""); // --- 1. CARGA DE DATOS (Lógica preservada) ---

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/`);

      const rawData = Array.isArray(response.data) ? response.data : [];
      setUsuarios(rawData.map(normalizeUser));
    } catch (error) {
      console.error("🔴 [FETCH] Error:", error);
      setMessage({
        type: "error",
        text: "No se pudo cargar la lista de usuarios.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]); // --- 2. FILTRADO (Lógica preservada) ---

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((user) => {
      const term = searchTerm.toLowerCase();

      const cedulaStr = user.cedula;
      const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
      const usuarioStr = user.username.toLowerCase();

      const matchesSearch =
        usuarioStr.includes(term) ||
        nombreCompleto.includes(term) ||
        cedulaStr.includes(term);

      const matchesRol = filterRol === "" || user.rol === filterRol;
      return matchesSearch && matchesRol;
    });
  }, [usuarios, searchTerm, filterRol]); // --- 3. HANDLERS (Lógica preservada) ---

  const handleFormChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setEditingItem((prev) => ({ ...prev, [name]: value }));
    } else {
      console.warn(
        "handleFormChange llamado sin evento Target. Usar setEditingItem directamente si es un cambio manual."
      );
    }
  };

  const setFieldManually = (name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (item = null) => {
    setMessage(null);
    setEditingItem(normalizeUser(item));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    const {
      id,
      cedula,
      username,
      nombre,
      apellido,
      email,
      rol,
      activo,
      password,
      confirmPassword,
    } = editingItem;

    const pass = editingItem.password || "";
    const confirm = editingItem.confirmPassword || "";

    // A. Limpieza de datos (Strings)
    const cedulaStr = String(cedula || "").trim();
    const usuarioStr = String(username || "").trim();
    const nombreStr = String(nombre || "").trim();
    const apellidoStr = String(apellido || "").trim();
    const emailStr = String(email || "").trim();

    if (!usuarioStr || !nombreStr || !cedulaStr) {
      setMessage({
        type: "error",
        text: "Usuario, Nombre y Cédula son obligatorios.",
      });
      setLoading(false);
      return;
    }

    // C. Validaciones de Contraseña (Lógica mantenida, es sólida)
    if (id) {
      // Edición
      if (pass.length > 0) {
        if (pass !== confirm) {
          setMessage({ type: "error", text: "Las contraseñas no coinciden." });
          setLoading(false);
          return;
        }
        if (pass.length < 4) {
          setMessage({ type: "error", text: "Contraseña muy corta." });
          setLoading(false);
          return;
        }
      }
    } else {
      // Creación
      if (!pass) {
        setMessage({ type: "error", text: "La contraseña es obligatoria." });
        setLoading(false);
        return;
      }
      if (pass !== confirm) {
        setMessage({ type: "error", text: "Las contraseñas no coinciden." });
        setLoading(false);
        return;
      }
    }

    const isUserActive = activo === "true";

    const payload = {
      // Se eliminaron las duplicidades (name, usuario, activo, etc.)
      // y se usan solo los que el backend espera (e.g., username, first_name, is_active)
      // Ajusta estos nombres según lo que tu API de Django/DRF espere exactamente
      username: usuarioStr,
      name: nombreStr,
      last_name: apellidoStr,
      is_active: isUserActive, // Django/DRF espera is_active
      cedula: parseInt(cedulaStr, 10),
      email: emailStr,
      rol: rol,
    };

    // E. Password
    if (pass.length > 0) {
      payload.password = pass;
    }

    try {
      let response;
      if (id) {
        // PATCH para actualizar
        response = await axios.patch(`${API_URL}/${id}/`, payload);
        // Actualizar el estado de usuarios. Normalizamos el response.data también
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? normalizeUser(response.data) : u))
        );
        setMessage({
          type: "success",
          text: "Usuario actualizado correctamente.",
        });
      } else {
        // POST para crear
        response = await axios.post(`${API_URL}/`, payload);
        // Añadir el nuevo usuario. Normalizamos el response.data también
        setUsuarios((prev) => [...prev, normalizeUser(response.data)]);
        setMessage({ type: "success", text: "Usuario creado exitosamente." });
      }
      setEditingItem(null);
    } catch (error) {
      // ... Lógica de manejo de errores de la API (Mantenida, es muy buena)
      console.error("🔴 [SAVE] Error:", error);
      if (error.response?.data) {
        const errData = error.response.data;
        if (error.response.status === 404) {
          setMessage({
            type: "error",
            text: "Error 404: Usuario no encontrado.",
          });
        } else if (errData.detail) {
          setMessage({ type: "error", text: `Error: ${errData.detail}` });
        } else {
          const firstKey = Object.keys(errData)[0];
          const msg = Array.isArray(errData[firstKey])
            ? errData[firstKey][0]
            : errData[firstKey];

          let fieldName = firstKey;
          if (firstKey === "password") fieldName = "Contraseña";
          if (firstKey === "username") fieldName = "Usuario";

          setMessage({
            type: "error",
            text: `Error en '${fieldName}': ${msg}`,
          });
        }
      } else {
        setMessage({
          type: "error",
          text: "Error de conexión con el servidor.",
        });
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
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setMessage({ type: "warning", text: "Usuario eliminado." });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error al eliminar (quizás tiene registros vinculados).",
      });
      console.error("🔴 [DELETE] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-24">
      <Header />
      <div className="p-4 md:p-6 max-w-7xl mx-auto" role="main">
        {/* 1. Alerta de Carga (Loading) */}
        {loading && (
          <span
            className="text-sm animate-pulse font-medium bg-red-900 px-3 py-1 rounded-full text-white inline-block mb-4"
            aria-live="polite"
            role="status"
          >
            Procesando...
          </span>
        )}
        {/* 2. Alerta de Mensaje (Si NO estamos editando) */}
        {!editingItem && <MessageAlert msg={message} />}

        {/* 3. Barra de Herramientas: Búsqueda, Filtro y Botón "Crear" */}
        <div
          className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md sticky top-2 z-10"
          role="toolbar"
          aria-label="Filtros y acciones de usuario"
        >
          <div
            className="flex flex-col sm:flex-row gap-3 w-full md:w-2/3"
            role="group"
            aria-label="Opciones de búsqueda y filtro"
          >
            {/* Campo de Búsqueda */}
            <label htmlFor="search-input" className="sr-only">
              Buscar por nombre, usuario o cédula
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="🔍 Buscar por nombre, usuario o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              aria-controls="user-list user-table"
            />
            {/* Selector de Rol (Filtro) */}
            <label htmlFor="role-filter" className="sr-only">
              Filtrar por Rol
            </label>
            <select
              id="role-filter"
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer appearance-none"
              aria-controls="user-list user-table"
            >
              <option value="">Todos los Roles</option>
              {ROL_OPTIONS.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Crear Usuario */}
          <button
            onClick={() => openModal(null)}
            disabled={loading}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300 whitespace-nowrap"
            aria-label="Abrir formulario para crear nuevo usuario"
          >
            + Crear Usuario
          </button>
        </div>

        {/* 4. Contenido Principal (Cards para Móvil, Tabla para Escritorio) */}
        {filteredUsuarios.length === 0 ? (
          // Mensaje de no encontrado
          <div
            className="text-center p-8 bg-white rounded-xl text-gray-500 shadow-md"
            role="alert"
          >
            No se encontraron usuarios que coincidan con los filtros.
          </div>
        ) : (
          <>
            {/* --- VISTA MÓVIL (CARDS) - Se oculta en MD --- */}
            <div
              className="grid grid-cols-1 gap-4 md:hidden"
              role="list"
              id="user-list"
            >
              {filteredUsuarios.map((user) => {
                const isActive = user.is_active ?? user.activo ?? false;
                const statusClass = isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700";

                return (
                  <div
                    key={user.id}
                    className="bg-white p-4 rounded-xl shadow-lg flex flex-col gap-3 border border-gray-100"
                    role="listitem"
                    aria-label={`Usuario ${user.username || user.usuario}`}
                  >
                    {/* Línea Principal: Nombre y Estado */}
                    <div className="flex justify-between items-start pb-2 border-b border-gray-100">
                      <h3 className="font-extrabold text-xl text-gray-800 leading-tight pr-4">
                        {user.name || user.first_name || user.nombre}{" "}
                        {user.last_name || user.apellido}
                      </h3>
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold ${statusClass} flex-shrink-0`}
                        aria-label={`Estado: ${
                          isActive ? "Activo" : "Inactivo"
                        }`}
                      >
                        {isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>

                    {/* Detalle 1: Usuario y Rol */}
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-600">
                        Usuario:
                      </span>
                      <span className="font-bold text-red-700 text-right">
                        {user.username || user.usuario}
                      </span>
                    </div>
                    {/* Detalle 2: Rol */}
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-600">Rol:</span>
                      <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs font-bold">
                        {user.rol}
                      </span>
                    </div>
                    {/* Detalle 3: Email y Cédula */}
                    <div className="flex justify-between text-xs text-gray-500 border-t pt-2 mt-1">
                      <span
                        aria-label={`Cédula: ${user.cedula}`}
                        className="font-medium"
                      >
                        C.I: {user.cedula}
                      </span>
                      <span
                        className="text-blue-600 truncate max-w-[50%] text-right"
                        aria-label={`Email: ${user.email || "Sin correo"}`}
                      >
                        {user.email || "Sin correo"}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div
                      className="flex justify-end gap-3 pt-3"
                      role="group"
                      aria-label={`Acciones para ${
                        user.name || user.first_name
                      }`}
                    >
                      <button
                        onClick={() => openModal(user)}
                        className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                        aria-label="Editar usuario"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        aria-label="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- VISTA DE ESCRITORIO (TABLE) - Se oculta en Móvil --- */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
              <table
                className="min-w-full divide-y divide-gray-200"
                role="table"
                aria-label="Lista de Usuarios"
                id="user-table"
              >
                <thead className="bg-gray-50">
                  <tr
                    className="text-gray-600 uppercase text-xs font-bold tracking-wider"
                    role="row"
                  >
                    <th className="py-4 px-6 text-left" scope="col">
                      Usuario
                    </th>
                    <th className="py-4 px-6 text-left" scope="col">
                      Nombre Completo
                    </th>
                    <th className="py-4 px-6 text-left" scope="col">
                      Correo
                    </th>
                    <th className="py-4 px-6 text-left" scope="col">
                      Rol
                    </th>
                    <th className="py-4 px-6 text-center" scope="col">
                      Estado
                    </th>
                    <th className="py-4 px-6 text-center" scope="col">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="text-gray-700 text-sm divide-y divide-gray-200"
                  role="rowgroup"
                >
                  {filteredUsuarios.map((user) => {
                    const isActive = user.is_active ?? user.activo ?? false;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors group"
                        role="row"
                      >
                        {/* Usuario */}
                        <td
                          className="py-3 px-6 text-left font-bold text-gray-800 text-base"
                          role="cell"
                          data-label="Usuario"
                        >
                          {user.username || user.usuario}
                        </td>
                        {/* Nombre Completo / Cédula */}
                        <td
                          className="py-3 px-6 text-left"
                          role="cell"
                          data-label="Nombre Completo"
                        >
                          <div className="font-medium text-gray-800">
                            {user.name || user.first_name || user.nombre}{" "}
                            {user.last_name || user.apellido}
                          </div>
                          <div
                            className="text-xs text-gray-400"
                            aria-hidden="true"
                          >
                            C.I: {user.cedula}
                          </div>
                        </td>
                        {/* Correo */}
                        <td
                          className="py-3 px-6 text-left text-blue-600 truncate max-w-xs"
                          role="cell"
                          data-label="Correo"
                        >
                          {user.email || "---"}
                        </td>
                        {/* Rol */}
                        <td
                          className="py-3 px-6 text-left"
                          role="cell"
                          data-label="Rol"
                        >
                          <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                            {user.rol}
                          </span>
                        </td>
                        {/* Estado */}
                        <td
                          className="py-3 px-6 text-center"
                          role="cell"
                          data-label="Estado"
                        >
                          <span
                            className={`py-1 px-3 rounded-full text-xs font-bold border ${
                              isActive
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}
                            aria-label={isActive ? "Activo" : "Inactivo"}
                          >
                            {isActive ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td
                          className="py-3 px-6 text-center space-x-4 opacity-80 group-hover:opacity-100 transition-opacity"
                          role="cell"
                          data-label="Acciones"
                        >
                          <button
                            onClick={() => openModal(user)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 transition-all"
                            aria-label={`Editar a ${
                              user.username || user.usuario
                            }`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 font-semibold underline decoration-2 decoration-red-200 hover:decoration-red-600 transition-all"
                            aria-label={`Eliminar a ${
                              user.username || user.usuario
                            }`}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 5. MODAL RESPONSIVE (Optimizando la estructura interna) */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setEditingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del Modal */}
            <div className="bg-red-800 p-4 text-white flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold" id="modal-title">
                {editingItem.id ? "Editar" : "Crear"} Usuario
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:text-gray-300 text-2xl leading-none"
                aria-label="Cerrar formulario"
              >
                &times;
              </button>
            </div>

            {/* Cuerpo del Formulario (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="mb-4">
                <MessageAlert msg={message} />
              </div>

              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                {/* SECCIÓN 1: CREDENCIALES */}
                <fieldset
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4"
                  aria-labelledby="creds-heading"
                >
                  <legend
                    id="creds-heading"
                    className="text-sm font-bold text-gray-500 uppercase border-b pb-1 mb-3"
                  >
                    Credenciales de Acceso
                  </legend>

                  <InputField
                    label="Usuario (Login)"
                    name="username" // Usamos 'username' para consistencia con el backend
                    value={editingItem.username || editingItem.usuario || ""}
                    onChange={handleFormChange}
                    required={true}
                    aria-required="true"
                    autoComplete="username"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contraseña */}
                    <div className="w-full">
                      <label
                        htmlFor="password-input"
                        className="block text-sm font-bold text-gray-700 mb-1"
                      >
                        {editingItem.id
                          ? "Nueva Contraseña (Opcional)"
                          : "Contraseña"}
                      </label>
                      <input
                        id="password-input"
                        type="password"
                        name="password"
                        value={editingItem.password}
                        // ANTES: onChange={(e) => handleFormChange(e.target.name, e.target.value)}
                        onChange={handleFormChange} // <--- CAMBIO CLAVE: Pasar el evento completo
                        placeholder={
                          editingItem.id
                            ? "Dejar vacío para no cambiar"
                            : "Obligatoria"
                        }
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required={!editingItem.id}
                        aria-required={!editingItem.id ? "true" : "false"}
                        autoComplete={
                          editingItem.id ? "new-password" : "current-password"
                        }
                      />
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="w-full">
                      <label
                        htmlFor="confirmPassword-input"
                        className="block text-sm font-bold text-gray-700 mb-1"
                      >
                        Confirmar Contraseña
                      </label>
                      <input
                        id="confirmPassword-input"
                        type="password"
                        name="confirmPassword"
                        value={editingItem.confirmPassword}
                        // ANTES: onChange={(e) => handleFormChange(e.target.name, e.target.value)}
                        onChange={handleFormChange} // <--- CAMBIO CLAVE: Pasar el evento completo
                        placeholder="Repetir"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required={!editingItem.id}
                        aria-required={!editingItem.id ? "true" : "false"}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* SECCIÓN 2: DATOS PERSONALES */}
                <fieldset
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4"
                  aria-labelledby="personal-heading"
                >
                  <legend
                    id="personal-heading"
                    className="text-sm font-bold text-gray-500 uppercase border-b pb-1 mb-3"
                  >
                    Datos Personales
                  </legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Nombre"
                      name="nombre"
                      value={editingItem.nombre}
                      onChange={handleFormChange}
                      required={true}
                      aria-required="true"
                      autoComplete="given-name"
                    />
                    <InputField
                      label="Apellido"
                      name="apellido"
                      value={editingItem.apellido}
                      onChange={handleFormChange}
                      required={true}
                      aria-required="true"
                      autoComplete="family-name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Cédula"
                      name="cedula"
                      value={editingItem.cedula}
                      onChange={handleFormChange}
                      required={true}
                      aria-required="true"
                      type="number" // Para teclados móviles y validación
                    />
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={editingItem.email}
                      onChange={handleFormChange}
                      autoComplete="email"
                    />
                  </div>
                </fieldset>

                {/* SECCIÓN 3: PERMISOS Y ESTADO */}
                <fieldset
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                  aria-labelledby="permisos-heading"
                >
                  <legend id="permisos-heading" className="sr-only">
                    Permisos y Estado
                  </legend>

                  {/* Selector de Rol */}
                  <div>
                    <label
                      htmlFor="rol-select"
                      className="block text-sm font-bold text-gray-700 mb-1"
                    >
                      Rol
                    </label>
                    <select
                      id="rol-select"
                      name="rol"
                      value={editingItem.rol}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 bg-white p-3 rounded-lg focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
                      aria-required="true"
                      required
                    >
                      {ROL_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Estado */}
                  <div>
                    <label
                      htmlFor="activo-select"
                      className="block text-sm font-bold text-gray-700 mb-1"
                    >
                      Estado
                    </label>
                    <select
                      id="activo-select"
                      name="activo"
                      // Asegurar que el valor es un string para el select
                      value={String(editingItem.activo ?? false)}
                      onChange={(e) =>
                        handleFormChange(
                          e.target.name,
                          e.target.value === "true"
                        )
                      }
                      className="w-full border border-gray-300 bg-white p-3 rounded-lg focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
                    >
                      <option value="true">✅ Activo</option>
                      <option value="false">⛔ Inactivo</option>
                    </select>
                  </div>
                </fieldset>

                {/* Botones del Formulario */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 shadow-md disabled:opacity-50 transition-transform active:scale-95"
                    // Eliminé el onClick directo y dejé el submit, ya que el submit llama a handleSave.
                  >
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default GestionUsuarios;
