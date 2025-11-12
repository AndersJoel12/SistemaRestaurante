import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx"; 
// NOTA: Los 'initialDishes' ya no son la fuente principal de datos, 
// solo se usan si la API falla o está vacía (no los incluiremos aquí para limpiar el código, 
// ya que el backend de Django es la fuente de verdad).

// --- URL BASE DE LA API DE DJANGO ---
const API_URL = "http://127.0.0.1:8000/api/dishes/"; 

// Categorías disponibles (Vienen del frontend, pero en un proyecto real también podrían venir de la API)
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
    // Usamos .toString() para asegurar que el input de tipo number no se reinicie
    price: (initialData.price || 0).toString(), 
    category: initialData.category || categories[0].id,
    available: initialData.available ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convertimos el precio a número SOLO al guardar
    const priceAsNumber = parseFloat(formData.price) || 0; 
    
    if (formData.name.trim() === "" || priceAsNumber < 0) {
        alert("Por favor, verifica el nombre y precio del plato.");
        return;
    }

    // Pasamos los datos al componente Admin, incluyendo el precio como número
    onSave({ ...initialData, ...formData, price: priceAsNumber });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
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
        <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
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
        <label className="block text-sm font-medium text-gray-700">Categoría</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
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
        <label htmlFor="available" className="ml-2 block text-sm text-gray-900">Disponible</label>
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

// --- Componente Principal Admin ---
const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dishes, setDishes] = useState([]);
  const [dishData, setDishData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("entradas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Nueva función: Cargar los platos del servidor (READ)
  const fetchDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo conectar con la API de Django.`);
      }
      const data = await response.json();
      setDishes(data); 
    } catch (err) {
      console.error("Error al cargar los platos:", err);
      setError("No se pudieron cargar los datos. Asegúrate de que el servidor de Django esté corriendo.");
      setDishes([]); // Limpia la lista si hay error
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDishes();
  }, []); 

  // --- Lógica CRUD Adaptada a la API ---

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
    // Cuando editamos, queremos que el formulario tenga los datos correctos
    setDishData(dish);
  };

  const handleSave = async (data) => {
    setDishData(null);

    const method = data.id ? 'PUT' : 'POST';
    // Para PUT y DELETE en Django, la URL debe terminar en /id/
    const url = data.id ? `${API_URL}${data.id}/` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json' 
        },
        // Enviamos el objeto 'data' completo
        body: JSON.stringify(data), 
      });

      if (!response.ok) {
        throw new Error(`Fallo al ${data.id ? 'actualizar' : 'crear'} el plato.`);
      }
      
      // Tras el éxito, recargamos la lista desde el servidor para reflejar el cambio
      fetchDishes(); 
    } catch (err) {
      console.error(err);
      alert(`Error al guardar: ${err.message}. Revisa la consola.`);
    }
  };

  const handleDelete = async (dishId) => {
    const confirmation = window.confirm(
      `¿Estás seguro que quieres eliminar el plato con ID ${dishId}?`
    );
    if (!confirmation) return;

    try {
      const response = await fetch(`${API_URL}${dishId}/`, {
        method: 'DELETE',
      });

      if (response.status !== 204) { // Django DELETE retorna 204 (No Content)
        throw new Error(`Fallo al eliminar el plato. Código: ${response.status}`);
      }
      
      fetchDishes(); // Recarga la lista
      setDishData(null);
    } catch (err) {
      console.error(err);
      alert(`Error al eliminar: ${err.message}. Revisa la consola.`);
    }
  };

  // Función de navegación: ahora simplemente navega ya que la fuente de verdad es la API
  const applyChangesToMenu = () => {
     navigate("/menu", { 
         state: { tableId: location.state?.tableId || "X" }
     });
  };

  // --- Renderizado y Optimización ---
  const dishCounts = dishes.reduce((acc, dish) => {
    acc[dish.category] = (acc[dish.category] || 0) + 1;
    return acc;
  }, {});

  const filteredDishes = dishes.filter((d) => d.category === activeCategory);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-red-800">Panel de Administración</h1>
        <div className="flex space-x-3">
          <button
            onClick={applyChangesToMenu}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Ver Menú Cliente
          </button>
          <button
            onClick={handleCreateNew}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            + Nuevo Plato
          </button>
        </div>
      </header>

      {/* Mensajes de Estado */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 border-l-4 border-red-500 font-semibold">{error}</div>
      )}
      {loading && (
        <div className="p-4 text-center text-blue-600 font-semibold">Cargando platos del servidor...</div>
      )}

      {/* Formulario de Creación/Edición */}
      {dishData && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">
            {dishData.id ? `Editar Plato ID: ${dishData.id}` : "Crear Nuevo Plato"}
          </h2>
          <DishForm
            initialData={dishData}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setDishData(null)}
          />
        </div>
      )}

      {/* Navegación por Categorías */}
      {!loading && !error && (
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
              {cat.name} ({dishCounts[cat.id] || 0})
            </button>
          ))}
        </nav>
      )}

      {/* Listado de Platos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {!loading && filteredDishes.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">
            {error ? 'No se pudo cargar la lista.' : 'No hay platos en esta categoría.'}
          </p>
        )}
        {!loading && filteredDishes.map((dish) => (
          <MenuItem
            key={dish.id}
            dish={dish}
            isAdmin={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default Admin;