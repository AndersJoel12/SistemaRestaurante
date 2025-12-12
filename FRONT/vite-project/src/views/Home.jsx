import "../views/ViewStyles.css";
import Logo from "../assets/logo.png";
import { useState, useRef } from "react";
import SignUpModal from "../components/ModalFormSignUp";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

function Home() {
  const [showModal, setShowModal] = useState(false); // Modal Staff
  const [showGuestModal, setShowGuestModal] = useState(false); // Modal Cliente
  
  const navigate = useNavigate();
  const guestCaptchaRef = useRef(null);

  // --- LÓGICA DE REDIRECCIÓN (STAFF) ---
  const getRedirectPath = (role) => {
    const normalizedRole = (role || "").toLowerCase();
    switch (normalizedRole) {
      case "administrador": return "/manage-users";
      case "cocinero": return "/kitchen";
      case "mesero": return "/tables";
      default: return "/unauthorized";
    }
  };

  const handleLoginSuccess = (role) => {
    setShowModal(false);
    if (role) {
      navigate(getRedirectPath(role));
    } else {
      navigate("/unauthorized");
    }
  };

  // --- LÓGICA CLIENTE ---
  const openGuestOrderModal = () => {
    setShowGuestModal(true);
  };

  const handleGuestCaptchaResolved = (token) => {
    if (token) {
        setTimeout(() => {
            const dummyTable = {
                id: 999,
                number: "999",
                capacity: 1,
                status: "virtual",
            };
            sessionStorage.setItem("mesa_activa", JSON.stringify(dummyTable));
            setShowGuestModal(false);
            navigate("/menu");
        }, 500);
    }
  };

  const closeGuestModal = () => {
      setShowGuestModal(false);
      if(guestCaptchaRef.current) guestCaptchaRef.current.reset();
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div
        className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center border-t-8 border-red-700 relative"
        role="main"
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
          Bienvenido a
          <span className="text-4xl sm:text-5xl font-black text-red-700 block mt-1">
            Dattebayo
          </span>
        </h1>

        <p className="text-gray-500 mb-6 text-sm sm:text-base">
          Sistema de Gestión de Restaurante
        </p>

        <img
          src={Logo}
          alt="Logo Dattebayo"
          className="mx-auto mb-8 w-32 sm:w-40 h-auto object-contain transition-transform duration-500 hover:scale-105"
        />

        <div className="flex flex-col gap-4 text-center">
          <button
            onClick={openGuestOrderModal}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-yellow-500 to-red-600 text-white font-extrabold text-lg sm:text-xl rounded-xl shadow-lg shadow-red-300/50 hover:shadow-red-500/70 hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer active:scale-95 border-b-4 border-yellow-700"
          >
            <span className="mr-3 text-2xl">🛒</span>
            <span>Realizar Pedido</span>
          </button>

          <div className="text-gray-400 font-bold uppercase text-xs pt-1">O</div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-3 text-red-600 font-semibold text-base rounded-xl border-2 border-red-100 hover:bg-red-50 transition-colors duration-300 cursor-pointer shadow-sm active:shadow-inner"
          >
            <span className="mr-2 text-xl">🧑‍🍳</span>
            <span>Acceso de Personal</span>
          </button>
        </div>

        <span className="block text-xs text-gray-400 mt-6">
          Desarrollo y Soporte por <span className="font-semibold text-red-600 ml-1">DeliGo</span>
        </span>
      </div>

      <SignUpModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 👉 MODAL DE CAPTCHA ACTUALIZADO */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center relative border-t-4 border-red-600 transform transition-all scale-100">
            
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                Seguridad
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Confirma que eres humano para ver el menú.
            </p>

            <div className="flex justify-center mb-6">
                <ReCAPTCHA
                    ref={guestCaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={handleGuestCaptchaResolved}
                />
            </div>
            
            {/* 👉 BOTÓN CANCELAR ROJO */}
            <button
                onClick={closeGuestModal}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 hover:shadow-lg transition-all duration-300 active:scale-95 uppercase tracking-wide text-sm"
            >
                Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;