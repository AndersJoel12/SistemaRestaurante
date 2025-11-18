// --- DATOS BASE DEL MENÚ (Copia de seguridad si no hay caché) ---
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
  
  const categories = [
    { id: "entradas", name: "ENTRADAS" },
    { id: "sushi", name: "SUSHI" },
    { id: "bebidas", name: "BEBIDAS" },
    { id: "postre", name: "POSTRE" },
  ];