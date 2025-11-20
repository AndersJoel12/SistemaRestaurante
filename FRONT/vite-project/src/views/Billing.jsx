import React, { useState } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ArrowRightLeft, 
  FileText, 
  User, 
  CheckCircle 
} from "lucide-react"; // Usamos íconos si tienes lucide-react, si no, texto simple.

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/facturacion'; 

const METODOS_PAGO = [
    { id: "EFECTIVO", label: "Efectivo", icon: <Banknote className="w-6 h-6" /> },
    { id: "TARJETA", label: "Tarjeta (Punto)", icon: <CreditCard className="w-6 h-6" /> },
    { id: "PAGO_MOVIL", label: "Pago Móvil", icon: <Smartphone className="w-6 h-6" /> },
    { id: "ZELLE", label: "Zelle", icon: <ArrowRightLeft className="w-6 h-6" /> },
];

const GenerarFactura = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  
  // Lógica de Facturación Opcional
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
      cedula: "",
      nombre: "",
      direccion: "",
      telefono: ""
  });

  // --- HANDLERS ---
  const handleClienteChange = (e) => {
      setDatosCliente({ ...datosCliente, [e.target.name]: e.target.value });
  };

  const handleProcesarPago = async () => {
      setLoading(true);
      setMessage(null);

      // 1. Validaciones de Pago
      if (monto <= 0) {
          setMessage({ type: "error", text: "El monto debe ser mayor a 0." });
          setLoading(false);
          return;
      }
      if (metodoPago !== "EFECTIVO" && !referencia.trim()) {
          setMessage({ type: "error", text: "Debes ingresar el número de referencia para pagos electrónicos." });
          setLoading(false);
          return;
      }

      // 2. Validaciones de Facturación (Solo si está activo)
      if (requiereFactura) {
          if (!datosCliente.cedula.trim() || !datosCliente.nombre.trim()) {
              setMessage({ type: "error", text: "Para facturar, Cédula y Nombre son obligatorios." });
              setLoading(false);
              return;
          }
      }

      // 3. Preparar Payload
      const payload = {
          total: parseFloat(monto),
          metodo_pago: metodoPago,
          referencia_pago: referencia,
          estado: "PAGADO",
          
          // Si requiere factura, enviamos los datos. Si no, enviamos "Consumidor Final"
          cliente_nombre: requiereFactura ? datosCliente.nombre : "Consumidor Final",
          cliente_cedula: requiereFactura ? datosCliente.cedula : "0",
          cliente_direccion: requiereFactura ? datosCliente.direccion : "",
          es_factura_fiscal: requiereFactura
      };

      console.log("🚀 Procesando Pago:", payload);

      try {
          const response = await axios.post(`${API_URL}/`, payload);
          console.log("✅ Éxito:", response.data);
          setSuccess(true);
          setMessage({ type: "success", text: "¡Pago procesado y factura generada exitosamente!" });
          
          // Reset parcial para siguiente venta
          setTimeout(() => {
              setSuccess(false);
              setMonto(0);
              setReferencia("");
              setRequiereFactura(false);
              setDatosCliente({ cedula: "", nombre: "", direccion: "", telefono: "" });
              setMessage(null);
          }, 3000);

      } catch (error) {
          console.error("🔴 Error:", error);
          setMessage({ type: "error", text: "Error al procesar el pago. Intente nuevamente." });
      } finally {
          setLoading(false);
      }
  };

  // --- VISTA DE ÉXITO ---
  if (success) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in-down">
              <div className="bg-green-100 p-6 rounded-full mb-4">
                  <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h2>
              <p className="text-gray-600 mb-6 text-lg">La factura se ha generado correctamente.</p>
              <button 
                  onClick={() => setSuccess(false)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition"
              >
                  Nueva Operación
              </button>
          </div>
      );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex justify-center">
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DETALLES DEL PAGO */}
        <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-600">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    💰 Detalles del Pago
                </h2>
                
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Monto a Pagar ($)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                        <input 
                            type="number" 
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 text-4xl font-extrabold text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-3">Método de Pago</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {METODOS_PAGO.map((metodo) => (
                            <button
                                key={metodo.id}
                                onClick={() => setMetodoPago(metodo.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                                    metodoPago === metodo.id 
                                    ? "border-red-600 bg-red-50 text-red-700 shadow-md scale-105" 
                                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div className="mb-2">{metodo.icon || "💳"}</div>
                                <span className="text-xs font-bold">{metodo.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campo condicional para Referencia (si no es efectivo) */}
                {metodoPago !== "EFECTIVO" && (
                    <div className="animate-fade-in-up">
                        <InputField 
                            label={`Número de Referencia / Recibo (${metodoPago})`}
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            placeholder="Ej: 123456..."
                        />
                    </div>
                )}
            </div>

            {/* ALERTA DE ERRORES AQUI */}
            <MessageAlert msg={message} />
            
        </div>

        {/* COLUMNA DERECHA: DATOS DE FACTURACIÓN */}
        <div className="lg:col-span-1">
            <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 ${requiereFactura ? "bg-white border-blue-500" : "bg-gray-50 border-gray-200"}`}>
                
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Facturación
                    </h2>
                    
                    {/* SWITCH TOGGLE */}
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={requiereFactura}
                            onChange={() => setRequiereFactura(!requiereFactura)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {!requiereFactura ? (
                    <div className="text-center py-8 text-gray-400">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Consumidor Final</p>
                        <p className="text-xs">No se requieren datos fiscales.</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4 border border-blue-100">
                            Ingrese los datos fiscales del cliente.
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Cédula / RIF *</label>
                            <input 
                                type="text" 
                                name="cedula"
                                value={datosCliente.cedula}
                                onChange={handleClienteChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="V-12345678"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Razón Social / Nombre *</label>
                            <input 
                                type="text" 
                                name="nombre"
                                value={datosCliente.nombre}
                                onChange={handleClienteChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nombre Completo"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Dirección Fiscal</label>
                            <textarea 
                                name="direccion"
                                value={datosCliente.direccion}
                                onChange={handleClienteChange}
                                rows="2"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Dirección..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                            <input 
                                type="tel" 
                                name="telefono"
                                value={datosCliente.telefono}
                                onChange={handleClienteChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0414-..."
                            />
                        </div>
                    </div>
                )}

                {/* BOTÓN FINAL DE PROCESAR */}
                <div className="mt-8 border-t pt-6">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-gray-500 font-medium">Total a Pagar:</span>
                        <span className="text-3xl font-extrabold text-gray-800">${parseFloat(monto || 0).toFixed(2)}</span>
                    </div>
                    
                    <button 
                        onClick={handleProcesarPago}
                        disabled={loading || monto <= 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2
                            ${loading || monto <= 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                : "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200"
                            }`}
                    >
                        {loading ? (
                            <span>Procesando...</span>
                        ) : (
                            <>
                                <CheckCircle className="w-6 h-6" />
                                Confirmar Pago
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default GenerarFactura;