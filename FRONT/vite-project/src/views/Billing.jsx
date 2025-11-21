import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/facturas'; 
const API_PEDIDOS = 'http://localhost:8000/api/pedidos'; 

// Emojis para métodos de pago
const METODOS_PAGO = [
    { id: "EFECTIVO", label: "Efectivo", icon: "💵" },
    { id: "TARJETA", label: "Tarjeta (Punto)", icon: "💳" },
    { id: "PAGO_MOVIL", label: "Pago Móvil", icon: "📱" },
    { id: "ZELLE", label: "Zelle", icon: "🔄" },
];

const GenerarFactura = () => {
  // --- ESTADOS UI ---
  const [loading, setLoading] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false); 
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [listaPedidos, setListaPedidos] = useState([]);

  // Estado unificado del formulario de pago
  const [formPago, setFormPago] = useState({
      pedidoId: "",
      montoVisual: 0, 
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

  // --- 1. FUNCIÓN PARA CARGAR PEDIDOS (OPTIMIZADA) ---
  const obtenerPedidos = useCallback(async () => {
      setLoadingPedidos(true);
      try {
          // 🔧 CORRECCIÓN CRÍTICA:
          // Usamos el filtro del Backend. Solo traemos lo que está 'PREPARADO'.
          const response = await axios.get(`${API_PEDIDOS}/?estado=PREPARADO`);
          
          if (Array.isArray(response.data)) {
              setListaPedidos(response.data);
              
              // Si no hay pedidos listos, limpiamos cualquier selección previa
              if (response.data.length === 0) {
                  setFormPago(prev => ({ ...prev, pedidoId: "", montoVisual: 0 }));
              }
          }
      } catch (error) {
          console.error("Error al cargar pedidos:", error);
          setMessage({ type: "error", text: "Error de conexión al buscar pedidos." });
      } finally {
          setLoadingPedidos(false);
      }
  }, []);

  // --- EFECTO: CARGAR AL INICIO ---
  useEffect(() => {
      obtenerPedidos();
  }, [obtenerPedidos]);

  // --- HANDLERS ---

  const handleSeleccionarPedido = (e) => {
      const idSeleccionado = e.target.value;
      const pedidoEncontrado = listaPedidos.find(p => p.id.toString() === idSeleccionado);
      
      // Convertimos a float para asegurar cálculos matemáticos correctos
      const monto = pedidoEncontrado ? parseFloat(pedidoEncontrado.CostoTotal) : 0;

      setFormPago({
          ...formPago,
          pedidoId: idSeleccionado,
          montoVisual: monto 
      });
  };

  const handleFormChange = (e) => {
      setFormPago({ ...formPago, [e.target.name]: e.target.value });
  };

  const handleClienteChange = (e) => {
      setDatosCliente({ ...datosCliente, [e.target.name]: e.target.value });
  };

  const handleProcesarPago = async () => {
      setLoading(true);
      setMessage(null);

      // Validaciones
      if (!formPago.pedidoId) {
          setMessage({ type: "error", text: "Debes seleccionar un Pedido para facturar." });
          setLoading(false);
          return;
      }
      if (formPago.metodoPago !== "EFECTIVO" && !formPago.referencia.trim()) {
          setMessage({ type: "error", text: "Ingrese la referencia para pagos electrónicos." });
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

      // Payload
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
          
          setSuccess(true);
          setMessage({ type: "success", text: "¡Factura generada y Mesa liberada!" });

          // --- ACTUALIZAR LISTA LOCALMENTE ---
          // Eliminamos el pedido procesado de la lista visualmente para feedback instantáneo
          setListaPedidos(prev => prev.filter(p => p.id !== parseInt(formPago.pedidoId)));
          
          // Reset automático después de 3 segundos
          setTimeout(() => {
              setSuccess(false);
              setFormPago({
                  pedidoId: "", montoVisual: 0, impuesto: 0, descuento: 0, metodoPago: "EFECTIVO", referencia: ""
              });
              setRequiereFactura(false);
              setDatosCliente({ cedula: "", nombre: "", direccion: "", telefono: "" });
              setMessage(null);
              // Volvemos a consultar al servidor para asegurar consistencia
              obtenerPedidos(); 
          }, 3000);

      } catch (error) {
          console.error("Error al procesar pago:", error);
          if (error.response?.data) {
               const errData = error.response.data;
               if (typeof errData === 'object') {
                   const firstKey = Object.keys(errData)[0];
                   const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
                   setMessage({ type: "error", text: `Error en ${firstKey}: ${msg}` });
               } else {
                   setMessage({ type: "error", text: "Error en el servidor." });
               }
          } else {
              setMessage({ type: "error", text: "Error de conexión." });
          }
      } finally {
          setLoading(false);
      }
  };

  // --- VISTA DE ÉXITO ---
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

  // --- VISTA PRINCIPAL ---
  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex justify-center">
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-600">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    💰 Datos de la Operación
                </h2>
                
                {/* SELECCIÓN DE PEDIDO CON BOTÓN DE RECARGA */}
                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                            Seleccionar Pedido *
                            {/* CONTADOR DE PEDIDOS */}
                            <span className={`text-xs px-2 py-1 rounded-full ${listaPedidos.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>
                                {listaPedidos.length} Pendientes
                            </span>
                        </label>
                        
                        {/* BOTÓN DE ACTUALIZAR */}
                        <button 
                            onClick={obtenerPedidos}
                            disabled={loadingPedidos}
                            className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-3 py-1 rounded-lg shadow-sm flex items-center gap-1 transition-all"
                            title="Buscar nuevos pedidos"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                    
                    {listaPedidos.length === 0 && !loadingPedidos && (
                        <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg text-xs font-bold border border-green-200">
                            <span>✨</span>
                            <span>¡Todo al día! No hay pedidos "Preparados" pendientes.</span>
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
                
                {/* MONTO AUTOMÁTICO */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Monto Total a Pagar ($)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                        <input 
                            type="text" 
                            readOnly
                            value={(parseFloat(formPago.montoVisual || 0) + parseFloat(formPago.impuesto || 0) - parseFloat(formPago.descuento || 0)).toFixed(2)}
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
                        <InputField label={`Referencia / Recibo (${formPago.metodoPago})`} name="referencia" value={formPago.referencia} onChange={handleFormChange} placeholder="Ej: 123456..." />
                    </div>
                )}
            </div>
            <MessageAlert msg={message} />
        </div>

        {/* COLUMNA DERECHA: DATOS CLIENTE */}
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
                    <button onClick={handleProcesarPago} disabled={loading || !formPago.pedidoId} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 ${loading || !formPago.pedidoId ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200"}`}>
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