import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom"; // Hook de navegación
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/facturas'; 
const API_PEDIDOS = 'http://localhost:8000/api/pedidos'; 
const API_MESAS = 'http://localhost:8000/api/mesas';

// Emojis para métodos de pago
const METODOS_PAGO = [
    { id: "EFECTIVO", label: "Efectivo", icon: "💵" },
    { id: "TARJETA", label: "Tarjeta (Punto)", icon: "💳" },
    { id: "PAGO_MOVIL", label: "Pago Móvil", icon: "📱" },
    { id: "ZELLE", label: "Zelle", icon: "🔄" },
];

const GenerarFactura = () => {
  const navigate = useNavigate();

  // --- ESTADOS UI ---
  const [loading, setLoading] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false); 
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [listaPedidos, setListaPedidos] = useState([]);

  // Estado del formulario
  const [formPago, setFormPago] = useState({
      pedidoId: "",
      impuesto: 0,
      descuento: 0,
      metodoPago: "EFECTIVO",
      referencia: ""
  });

  // Estado para datos del cliente
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
      cedula: "", nombre: "", direccion: "", telefono: ""
  });

  // --- 1. CARGA DE PEDIDOS ---
  const obtenerPedidos = useCallback(async () => {
      setLoadingPedidos(true);
      try {
          const response = await axios.get(`${API_PEDIDOS}/?estado=PREPARADO`);
          
          if (Array.isArray(response.data)) {
              setListaPedidos(response.data);
              if (response.data.length === 0) {
                  setFormPago(prev => ({ ...prev, pedidoId: "" }));
              }
          }
      } catch (error) {
          console.error("Error al cargar pedidos:", error);
          setMessage({ type: "error", text: "Error de conexión al buscar pedidos." });
      } finally {
          setLoadingPedidos(false);
      }
  }, []);

  useEffect(() => {
      obtenerPedidos();
  }, [obtenerPedidos]);

  // --- 2. CÁLCULOS AUTOMÁTICOS ---
  const totalPagar = useMemo(() => {
      if (!formPago.pedidoId) return "0.00";
      
      const pedidoSeleccionado = listaPedidos.find(p => p.id.toString() === formPago.pedidoId);
      const costoBase = pedidoSeleccionado ? parseFloat(pedidoSeleccionado.CostoTotal) : 0;
      
      const impuesto = parseFloat(formPago.impuesto) || 0;
      const descuento = parseFloat(formPago.descuento) || 0;

      return (costoBase + impuesto - descuento).toFixed(2);
  }, [formPago.pedidoId, formPago.impuesto, formPago.descuento, listaPedidos]);

  // --- 3. VALIDACIONES ---
  const esReferenciaValida = 
      formPago.metodoPago === "EFECTIVO" || 
      (formPago.referencia && formPago.referencia.length >= 6);

  // --- HANDLERS ---

  const handleSeleccionarPedido = (e) => {
      setFormPago({ ...formPago, pedidoId: e.target.value });
  };

  const handleFormChange = (e) => {
      setFormPago({ ...formPago, [e.target.name]: e.target.value });
  };

  const handleReferenciaChange = (e) => {
      let valorInput = "";
      if (e && e.target && typeof e.target.value !== 'undefined') {
          valorInput = e.target.value;
      } else if (e) {
          valorInput = String(e);
      }
      const soloNumeros = valorInput.replace(/[^0-9]/g, '');
      setFormPago(prev => ({ ...prev, referencia: soloNumeros }));
  };

  const handleClienteChange = (e) => {
      setDatosCliente({ ...datosCliente, [e.target.name]: e.target.value });
  };

  // 🔥 LÓGICA DE PROCESAMIENTO
  const handleProcesarPago = async () => {
      setLoading(true);
      setMessage(null);

      if (!formPago.pedidoId) {
          setMessage({ type: "error", text: "Debes seleccionar un Pedido." });
          setLoading(false);
          return;
      }
      if (!esReferenciaValida) {
          setMessage({ type: "error", text: "Referencia incompleta (mínimo 6 dígitos)." });
          setLoading(false);
          return;
      }
      if (requiereFactura) {
          if (!datosCliente.cedula.trim() || !datosCliente.nombre.trim()) {
              setMessage({ type: "error", text: "Cédula y Nombre son obligatorios." });
              setLoading(false);
              return;
          }
      }

      const pedidoActual = listaPedidos.find(p => p.id === parseInt(formPago.pedidoId));
      const mesaIdALiberar = pedidoActual ? pedidoActual.mesa_id : null;

      const payload = {
          pedido_id: parseInt(formPago.pedidoId, 10),
          metodo_pago: formPago.metodoPago,
          impuesto: parseFloat(formPago.impuesto) || 0,
          descuento: parseFloat(formPago.descuento) || 0,
          referencia_pago: formPago.referencia, 
          cliente_nombre: requiereFactura ? datosCliente.nombre : "Consumidor Final",
          cliente_cedula: requiereFactura ? datosCliente.cedula : "0",
          cliente_direccion: requiereFactura ? datosCliente.direccion : "",
          cliente_telefono: requiereFactura ? datosCliente.telefono : ""
      };

      try {
          await axios.post(`${API_URL}/`, payload);
          
          if (mesaIdALiberar) {
              try {
                  await axios.patch(`${API_MESAS}/${mesaIdALiberar}/`, { estado: true });
                  console.log(`✅ Mesa ${mesaIdALiberar} liberada.`);
              } catch (errorMesa) {
                  console.error("⚠️ Error liberando mesa:", errorMesa);
              }
          }

          setSuccess(true);
          setMessage({ type: "success", text: "¡Factura generada y Mesa liberada!" });
          
          setListaPedidos(prev => prev.filter(p => p.id !== parseInt(formPago.pedidoId)));
          
          setTimeout(() => {
              setSuccess(false);
              setFormPago({
                  pedidoId: "", impuesto: 0, descuento: 0, metodoPago: "EFECTIVO", referencia: ""
              });
              setRequiereFactura(false);
              setDatosCliente({ cedula: "", nombre: "", direccion: "", telefono: "" });
              setMessage(null);
              obtenerPedidos(); 
          }, 3000);

      } catch (error) {
          console.error("Error al procesar pago:", error);
          const errData = error.response?.data;
          let errorMsg = "Error de conexión o servidor.";
          if (errData && typeof errData === 'object') {
              const values = Object.values(errData);
              errorMsg = Array.isArray(values[0]) ? values[0][0] : values[0];
          }
          setMessage({ type: "error", text: errorMsg });
      } finally {
          setLoading(false);
      }
  };

  if (success) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in-down">
              <div className="bg-green-100 p-6 rounded-full mb-4 text-4xl">✅</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Factura Generada!</h2>
              <p className="text-gray-600 mb-6 text-lg">El pedido ha sido cerrado y la mesa liberada.</p>
              <button onClick={() => setSuccess(false)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
                  Nueva Factura
              </button>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-600">
                
                {/* 🆕 CABECERA FLEX: TÍTULO A LA IZQ, BOTÓN A LA DER */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        💰 Datos de la Operación
                    </h2>
                    <button 
                        onClick={() => navigate('/pedidos')} 
                        className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-1"
                        title="Regresar a la lista de pedidos"
                    >
                        ⬅️ Volver
                    </button>
                </div>
                
                {/* SELECCIÓN DE PEDIDO */}
                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                            Seleccionar Pedido *
                            <span className={`text-xs px-2 py-1 rounded-full ${listaPedidos.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>
                                {listaPedidos.length} Pendientes
                            </span>
                        </label>
                        <button 
                            onClick={obtenerPedidos}
                            disabled={loadingPedidos}
                            className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-3 py-1 rounded-lg shadow-sm flex items-center gap-1 transition-all"
                        >
                            {loadingPedidos ? <span className="animate-spin">↻</span> : "🔄"} Actualizar
                        </button>
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🛍️</span>
                        <select 
                            name="pedidoId"
                            value={formPago.pedidoId}
                            onChange={handleSeleccionarPedido}
                            disabled={loadingPedidos}
                            className="w-full pl-12 pr-4 py-3 text-lg font-bold text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white appearance-none cursor-pointer disabled:bg-gray-100"
                        >
                            <option value="">
                                {loadingPedidos ? "Cargando pedidos..." : "-- Seleccione un Pedido --"}
                            </option>
                            {listaPedidos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    Pedido #{p.id} {p.mesa_id ? `- Mesa ${p.mesa_id}` : ''} - ${parseFloat(p.CostoTotal).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {listaPedidos.length === 0 && !loadingPedidos && (
                        <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg text-xs font-bold border border-green-200">
                            <span>✨</span>
                            <span>¡Todo al día! No hay pedidos preparados pendientes.</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Impuesto ($)</label>
                        <input type="number" name="impuesto" value={formPago.impuesto} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Descuento ($)</label>
                        <input type="number" name="descuento" value={formPago.descuento} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-green-600 font-semibold" placeholder="0.00" />
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Monto Total a Pagar ($)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                        <input 
                            type="text" 
                            readOnly
                            value={totalPagar}
                            className="w-full pl-10 pr-4 py-4 text-4xl font-extrabold text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors bg-gray-50"
                            placeholder="0.00"
                        />
                    </div>
                    <p className="text-xs text-orange-500 mt-1 font-medium">* El monto se calcula automáticamente.</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-3">Método de Pago</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {METODOS_PAGO.map((metodo) => (
                            <button
                                key={metodo.id}
                                onClick={() => setFormPago({...formPago, metodoPago: metodo.id})}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                                    formPago.metodoPago === metodo.id 
                                    ? "border-red-600 bg-red-50 text-red-700 shadow-md scale-105" 
                                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <div className="mb-2 text-2xl">{metodo.icon}</div>
                                <span className="text-xs font-bold">{metodo.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {formPago.metodoPago !== "EFECTIVO" && (
                    <div className="animate-fade-in-up">
                        <InputField 
                            label={
                                <div className="flex justify-between items-center">
                                    <span>🔢 Últimos 6 dígitos (Ref)</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        formPago.referencia.length >= 6 
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-red-100 text-red-600"
                                    }`}>
                                        {formPago.referencia.length}/6
                                    </span>
                                </div>
                            }
                            name="referencia" 
                            value={formPago.referencia} 
                            onChange={handleReferenciaChange}
                            placeholder="Ej: 884291" 
                        />
                        {!esReferenciaValida && (
                            <p className="text-xs text-red-500 mt-1 ml-1 animate-pulse">
                                * Faltan {6 - formPago.referencia.length} dígitos para validar.
                            </p>
                        )}
                    </div>
                )}
            </div>
            <MessageAlert msg={message} />
        </div>

        <div className="lg:col-span-1">
            <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 ${requiereFactura ? "bg-white border-blue-500" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">📄 Cliente</h2>
                    <label className="relative inline-flex items-center cursor-pointer" title="Solicitar Factura Fiscal">
                        <input type="checkbox" className="sr-only peer" checked={requiereFactura} onChange={() => setRequiereFactura(!requiereFactura)} />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {!requiereFactura ? (
                    <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">👤</div>
                        <p className="font-medium">Consumidor Final</p>
                        <p className="text-xs">Datos fiscales genéricos.</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4 border border-blue-100">Datos para factura personalizada.</div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Cédula / RIF *</label><input type="text" name="cedula" value={datosCliente.cedula} onChange={handleClienteChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="V-12345678" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre / Razón Social *</label><input type="text" name="nombre" value={datosCliente.nombre} onChange={handleClienteChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre Completo" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Dirección Fiscal</label><textarea name="direccion" value={datosCliente.direccion} onChange={handleClienteChange} rows="2" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Dirección..." /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label><input type="tel" name="telefono" value={datosCliente.telefono} onChange={handleClienteChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0414-..." /></div>
                    </div>
                )}

                <div className="mt-8 border-t pt-6">
                    <button 
                        onClick={handleProcesarPago} 
                        disabled={loading || !formPago.pedidoId || !esReferenciaValida} 
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 
                            ${loading || !formPago.pedidoId || !esReferenciaValida
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                : "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200"
                            }`}
                    >
                        {loading ? <span>Generando...</span> : <><span>✅</span> Generar Factura</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GenerarFactura;