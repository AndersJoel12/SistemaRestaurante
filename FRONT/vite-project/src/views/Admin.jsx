import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";

// --- DATOS BASE DEL MENÚ (Copia de seguridad) ---
const initialDishes = [
  {
    id: 101,
    category: "entradas",
    name: "Rollitos Primavera",
    price: 4.5,
    available: true,
  },
  {
    id: 102,
    category: "entradas",
    name: "Sopa Miso Tradicional",
    price: 3.0,
    available: true,
  },
  {
    id: 201,
    category: "sushi",
    name: "California Roll",
    price: 8.99,
    available: true,
  },
  {
    id: 204,
    category: "sushi",
    name: "Sashimi de Atún Fresco",
    price: 12.0,
    available: false,
  },
  {
    id: 303,
    category: "bebidas",
    name: "Refresco Cola Grande",
    price: 2.0,
    available: true,
  },
  {
    id: 402,
    category: "postre",
    name: "Helado Frito (Tempura)",
    price: 6.5,
    available: true,
  },
];

// Categorías disponibles
const categories = [
  { id: "entradas", name: "Entradas" },
  { id: "sushi", name: "Sushi" },
  { id: "bebidas", name: "Bebidas" },
  { id: "postre", name: "Postre" },
];

// Componente para el formulario de edición/creación
const DishForm = ({ initialData, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    price: initialData.price || 0,
    category: initialData.category || categories[0].id,
    available: initialData.available ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...initialData, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Precio ($)
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Categoría
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center">
        <input
          id="available"
          type="checkbox"
          name="available"
          checked={formData.available}
          onChange={handleChange}
          className="h-4 w-4 text-red-700 border-gray-300 rounded"
        />
        <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
          Disponible
        </label>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 font-semibold"
        >
          {initialData.id ? "Guardar Edición" : "Crear Plato"}
        </button>
      </div>
    </form>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Carga los platos: usa el "caché" si el menú lo ha devuelto, o los datos base.
  const cachedDishes = location.state?.dishes || initialDishes; // Estado local de los platos en el Admin (el "caché" en edición)
  const [dishes, setDishes] = useState(cachedDishes);
  const [dishData, setDishData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("entradas");

  // Sincroniza el estado local con el caché al navegar al Admin
  useEffect(() => {
    setDishes(cachedDishes);
  }, [cachedDishes]); // ---------------------------------------------------- // Lógica CRUD // ----------------------------------------------------

  const handleCreateNew = () => {
    setDishData({
      name: "",
      category: categories[0].id,
      price: 0,
      available: true,
      id: null,
    });
  };

  const handleEdit = (dish) => {
    setDishData({ ...dish, price: Number(dish.price) });
  };

  const handleSave = (data) => {
    setDishData(null);
    if (data.id) {
      // ACTUALIZAR
      setDishes((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    } else {
      // CREAR
      const newId = Date.now();
      const newDish = { ...data, id: newId };
      setDishes((prev) => [...prev, newDish]);
    }
  };

  const handleDelete = (dishId) => {
    const confirmation = window.prompt(
      `Escribe 'CONFIRMAR' para eliminar el plato con ID ${dishId}.`
    );
    if (confirmation !== "CONFIRMAR") return;
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    setDishData(null);
  };

  // FUNCIÓN CLAVE: "Publica" el menú modificado al cliente
  const applyChangesToMenu = () => {
    // Navega a la ruta /menu y pasa el array 'dishes' modificado en el estado de navegación.
    navigate("/menu", {
      state: {
        dishes: dishes,
        tableId: location.state?.tableId || "X",
      },
    });
  };

  // --- Renderizado ---
  const filteredDishes = dishes.filter((d) => d.category === activeCategory);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
                 {" "}
      <header className="mb-8 flex justify-between items-center">
                       {" "}
        <h1 className="text-4xl font-extrabold text-red-800">
          Panel de Administración
        </h1>
                       {" "}
        <div className="flex space-x-3">
          <button
            onClick={applyChangesToMenu}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
                                    Aplicar Cambios al Menú                    {" "}
          </button>
                             {" "}
          <button
            onClick={handleCreateNew}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
                                    + Nuevo Plato                    {" "}
          </button>
        </div>
                   {" "}
      </header>
                  {/* Formulario de Creación/Edición */}           {" "}
      {dishData && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
                             {" "}
          <h2 className="text-2xl font-bold mb-4 text-gray-700">
                                   {" "}
            {dishData.id
              ? `Editar Plato ID: ${dishData.id}`
              : "Crear Nuevo Plato"}
                               {" "}
          </h2>
                             {" "}
          <DishForm
            initialData={dishData}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setDishData(null)}
          />
                         {" "}
        </div>
      )}
      <nav className="flex justify-center space-x-2 bg-red-700 text-white p-2 rounded-t-xl mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1 text-sm font-bold transition-colors rounded-lg ${
              activeCategory === cat.id
                ? "bg-yellow-400 text-red-900"
                : "hover:bg-red-600"
            }`}
          >
            {cat.name} ({dishes.filter((d) => d.category === cat.id).length})
          </button>
        ))}
      </nav>
                              {/* Listado de Platos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDishes.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">
            No hay platos en esta categoría.
          </p>
        )}
        {filteredDishes.map((dish) => (
          <MenuItem
            key={dish.id}
            dish={dish}
            isAdmin={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
             {" "}
    </div>
  );
};

export default Admin;
