import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// CONFIGURACIÓN DE ENTORNO
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE}/facturas`;
const API_PEDIDOS = `${API_BASE}/pedidos`;
const API_MESAS = `${API_BASE}/mesas`;

const METODOS_PAGO = [
  { id: "EFECTIVO", label: "Efectivo", icon: "💵" },
  { id: "TARJETA", label: "Tarjeta", icon: "💳" },
  { id: "PAGO_MOVIL", label: "Pago Móvil", icon: "📱" },
  { id: "ZELLE", label: "Zelle", icon: "🔄" },
];

const GenerarFactura = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [listaPedidos, setListaPedidos] = useState([]);
  const [errors, setErrors] = useState({});

  const [formPago, setFormPago] = useState({
    pedidoId: "",
    impuesto: 0,
    descuento: 0,
    metodoPago: "EFECTIVO",
    referencia: "",
  });

  const [requiereFactura, setRequiereFactura] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    cedula: "",
    nombre: "",
    direccion: "",
    telefono: "",
  });

  // --- CARGA DE PEDIDOS ---
  const obtenerPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    try {
      const response = await axios.get(`${API_PEDIDOS}/?estado=POR_FACTURAR`);
      if (Array.isArray(response.data)) {
        const pedidosPorCobrar = response.data.filter(p => p.estado_pedido === "POR_FACTURAR");
        setListaPedidos(pedidosPorCobrar);
      }
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setMessage({ type: "error", text: "Error cargando pedidos pendientes." });
    } finally {
      setLoadingPedidos(false);
    }
  }, []);

  useEffect(() => {
    obtenerPedidos();
  }, [obtenerPedidos]);

  // --- CÁLCULOS ---
  const totalPagar = useMemo(() => {
    if (!formPago.pedidoId) return "0.00";
    const pedido = listaPedidos.find(p => String(p.id) === String(formPago.pedidoId));
    
    const base = pedido?.CostoTotal ? parseFloat(pedido.CostoTotal) : 0;
    const tax = parseFloat(formPago.impuesto) || 0;
    const disc = parseFloat(formPago.descuento) || 0;

    const total = Math.max(0, base + tax - disc); 
    return total.toFixed(2);
  }, [formPago.pedidoId, formPago.impuesto, formPago.descuento, listaPedidos]);

  // --- HANDLERS ---
  const handleFormChange = (e) => {
    setFormPago({ ...formPago, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleClienteChange = (e) => {
    setDatosCliente({ ...datosCliente, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleProcesarPago = async () => {
    setLoading(true);
    setMessage(null);
    const newErrors = {};

    if (!formPago.pedidoId) newErrors.pedidoId = "Seleccione un pedido.";
    if (formPago.metodoPago !== "EFECTIVO" && (!formPago.referencia || formPago.referencia.length < 6)) {
      newErrors.referencia = "Referencia incompleta (min 6).";
    }
    if (requiereFactura) {
      if (!datosCliente.cedula.trim()) newErrors.cedula = "Cédula requerida.";
      if (!datosCliente.nombre.trim()) newErrors.nombre = "Nombre requerido.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      setMessage({ type: "error", text: "Por favor corrija los errores marcados." });
      return;
    }

    const payload = {
      pedido_id: parseInt(formPago.pedidoId, 10),
      metodo_pago: formPago.metodoPago,
      impuesto: parseFloat(formPago.impuesto) || 0,
      descuento: parseFloat(formPago.descuento) || 0,
      referencia_pago: formPago.referencia,
      cliente_nombre: requiereFactura ? datosCliente.nombre : "Consumidor Final",
      cliente_cedula: requiereFactura ? datosCliente.cedula : "0",
      cliente_direccion: requiereFactura ? datosCliente.direccion : "N/A",
      cliente_telefono: requiereFactura ? datosCliente.telefono : "N/A",
    };

    try {
      await axios.post(`${API_URL}/`, payload);
      const pedido = listaPedidos.find(p => String(p.id) === String(formPago.pedidoId));
      if (pedido?.mesa_id) {
        await axios.patch(`${API_MESAS}/${pedido.mesa_id}/`, { estado: true });
      }

      setSuccess(true);
      setMessage({ type: "success", text: "¡Cobro registrado exitosamente!" });
      
      setTimeout(() => {
        setSuccess(false);
        setFormPago(prev => ({ ...prev, pedidoId: "", impuesto: 0, descuento: 0, referencia: "" }));
        setRequiereFactura(false);
        setDatosCliente({ cedula: "", nombre: "", direccion: "", telefono: "" });
        setErrors({});
        setMessage(null);
        obtenerPedidos();
      }, 2500);

    } catch (error) {
      console.error("Error facturando:", error);
      setMessage({ type: "error", text: "Error al procesar la factura." });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center min-h-[60vh] animate-bounce-in">
        <div className="bg-green-100 p-8 rounded-full mb-6 text-6xl shadow-inner" aria-hidden="true">✅</div>
        <h2 className="text-3xl font-black text-gray-800">¡Pago Aprobado!</h2>
        <p className="text-gray-500 mt-2">La factura se ha guardado y la mesa liberada.</p>
      </div>
    );
  }

  return (
    // MAIN: Indica que este es el contenido principal de la página
    <main className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <section className="lg:col-span-2 space-y-6" aria-labelledby="billing-title">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-red-600">
            
            <header className="flex justify-between items-center mb-6">
              <h2 id="billing-title" className="text-2xl font-black text-gray-800 flex items-center gap-2">
                💰 Caja y Facturación
              </h2>
              <button 
                onClick={() => navigate("/orders")} 
                className="text-sm font-bold text-gray-500 hover:text-red-600 transition"
                aria-label="Volver a la gestión de pedidos"
              >
                ⬅ Volver
              </button>
            </header>

            {/* SELECCIÓN DE PEDIDO */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
               <InputField 
                 type="select"
                 label="Pedido a Cobrar"
                 name="pedidoId"
                 id="pedidoId" // ID explícito
                 value={formPago.pedidoId}
                 onChange={handleFormChange}
                 error={errors.pedidoId}
                 options={listaPedidos.map(p => ({
                   value: p.id,
                   label: `Pedido #${p.id} - Mesa ${p.mesa_id || 'Barra'} ($${p.CostoTotal})`
                 }))}
                 placeholder={loadingPedidos ? "Cargando..." : "-- Seleccione Pedido --"}
                 disabled={loadingPedidos}
                 className="text-lg font-bold"
                 required // Semántica HTML5
               />
            </div>

            {/* IMPUESTOS Y DESCUENTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                type="number" 
                label="Impuesto Adicional ($)" 
                name="impuesto" 
                id="impuesto"
                value={formPago.impuesto} 
                onChange={handleFormChange}
                placeholder="0.00"
                min="0"
              />
              <InputField 
                type="number" 
                label="Descuento ($)" 
                name="descuento" 
                id="descuento"
                value={formPago.descuento} 
                onChange={handleFormChange} 
                className="text-green-600 font-bold"
                placeholder="0.00"
                min="0"
              />
            </div>

            {/* TOTAL GIGANTE - LIVE REGION */}
            {/* aria-live="polite": Anuncia el cambio de precio sin interrumpir al usuario */}
            <div 
              className="bg-gray-900 text-white p-6 rounded-2xl text-center shadow-lg my-6 transform transition-transform hover:scale-[1.01]"
              role="status" 
              aria-live="polite"
              aria-label="Total neto a pagar calculado"
            >
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-1" aria-hidden="true">Total Neto a Pagar</p>
              <p className="text-5xl font-black tracking-tight">${totalPagar}</p>
            </div>

            {/* MÉTODOS DE PAGO - RADIOGROUP */}
            <div role="radiogroup" aria-labelledby="payment-method-label">
                <label id="payment-method-label" className="block text-sm font-bold text-gray-700 capitalize mb-2">
                    Método de Pago
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {METODOS_PAGO.map((metodo) => {
                    const isSelected = formPago.metodoPago === metodo.id;
                    return (
                    <button
                        key={metodo.id}
                        type="button" // Evita submit accidental
                        role="radio"  // Semántica de opción única
                        aria-checked={isSelected}
                        aria-label={`Pagar con ${metodo.label}`}
                        onClick={() => setFormPago({ ...formPago, metodoPago: metodo.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                        isSelected
                            ? "border-red-600 bg-red-50 text-red-700 font-bold shadow-md"
                            : "border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                        <span className="text-2xl mb-1" aria-hidden="true">{metodo.icon}</span>
                        <span className="text-xs">{metodo.label}</span>
                    </button>
                    );
                })}
                </div>
            </div>

            {/* REFERENCIA */}
            {formPago.metodoPago !== "EFECTIVO" && (
              <InputField 
                label="Referencia de Pago"
                name="referencia"
                id="referencia"
                value={formPago.referencia}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, ""); 
                  setFormPago({ ...formPago, referencia: val });
                  if(errors.referencia) setErrors({...errors, referencia: null});
                }}
                error={errors.referencia}
                placeholder="Ej: 994821"
                maxLength={20}
                aria-required="true" // Indica que es obligatorio en este contexto
              />
            )}

            <MessageAlert msg={message} />
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <aside className="lg:col-span-1" aria-labelledby="fiscal-data-title">
          <div className={`p-6 rounded-2xl shadow-lg border-2 transition-colors duration-300 ${requiereFactura ? 'bg-white border-blue-500' : 'bg-gray-100 border-dashed border-gray-300'}`}>
            
            <div className="flex justify-between items-center mb-6">
              <h3 id="fiscal-data-title" className="font-bold text-gray-700 flex gap-2 items-center">
                📄 Datos Fiscales
              </h3>
              
              {/* SWITCH ACCESIBLE */}
              <label className="flex items-center cursor-pointer relative">
                <span className="sr-only">Habilitar Factura Fiscal</span>
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={requiereFactura} 
                    onChange={() => setRequiereFactura(!requiereFactura)} 
                    role="switch" 
                    aria-checked={requiereFactura}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {!requiereFactura ? (
              <div className="text-center py-12 text-gray-400 opacity-60" aria-hidden="true">
                <p className="text-5xl mb-2">👤</p>
                <p className="font-medium">Consumidor Final</p>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <InputField 
                  label="Cédula / RIF" 
                  name="cedula" 
                  id="cedula"
                  value={datosCliente.cedula} 
                  onChange={handleClienteChange} 
                  error={errors.cedula}
                  placeholder="V-12345678"
                  required
                />
                <InputField 
                  label="Nombre / Razón Social" 
                  name="nombre" 
                  id="nombre"
                  value={datosCliente.nombre} 
                  onChange={handleClienteChange} 
                  error={errors.nombre}
                  required
                />
                <InputField 
                  label="Dirección" 
                  name="direccion" 
                  id="direccion"
                  value={datosCliente.direccion} 
                  onChange={handleClienteChange} 
                />
                <InputField 
                  label="Teléfono" 
                  name="telefono" 
                  id="telefono"
                  type="tel"
                  value={datosCliente.telefono} 
                  onChange={handleClienteChange} 
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleProcesarPago}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-xl shadow-lg transition-transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center gap-2"
                aria-label={loading ? "Procesando pago, por favor espere" : "Confirmar pago y generar factura"}
              >
                {loading ? "Procesando..." : "CONFIRMAR PAGO ✅"}
              </button>
            </div>

          </div>
        </aside>

      </div>
    </main>
  );
};

export default GenerarFactura;