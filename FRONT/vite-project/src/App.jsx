// src/App.jsx - CÓDIGO CORREGIDO

import { useState } from "react";
// Importaciones que no se usan (se pueden comentar o borrar)
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import Home from "./views/Home.jsx";
import "./App.css";
import Menu from "./views/Menu.jsx"; // Importamos el componente Menu

function App() {
  // El estado 'count' no se usa ahora, pero lo dejamos
  // const [count, setCount] = useState(0);

  return (
    // ⭐️ CORRECCIÓN CLAVE: Retornar el componente Menu
    <Menu />
  );
}

export default App;
