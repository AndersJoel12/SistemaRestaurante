import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
// Asegúrate de que las rutas sean correctas según tu estructura
import MessageAlert from "../components/MessageAlert.jsx";
import Header from "../components/Header.jsx";
import NavBar from "../components/Navigation.jsx";

// 1. CONFIGURACIÓN ROBUSTA
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE}/facturas`;

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta Débito/Crédito" },
  { value: "PAGO_MOVIL", label: "Pago Móvil" },
  { value: "ZELLE", label: "Zelle" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const ESTADOS_FACTURA = [
  { value: "PAGADO", label: "Pagado" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ANULADO", label: "Anulado" },
];

// --- HELPERS ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(amount) || 0);
};

const formatDate = (fecha, hora) => {
  if (!fecha) return "---";
  const formattedTime = hora ? hora.substring(0, 5) : "";
  return `${fecha} ${formattedTime}`;
};

const getEstadoClass = (state) => {
  const map = {
    PAGADO: "bg-green-100 text-green-700 border border-green-200",
    ANULADO: "bg-red-100 text-red-700 border border-red-200",
    PENDIENTE: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  };
  return map[state] || "bg-gray-100 text-gray-700";
};

// -------------------------------------------------------------------
// --- MODAL ACCESIBLE ---
// -------------------------------------------------------------------
const FacturaEditModal = ({
  editingItem,
  setEditingItem,
  handleFormChange,
  handleSave,
  loading,
  message,
}) => {
  if (!editingItem) return null;

  return (
    // ACCESIBILIDAD: Backdrop con rol de dialogo
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={() => setEditingItem(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-red-600 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="text-center mb-6">
            <h2 id="modal-title" className="text-2xl font-black text-gray-800">
            📝 Editar Factura
            </h2>
            <p id="modal-desc" className="text-gray-500 font-mono text-sm mt-1">
            {editingItem.numero_factura || `ID Interno: ${editingItem.id}`}
            </p>
        </header>

        {message && <div className="mb-4"><MessageAlert msg={message} /></div>}

        <div className="bg-yellow-50 p-4 text-sm text-yellow-800 rounded-lg mb-6 border border-yellow-200 flex gap-2 items-start" role="note">
          <span aria-hidden="true">⚠️</span>
          <p>Solo puedes modificar el <strong>Método de Pago</strong> y el <strong>Estado</strong> por razones de seguridad fiscal.</p>
        </div>

        <form className="space-y-5">
          {/* Datos Informativos (Read Only) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Cliente
              </label>
              <input
                type="text"
                value={editingItem.cliente_nombre || "N/A"}
                disabled
                className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-gray-600 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Cédula
              </label>
              <input
                type="text"
                value={editingItem.cliente_cedula || "---"}
                disabled
                className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-gray-600 cursor-not-allowed font-medium text-center"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-4 font-bold text-gray-700 border-b border-gray-200 pb-2">
              <span>Total Factura:</span>
              <span className="text-lg">{formatCurrency(editingItem.totalFactura)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="metodo_pago" className="block text-sm font-bold text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  id="metodo_pago"
                  name="metodo_pago"
                  value={editingItem.metodo_pago}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none bg-white transition-shadow"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-bold text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="state"
                  name="state"
                  value={editingItem.state}
                  onChange={handleFormChange}
                  className={`w-full border border-gray-300 p-2.5 rounded-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-red-500 ${getEstadoClass(editingItem.state)}`}
                >
                  {ESTADOS_FACTURA.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              {loading ? "💾 Guardando..." : "✅ Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// --- VISTA PRINCIPAL ---
// -------------------------------------------------------------------

const GestionFacturacion = () => {
  const [message, setMessage] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // --- CARGA DE DATOS ---
  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.get(`${API_URL}/`);
      if (Array.isArray(response.data)) {
        // Ordenamos por fecha descendente (lo más nuevo primero)
        const sorted = response.data.sort((a, b) => b.id - a.id);
        setFacturas(sorted);
      } else {
        setFacturas([]);
      }
    } catch (error) {
      console.error("🔴 Error Fetch:", error);
      setMessage({
        type: "error",
        text: "Error de conexión con el servidor de facturación.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // --- IMPRESIÓN ---
  const handleImprimir = (factura) => {
    if (!factura) return;

    const subtotal = parseFloat(factura.subtotal || 0);
    const total = parseFloat(factura.totalFactura || 0);
    const descuento = parseFloat(factura.descuento || 0);
    const impuesto = (total - subtotal + descuento).toFixed(2);
    const metodoLabel = METODOS_PAGO.find((m) => m.value === factura.metodo_pago)?.label || factura.metodo_pago;

    const ventana = window.open("", "PRINT", "height=600,width=400");
    if (!ventana) {
      alert("Por favor habilita las ventanas emergentes para imprimir.");
      return;
    }

    ventana.document.write(`
        <html>
        <head>
          <title>Ticket #${factura.numero_factura || factura.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
            .header, .footer { text-align: center; }
            .header { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .totals { text-align: right; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .watermark { text-align: center; font-size: 9px; color: #666; margin: 5px 0; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">REST. DATTEBAYO</h2>
            <p style="margin:2px 0;">RIF: J-12345678-9</p>
          </div>
          <div class="watermark">** REIMPRESIÓN **</div>
          
          <p><strong>Ticket:</strong> ${factura.numero_factura || factura.id}</p>
          <p><strong>Fecha:</strong> ${factura.fecha_emision}</p>
          <p><strong>Cliente:</strong> ${factura.cliente_nombre}</p>
          <p><strong>CI/RIF:</strong> ${factura.cliente_cedula}</p>

          <div class="totals">
            <p>Subtotal: $${subtotal.toFixed(2)}</p>
            <p>Impuesto: $${impuesto}</p>
            <p>Descuento: -$${descuento.toFixed(2)}</p>
            <p class="total-row">TOTAL: ${formatCurrency(total)}</p>
            <p>Pago: ${metodoLabel}</p>
          </div>
          
          <div class="footer" style="margin-top:20px;">
            <p>¡Gracias por su visita!</p>
          </div>
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 500);
  };

  // --- FILTROS ---
  const filteredFacturas = useMemo(() => {
    return facturas.filter((f) => {
      const term = searchTerm.toLowerCase().trim();
      const matchText = 
        (f.cliente_nombre || "").toLowerCase().includes(term) ||
        (f.cliente_cedula || "").toLowerCase().includes(term) ||
        (f.numero_factura || "").toLowerCase().includes(term) ||
        String(f.id).includes(term);
      
      const matchState = filterEstado === "" || f.state === filterEstado;
      return matchText && matchState;
    });
  }, [facturas, searchTerm, filterEstado]);

  // --- HANDLERS FORMULARIO ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!editingItem || loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        metodo_pago: editingItem.metodo_pago,
        state: editingItem.state,
      };
      // PATCH al backend
      const response = await axios.patch(`${API_URL}/${editingItem.id}/`, payload);
      
      // Actualización Optimista en Local
      setFacturas((prev) =>
        prev.map((f) => (f.id === editingItem.id ? { ...f, ...response.data } : f))
      );

      setMessage({ type: "success", text: "Factura actualizada exitosamente." });
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating:", error);
      setMessage({ type: "error", text: "Error al guardar los cambios." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-24">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ENCABEZADO DE SECCIÓN */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            {/* ALERTAS GLOBALES */}
            <div className="w-full md:w-auto">
                {!editingItem && <MessageAlert msg={message} />}
            </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-3/4">
                <div className="relative w-full sm:w-1/2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar cliente, CI o Factura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                        aria-label="Campo de búsqueda"
                    />
                </div>
                <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="w-full sm:w-1/3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                    aria-label="Filtrar por estado"
                >
                    <option value="">Todos los Estados</option>
                    {ESTADOS_FACTURA.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={fetchFacturas}
                disabled={loading}
                className="w-full lg:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors flex items-center justify-center gap-2"
                aria-label="Recargar lista de facturas"
            >
                <span className={`${loading ? 'animate-spin' : ''}`}>↻</span> Recargar
            </button>
        </div>

        {/* TABLA ACCESIBLE */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">N° Factura</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Método</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && filteredFacturas.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-10 text-center text-gray-500 animate-pulse">
                                    Cargando registros...
                                </td>
                            </tr>
                        ) : filteredFacturas.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic">
                                    No se encontraron facturas.
                                </td>
                            </tr>
                        ) : (
                            filteredFacturas.map((factura) => (
                                <tr key={factura.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-gray-600">
                                        {factura.numero_factura || `#${factura.id}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{factura.cliente_nombre || "Consumidor Final"}</div>
                                        <div className="text-xs text-gray-500">{factura.cliente_cedula}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(factura.fecha_emision, factura.hora_emision)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-800">
                                        {formatCurrency(factura.totalFactura)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-semibold text-gray-500">
                                        {factura.metodo_pago}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getEstadoClass(factura.state)}`}>
                                            {ESTADOS_FACTURA.find(e => e.value === factura.state)?.label || factura.state}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        <button 
                                            onClick={() => handleImprimir(factura)}
                                            className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
                                            title="Imprimir copia"
                                            aria-label={`Imprimir factura ${factura.numero_factura}`}
                                        >
                                            <span aria-hidden="true" className="text-lg">🖨️</span>
                                        </button>
                                        <button 
                                            onClick={() => { setMessage(null); setEditingItem(factura); }}
                                            className="text-blue-400 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                                            title="Editar factura"
                                            aria-label={`Editar factura ${factura.numero_factura}`}
                                        >
                                            <span aria-hidden="true" className="text-lg">✏️</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </main>

      {/* MODAL */}
      <FacturaEditModal
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        handleFormChange={handleFormChange}
        handleSave={handleSave}
        loading={loading}
        message={message}
      />

      <NavBar />
    </div>
  );
};

export default GestionFacturacion;
