// src/App.jsx
import React from "react";
import TablesGrid from "../components/TableGrid";
function App() {
  const handleNavigateToMenu = (tableNumber, numPersonas) => {
    console.log(
      `Navegando al menú de la mesa ${tableNumber} para ${numPersonas} personas...`
    );
    // Aquí podrías usar React Router:
    // navigate("/menu", { state: { mesa: tableNumber, personas: numPersonas } });
  };

  return (
    <div>
      <TablesGrid onNavigateToMenu={handleNavigateToMenu} />
    </div>
  );
}

export default App;
