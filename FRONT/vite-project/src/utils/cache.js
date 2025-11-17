// --- CLAVES DE CACHÉ ---
export const PLATO_KEY = "admin_platos";
export const USUARIO_KEY = "admin_usuarios";

// --- DATOS INICIALES (Simulados) ---
// (Los he movido aquí para que todo esté junto)
export const initialPlatos = [
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
export const initialUsuarios = [
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
];

// --- FUNCIONES DE PERSISTENCIA (Cache) ---

export const loadData = (key, initialData) => {
  const savedData = localStorage.getItem(key);
  // Si no hay datos guardados, retorna los iniciales.
  if (!savedData) return initialData;

  const parsedData = JSON.parse(savedData);
  return parsedData;
};

export const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};