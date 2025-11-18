import React, { useState } from "react";
import MessageAlert from "../components/MessageAlert.jsx";
import GestionMenu from "../views/ManageMenu.jsx";
import GestionUsuarios from "../views/ManageUsers.jsx";

const Admin = () => {
  // --- ESTADOS DE UI (Contenedor) ---
  const [activeTab, setActiveTab] = useState("menu");
  const [message, setMessage] = useState(null);

  // --- RENDER PRINCIPAL ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-md">
      <h1 className="text-4xl font-extrabold text-red-800">
        Panel de Administración
      </h1>
       {/* Los botones de "Crear" y "Aplicar" se movieron a sus módulos */}
      </header>

       {/* El componente de mensajes vive aquí, en el padre */}
        <MessageAlert msg={message} />

      {/* PESTAÑAS (Botones de Navegación) */}
        <nav className="flex space-x-8 bg-red-800 text-white p-3 rounded-t-xl mb-6 shadow-lg">
        {["menu", "usuarios"].map((tab) => (
          <button
          key={tab}
            onClick={() => {
              setActiveTab(tab);
               setMessage(null); // Limpia mensajes al cambiar de pestaña
            }}
            className={`px-6 py-2 text-xl font-bold transition-colors uppercase ${
              activeTab === tab
                ? "bg-yellow-400 text-red-900 rounded-md shadow-inner"
                : "hover:bg-red-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* --- RENDERIZADO CONDICIONAL DE MÓDULOS --- */}
      {/*          Aquí está la magia: le pasamos la función 'setMessage' 
         a los hijos para que puedan poner mensajes en el padre.
      */}
      {activeTab === "menu" && <GestionMenu setMessage={setMessage} />}
      {activeTab === "usuarios" && <GestionUsuarios setMessage={setMessage} />}
    </div>
  );
};

export default Admin;