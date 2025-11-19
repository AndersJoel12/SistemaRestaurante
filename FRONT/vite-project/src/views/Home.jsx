import "../views/ViewStyles.css";
import Logo from "../assets/logo.png";
import { useState } from "react";
import SignUpModal from "../components/ModalFormSignUp";

function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-700 mb-4">
          Bienvenido a <span className="text-yellow-500">Dattebayo</span>
        </h1>

        <img
          src={Logo}
          alt="Logo Restaurante"
          className="mx-auto mb-6 w-full max-w-xs object-contain"
        />

        <div className="space-y-6 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 hover:from-yellow-600 hover:to-red-700 transition-transform duration-300 ease-in-out cursor-pointer"
          >
            <span className="mr-3 text-xl">🔒</span>
            <span>Iniciar Sesión</span>
          </button>

          <span className="block text-sm text-gray-500">
            by <span className="font-semibold text-red-600">DeliGo</span>
          </span>
        </div>
      </div>

      <SignUpModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default Home;
