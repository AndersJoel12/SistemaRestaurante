import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";

// --- CLAVES DE CACHÉ ---
const PLATO_KEY = "admin_platos";
const USUARIO_KEY = "admin_usuarios";

// --- DATOS INICIALES (Simulados) ---
const initialPlatos = [
  {
    id: 101,
    category: "entradas",
    name: "Rollitos Primavera",
    price: 4.5,
    available: true,
  },
  {
    id: 201,
    category: "sushi",
    name: "California Roll",
    price: 8.99,
    available: true,
  },
];
const initialUsuarios = [
  {
    id: 1,
    inicial: "J",
    apellido: "Pérez",
    email: "juan@ejemplo.com",
    rol: "Administrador",
    activo: true,
  },
  {
    id: 2,
    inicial: "A",
    apellido: "López",
    email: "ana@ejemplo.com",
    rol: "Mesonero",
    activo: true,
  },
  {
    id: 3,
    inicial: "M",
    apellido: "Ruiz",
    email: "maria@ejemplo.com",
    rol: "Cocinero",
    activo: false,
  },
];
const categories = [
  { id: "entradas", name: "Entradas" },
  { id: "sushi", name: "Sushi" },
  { id: "bebidas", name: "Bebidas" },
  { id: "postre", name: "Postre" },
];

// --- FUNCIONES DE PERSISTENCIA (Cache) ---
const loadData = (key, initialData) => {
  const savedData = localStorage.getItem(key); // Si no hay datos guardados, retorna los iniciales.
  if (!savedData) {
    console.log(`💾 [CACHE] Inicializando caché para ${key}`); // EMOJI
    return initialData;
  }
  try {
    const parsedData = JSON.parse(savedData);
    console.log(`✅ [CACHE] Datos cargados para ${key}`); // EMOJI
    return parsedData;
  } catch (e) {
    console.error(
      `❌ [CACHE ERROR] Error al parsear datos de ${key}. Usando iniciales.`,
      e
    ); // EMOJI
    return initialData;
  }
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`📝 [CACHE] Datos guardados para ${key}`); // EMOJI
};

// --- Componente de Mensajes ---
const MessageAlert = ({ msg }) => {
  if (!msg) return null;
  const color =
    msg.type === "error"
      ? "bg-red-100 text-red-800 border-red-400"
      : msg.type === "warning"
      ? "bg-yellow-100 text-yellow-800 border-yellow-400"
      : "bg-green-100 text-green-800 border-green-400";
  const emoji =
    msg.type === "error" ? "🚨" : msg.type === "warning" ? "⚠️" : "✅"; // EMOJI
  return (
    <div className={`p-3 mb-4 rounded ${color} font-medium border-l-4`}>
            {emoji} {msg.text}   {" "}
    </div>
  );
};

// --- Componente de Campo de Entrada Estable (CORRECCIÓN CLAVE para el foco) ---
// Se mueve fuera del componente Admin para evitar re-renderizados que pierden el foco.
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
           {" "}
      <label className="block text-sm font-medium text-gray-700 capitalize">
                {label}     {" "}
      </label>
           {" "}
      {type === "select" ? (
        <select
          name={name}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
                   {" "}
          {options.map((opt) => (
            <option key={opt} value={opt}>
                            {opt}           {" "}
            </option>
          ))}
                 {" "}
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
         {" "}
    </div>
  )
);

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation(); // --- ESTADOS DE DATOS PRINCIPALES (Carga desde caché) ---

  const [platos, setPlatos] = useState(() =>
    loadData(PLATO_KEY, initialPlatos)
  );
  const [usuarios, setUsuarios] = useState(() =>
    loadData(USUARIO_KEY, initialUsuarios)
  ); // --- ESTADOS DE UI Y EDICIÓN ---

  const [activeTab, setActiveTab] = useState("menu");
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState(null); // 1. Garantizar que los datos de prueba se guarden si el caché está vacío en la primera carga

  useEffect(() => {
    const cachedPlatos = localStorage.getItem(PLATO_KEY); // Comprueba si el caché no existe o si está vacío después de parsear
    if (!cachedPlatos || JSON.parse(cachedPlatos).length === 0) {
      saveData(PLATO_KEY, initialPlatos);
      setPlatos(initialPlatos);
      console.log("📝 [SETUP] Inicializando platos de prueba."); // EMOJI
    }

    const cachedUsuarios = localStorage.getItem(USUARIO_KEY);
    if (!cachedUsuarios || JSON.parse(cachedUsuarios).length === 0) {
      saveData(USUARIO_KEY, initialUsuarios);
      setUsuarios(initialUsuarios);
      console.log("📝 [SETUP] Inicializando usuarios de prueba."); // EMOJI
    }
  }, []); // Sincroniza el estado de Platos si viene del componente Menú

  useEffect(() => {
    if (location.state?.dishes) {
      setPlatos(location.state.dishes);
      saveData(PLATO_KEY, location.state.dishes);
      console.log("🔄 [SYNC] Platos actualizados desde /menu."); // EMOJI
    }
  }, [location.state?.dishes]); // 2. MANEJADOR DE CAMBIOS ESTABLE (evita la pérdida de foco)

  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []); // --- LÓGICA CRUD GENÉRICA CON VALIDACIÓN ---

  const handleSave = (data) => {
    const itemType = activeTab;
    let list, setList, key, itemName;

    if (itemType === "menu") {
      list = platos;
      setList = setPlatos;
      key = PLATO_KEY;
      itemName = "Plato";
    } else if (itemType === "usuarios") {
      list = usuarios;
      setList = setUsuarios;
      key = USUARIO_KEY;
      itemName = "Usuario"; // --- VALIDACIONES ESPECÍFICAS DE USUARIO ---

      if (
        !data.inicial ||
        data.inicial.trim() === "" ||
        data.inicial.trim().length > 1
      ) {
        setMessage({
          type: "error",
          text: "La Inicial debe ser una sola letra y no puede estar vacía. ❌", // EMOJI
        });
        return;
      }
      if (!data.apellido || data.apellido.trim() === "") {
        setMessage({
          type: "error",
          text: "El Apellido no puede estar vacío. ❌", // EMOJI
        });
        return;
      }
      if (!data.email || data.email.trim() === "") {
        setMessage({
          type: "error",
          text: "El Email no puede estar vacío. ❌",
        }); // EMOJI
        return;
      }

      data.activo = data.activo === "true" || data.activo === true;
    }

    if (data.id) {
      // UPDATE
      const updatedList = list.map((item) =>
        item.id === data.id ? data : item
      );
      setList(updatedList);
      saveData(key, updatedList);
      setMessage({
        type: "success",
        text: `${itemName} actualizado con éxito. ✨`, // EMOJI
      });
    } else {
      // CREATE
      const newId = Date.now();
      const newItem = {
        ...data,
        id: newId,
        activo: true,
        inicial: data.inicial.trim().toUpperCase(),
        apellido: data.apellido.trim(),
      };
      const newList = [...list, newItem];
      setList(newList);
      saveData(key, newList);
      setMessage({ type: "success", text: `${itemName} creado con éxito. ➕` }); // EMOJI
    }
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    console.log("✏️ [EDIT] Abriendo formulario para edición:", item.id); // EMOJI
    setMessage(null);
    const itemData =
      activeTab === "usuarios"
        ? { ...item, activo: item.activo ? "true" : "false" }
        : item;
    setEditingItem(itemData);
  };

  const handleDelete = (itemId) => {
    const itemType = activeTab;
    let list, setList, key, itemName;

    if (itemType === "menu") {
      list = platos;
      setList = setPlatos;
      key = PLATO_KEY;
      itemName = "Plato";
    } else if (itemType === "usuarios") {
      list = usuarios;
      setList = setUsuarios;
      key = USUARIO_KEY;
      itemName = "Usuario";
    }

    if (
      window.confirm(
        `¿Seguro que quieres eliminar ${itemName} con ID ${itemId}? 🗑️` // EMOJI
      )
    ) {
      const updatedList = list.filter((item) => item.id !== itemId);
      setList(updatedList);
      saveData(key, updatedList);
      setMessage({
        type: "warning",
        text: `${itemName} eliminado del caché. 🗑️`,
      }); // EMOJI
      console.log(`🔥 [DELETE] Ítem ${itemId} eliminado.`); // EMOJI
    }
    setEditingItem(null);
  };

  const applyChangesToMenu = () => {
    console.log("🚀 [APPLY] Navegando a /menu con nuevos platos."); // EMOJI
    navigate("/menu", { state: { dishes: platos } });
  };

  const handleCreateNew = () => {
    console.log(`🆕 [NEW] Abriendo formulario para nuevo ${activeTab}.`); // EMOJI
    setMessage(null);
    let newItem = {};

    if (activeTab === "menu") {
      newItem = {
        name: "",
        category: categories[0].id,
        price: 0,
        available: true,
        id: null,
      };
    } else if (activeTab === "usuarios") {
      newItem = {
        inicial: "",
        apellido: "",
        email: "",
        rol: "Mesonero",
        activo: "true",
        id: null,
      };
    }
    setEditingItem(newItem);
  }; // --- RENDERS DE TABLAS ESPECÍFICAS ---

  const renderTableContent = () => {
    if (activeTab === "menu") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {" "}
          {/* FILTRO DE SEGURIDAD: Solo mapea elementos válidos (con un ID) */} 
                 {" "}
          {platos
            .filter((dish) => dish && dish.id)
            .map((dish) => (
              <MenuItem
                key={dish.id}
                dish={dish}
                isAdmin={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
                   {" "}
          {platos.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-8">
                            🍽️ No hay platos registrados. Crea uno nuevo!      
                   {" "}
            </p> // EMOJI
          )}
                 {" "}
        </div>
      );
    } else if (activeTab === "usuarios") {
      return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                   {" "}
          <table className="min-w-full divide-y divide-gray-200">
                       {" "}
            <thead className="bg-gray-50">
                           {" "}
              <tr className="text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">ID #</th>   
                            <th className="py-3 px-6 text-left">Inicial</th>   
                            <th className="py-3 px-6 text-left">Apellido</th>   
                            <th className="py-3 px-6 text-left">Email</th>     
                          <th className="py-3 px-6 text-left">Rol 👤</th>{" "}
                {/* EMOJI */}               {" "}
                <th className="py-3 px-6 text-center">Estado</th>               {" "}
                <th className="py-3 px-6 text-center">Acciones</th>             {" "}
              </tr>
                         {" "}
            </thead>
                       {" "}
            <tbody className="text-gray-800 text-sm font-light divide-y divide-gray-200">
                           {" "}
              {usuarios.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                                   {" "}
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                                        {user.id}                 {" "}
                  </td>
                                   {" "}
                  <td className="py-3 px-6 text-left font-bold">
                                        {user.inicial}                 {" "}
                  </td>
                                   {" "}
                  <td className="py-3 px-6 text-left">{user.apellido}</td>     
                             {" "}
                  <td className="py-3 px-6 text-left">{user.email}</td>         
                         {" "}
                  <td className="py-3 px-6 text-left font-medium">
                                        {user.rol}                 {" "}
                  </td>
                                   {" "}
                  <td className="py-3 px-6 text-center">
                                       {" "}
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        user.activo
                          ? "bg-green-200 text-green-600"
                          : "bg-red-200 text-red-600"
                      }`}
                    >
                                           {" "}
                      {user.activo ? "🟢 Activo" : "🔴 Inactivo"} {/* EMOJI */} 
                                       {" "}
                    </span>
                                     {" "}
                  </td>
                                   {" "}
                  <td className="py-3 px-6 text-center space-x-2">
                                       {" "}
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium transition"
                    >
                                            ✏️ Editar                    {" "}
                    </button>
                                       {" "}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 font-medium transition"
                    >
                                            🗑️ Eliminar                    {" "}
                    </button>
                                     {" "}
                  </td>
                                 {" "}
                </tr>
              ))}
                           {" "}
              {usuarios.length === 0 && (
                <tr>
                                   {" "}
                  <td colSpan="7" className="text-center text-gray-500 py-8">
                                        🧑‍💻 No hay usuarios registrados en el
                    caché.                  {" "}
                  </td>{" "}
                  {/* EMOJI */}               {" "}
                </tr>
              )}
                         {" "}
            </tbody>
                     {" "}
          </table>
                 {" "}
        </div>
      );
    }
    return null;
  }; // --- Renderizado de Formularios Específicos ---

  const renderForm = () => {
    if (!editingItem) return null;

    const isNew = editingItem.id === null;
    const currentItemType = activeTab;
    const title = isNew
      ? `Crear Nuevo ${currentItemType === "menu" ? "PLATO 🍽️" : "USUARIO 🧑‍💻"}` // EMOJI
      : `Editar ${currentItemType === "menu" ? "PLATO ✏️" : "USUARIO ✏️"}`; // EMOJI

    const UserForm = (
      <>
               {" "}
        <div className="flex space-x-4">
                   {" "}
          <div className="w-1/4">
                       {" "}
            <InputField
              label="Inicial (1ra letra)"
              name="inicial"
              maxLength={1}
              value={editingItem.inicial}
              onChange={handleFormChange}
            />
                     {" "}
          </div>
                   {" "}
          <div className="w-3/4">
                       {" "}
            <InputField
              label="Apellido(s)"
              name="apellido"
              value={editingItem.apellido}
              onChange={handleFormChange}
            />
                     {" "}
          </div>
                 {" "}
        </div>
               {" "}
        <InputField
          label="Email (Acceso)"
          name="email"
          type="email"
          value={editingItem.email}
          onChange={handleFormChange}
        />
               {" "}
        <InputField
          label="Rol"
          name="rol"
          type="select"
          options={["Administrador", "Mesonero", "Cocinero", "Cajero"]}
          value={editingItem.rol}
          onChange={handleFormChange}
        />
               {" "}
        {!isNew && (
          <InputField
            label="Estado de Cuenta"
            name="activo"
            type="select"
            options={["true", "false"]}
            value={editingItem.activo}
            onChange={handleFormChange}
          />
        )}
             {" "}
      </>
    );

    const MenuForm = (
      <>
               {" "}
        <InputField
          label="Nombre del Plato"
          name="name"
          value={editingItem.name}
          onChange={handleFormChange}
        />
               {" "}
        <InputField
          label="Precio"
          name="price"
          type="number"
          value={editingItem.price}
          onChange={handleFormChange}
        />
               {" "}
        <InputField
          label="Categoría"
          name="category"
          type="select"
          options={categories.map((c) => c.id)}
          value={editingItem.category}
          onChange={handleFormChange}
        />
               {" "}
        <InputField
          label="Disponible"
          name="available"
          type="select"
          options={["true", "false"]}
          value={editingItem.available}
          onChange={handleFormChange}
        />
             {" "}
      </>
    );

    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
               {" "}
        <h2 className="text-2xl font-bold mb-4 text-gray-700">{title}</h2>     
         {" "}
        <div className="space-y-4">
                    {currentItemType === "usuarios" ? UserForm : MenuForm}     
             {" "}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                       {" "}
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setMessage(null);
                console.log("↩️ [CANCEL] Cancelando edición/creación."); // EMOJI
              }}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
                            Cancelar            {" "}
            </button>
                       {" "}
            <button
              type="button"
              onClick={() => handleSave(editingItem)}
              className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 font-semibold transition"
            >
                            💾 Guardar cambios            {" "}
            </button>{" "}
            {/* EMOJI */}         {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
    );
  }; // --- RENDER PRINCIPAL ---

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {" "}
      {/* Hago el padding responsive */}     {" "}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-md">
        {" "}
        {/* Hago el header responsive */}       {" "}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-red-800 mb-4 sm:mb-0">
                    ⚙️ Panel de Administración        {" "}
        </h1>{" "}
        {/* EMOJI */}       {" "}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {" "}
          {/* Hago los botones responsive */}         {" "}
          {activeTab === "menu" && (
            <button
              onClick={applyChangesToMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors w-full sm:w-auto"
            >
                            🚀 Aplicar Cambios al Menú            {" "}
            </button>
          )}
                   {" "}
          <button
            onClick={handleCreateNew}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors w-full sm:w-auto"
          >
                        ➕ Crear Nuevo{" "}
            {activeTab === "menu" ? "PLATO" : "USUARIO"}         {" "}
          </button>{" "}
          {/* EMOJI */}       {" "}
        </div>
             {" "}
      </header>
            <MessageAlert msg={message} />     {" "}
      {/* PESTAÑAS (Botones de Navegación) */}     {" "}
      <nav className="flex overflow-x-auto space-x-2 sm:space-x-8 bg-red-800 text-white p-3 rounded-t-xl mb-6 shadow-lg">
        {" "}
        {/* Hago las pestañas responsive (scroll horizontal en móviles) */}     
         {" "}
        {["menu", "usuarios"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setEditingItem(null);
              setMessage(null);
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 text-lg sm:text-xl font-bold transition-colors uppercase ${
              // Hago el texto más pequeño en móvil
              activeTab === tab
                ? "bg-yellow-400 text-red-900 rounded-md shadow-inner"
                : "hover:bg-red-600"
            }`}
          >
                        {tab === "menu" ? "MENÚ 🍔" : "USUARIOS 👥"}{" "}
            {/* EMOJI */}         {" "}
          </button>
        ))}
             {" "}
      </nav>
            {renderForm()}      {renderTableContent()}   {" "}
    </div>
  );
};

export default Admin;
