import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
// Asumiendo que estos componentes existen
import MessageAlert from "../components/MessageAlert.jsx";
import Header from "../components/Header.jsx";
import NavBar from "../components/Navigation.jsx";

// --- CONFIGURACIÓN ---
const API_URL = "http://localhost:8000/api/facturas";

// Opciones para selectores
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

// --- HELPERS (Funciones Reutilizables) ---

/**
 * Formatea un monto numérico a formato de moneda USD.
 * @param {number|string} amount - El monto a formatear.
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(amount) || 0);
};

/**
 * Formatea la fecha y hora para visualización en la tabla.
 * @param {string} fecha - La fecha de emisión (e.g., "YYYY-MM-DD").
 * @param {string} hora - La hora de emisión (e.g., "HH:MM:SS").
 */
const formatDate = (fecha, hora) => {
  if (!fecha) return "---";
  const formattedTime = hora ? hora.substring(0, 5) : "";
  return `${fecha} ${formattedTime}`;
};

/**
 * Retorna las clases de Tailwind CSS para el estado de la factura.
 * @param {string} state - El estado de la factura (PAGADO, PENDIENTE, ANULADO).
 */
const getEstadoClass = (state) => {
  switch (state) {
    case "PAGADO":
      return "bg-green-100 text-green-700";
    case "ANULADO":
      return "bg-red-100 text-red-700";
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// -------------------------------------------------------------------
// --- COMPONENTE MODAL DE EDICIÓN (EXTRAÍDO) ---
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
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      onClick={() => setEditingItem(null)}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-t-4 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-1 text-gray-700 text-center">
          📝 Editar Factura
        </h2>
        <p className="text-center text-gray-500 mb-4 font-mono text-sm">
          {editingItem.numero_factura || `ID: ${editingItem.id}`}
        </p>

        {message && <MessageAlert msg={message} />}

        <div className="bg-yellow-50 p-3 text-xs text-yellow-800 rounded mb-4 border border-yellow-200">
          ⚠️ Estás editando un documento ya emitido. Solo se pueden cambiar el
          **Método de Pago** y el **Estado**.
        </div>

        <div className="space-y-4">
          {/* Datos Informativos */}
          <div className="flex gap-4">
            <div className="w-2/3">
              <label className="block text-xs font-bold text-gray-500">
                Cliente
              </label>
              <input
                type="text"
                value={editingItem.cliente_nombre || "N/A"}
                disabled
                className="w-full bg-gray-100 border p-2 rounded text-gray-600 cursor-not-allowed"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold text-gray-500">
                Cédula
              </label>
              <input
                type="text"
                value={editingItem.cliente_cedula || "---"}
                disabled
                className="w-full bg-gray-100 border p-2 rounded text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-2 font-bold text-gray-700 border-b pb-2">
              <span>Total Factura:</span>
              <span>{formatCurrency(editingItem.totalFactura)}</span>
            </div>

            <div className="flex gap-4 mt-3">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  name="metodo_pago"
                  value={editingItem.metodo_pago}
                  onChange={handleFormChange}
                  className="w-full border p-2 rounded-md focus:ring-red-500 bg-white"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="state"
                  value={editingItem.state}
                  onChange={handleFormChange}
                  className={`w-full border p-2 rounded-md font-bold bg-white ${getEstadoClass(
                    editingItem.state
                  )}`}
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "💾 Guardando..." : "✅ Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL ---
// -------------------------------------------------------------------

const GestionFacturacion = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // --- 1. CARGA DE DATOS (useEffect + useCallback) ---
  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    setMessage(null); // Limpiar mensaje de alerta
    try {
      const response = await axios.get(`${API_URL}/`);
      console.log("🟢 [FETCH] Facturas cargadas:", response.data.length);

      if (Array.isArray(response.data)) {
        setFacturas(response.data);
      } else {
        console.warn("⚠️ La respuesta no es un array:", response.data);
        setFacturas([]);
      }
    } catch (error) {
      console.error("🔴 [FETCH] Error:", error);
      setMessage({
        type: "error",
        text: "No se pudo cargar el historial de facturas. Verifique el servidor.",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Dependencias vacías, solo se crea una vez

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]); // Se ejecuta al montar y cuando fetchFacturas cambia (nunca cambia)

  // --- 2. FUNCIÓN DE REIMPRESIÓN (TICKET) ---
  const handleImprimir = (factura) => {
    if (!factura) return;

    // Calcular impuesto (asumiendo que subtotal, descuento, y totalFactura están presentes)
    const subtotal = parseFloat(factura.subtotal || 0);
    const total = parseFloat(factura.totalFactura || 0);
    const descuento = parseFloat(factura.descuento || 0);
    // Impuesto = Total - Subtotal + Descuento (Si el subtotal no incluye impuestos y el total sí)
    const impuesto = (total - subtotal + descuento).toFixed(2);

    // Función para obtener el nombre del método de pago
    const metodoLabel =
      METODOS_PAGO.find((m) => m.value === factura.metodo_pago)?.label ||
      factura.metodo_pago;

    const ventanaImpresion = window.open("", "PRINT", "height=600,width=400");
    if (!ventanaImpresion) {
      alert("La ventana de impresión fue bloqueada por el navegador.");
      return;
    }

    ventanaImpresion.document.write(`
        <html>
        <head>
          <title>Ticket #${factura.numero_factura || factura.id}</title>
          <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .title { font-size: 16px; font-weight: bold; }
          .info { margin-bottom: 10px; line-height: 1.4; }
          .totals { text-align: right; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          .status { text-align: center; font-weight: bold; margin: 5px 0; padding: 5px; border: 2px solid red; color: red;}
          .watermark { text-align: center; font-size: 10px; color: #666; margin-top: 5px; border: 1px solid #ccc; padding: 2px;}
          </style>
        </head>
        <body>
          <div class="header">
          <div class="title">REST. DATTEBAYO</div>
          <div>Rif: J-12345678-9</div>
          <div>Av. Principal, Ciudad</div>
          </div>
          
          <div class="watermark">*** COPIA REIMPRESA ${new Date().toLocaleString()} ***</div>

          <div class="info">
          <div><strong>Factura:</strong> ${
            factura.numero_factura || factura.id
          }</div>
          <div><strong>Fecha:</strong> ${factura.fecha_emision}</div>
          <div><strong>Hora:</strong> ${
            factura.hora_emision ? factura.hora_emision.substring(0, 5) : "---"
          }</div>
          <div><strong>Cliente:</strong> ${
            factura.cliente_nombre || "Consumidor Final"
          }</div>
          <div><strong>CI/RIF:</strong> ${
            factura.cliente_cedula || "V-00000000"
          }</div>
          </div>

          ${
            factura.state === "ANULADO"
              ? '<div class="status">*** ANULADO ***</div>'
              : ""
          }

          <div class="totals">
          <div>Subtotal: $${subtotal.toFixed(2)}</div>
          <div>Impuesto: $${impuesto}</div>
          <div>Descuento: -$${descuento.toFixed(2)}</div>
          <div class="total-row">TOTAL: ${formatCurrency(total)}</div>
          <br/>
          <div>Método: ${metodoLabel}</div>
          </div>

          <div class="footer">
          <p>¡Gracias por su preferencia!</p>
          </div>
        </body>
        </html>
    `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => {
      ventanaImpresion.print();
      ventanaImpresion.close();
    }, 500); // Pequeña espera para asegurar que el contenido esté cargado antes de imprimir
  };

  // --- 3. FILTRADO INTELIGENTE (useMemo) ---
  const filteredFacturas = useMemo(() => {
    return facturas.filter((factura) => {
      const term = searchTerm.toLowerCase().trim();

      // Comparación de campos
      const cliente = (factura.cliente_nombre || "").toLowerCase();
      const cedula = (factura.cliente_cedula || "").toLowerCase();
      const numFactura = (factura.numero_factura || "").toLowerCase();
      const idSimple = String(factura.id);

      const matchesSearch =
        cliente.includes(term) ||
        cedula.includes(term) ||
        numFactura.includes(term) ||
        idSimple.includes(term);

      // Filtrado por estado
      const matchesEstado =
        filterEstado === "" || factura.state === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [facturas, searchTerm, filterEstado]);

  // --- 4. HANDLERS EDICIÓN ---

  // Manejo de inputs en el modal
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir modal con los datos correctos
  const openModal = (item) => {
    setMessage(null);
    if (item) {
      setEditingItem({
        id: item.id,
        numero_factura: item.numero_factura, // Visual
        // Campos Editables (con valores por defecto si son nulos)
        metodo_pago: item.metodo_pago || METODOS_PAGO[0].value,
        state: item.state || ESTADOS_FACTURA[0].value, // Ojo: 'state' según backend
        // Campos Informativos (Read Only en UI)
        cliente_nombre: item.cliente_nombre || "Consumidor Final",
        cliente_cedula: item.cliente_cedula || "V-00000000",
        totalFactura: item.totalFactura || 0,
      });
    }
  };

  // Guardar cambios (PATCH)
  const handleSave = async () => {
    if (!editingItem || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      // Preparamos SOLO lo que se permite editar
      const payload = {
        metodo_pago: editingItem.metodo_pago,
        state: editingItem.state,
      };

      const response = await axios.patch(
        `${API_URL}/${editingItem.id}/`,
        payload
      );

      // Actualizamos la lista local sin recargar todo
      setFacturas((prev) =>
        prev.map((f) => (f.id === editingItem.id ? response.data : f))
      );

      setMessage({
        type: "success",
        text: `Factura N° ${
          editingItem.numero_factura || editingItem.id
        } actualizada correctamente.`,
      });
      setEditingItem(null); // Cerrar modal al guardar
    } catch (error) {
      console.error("🔴 Error save:", error);
      setMessage({
        type: "error",
        text: "Error al actualizar. Verifique la conexión o sus permisos.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <Header />

      {/* Indicador de Carga */}
      <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Historial de Facturación 🧾</h1>
        {loading && (
          <span className="text-sm animate-pulse font-medium bg-red-900 px-3 py-1 rounded-full">
            ⏳ Cargando...
          </span>
        )}
      </div>

      {/* Alerta de Mensajes */}
      <div className="mb-4">
        {!editingItem && <MessageAlert msg={message} />}
      </div>

      {/* BARRA DE FILTROS */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input
            type="text"
            placeholder="🔍 Buscar por Cliente, Cédula o N° Factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Todos los Estados --</option>
            {ESTADOS_FACTURA.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        {/* Botón de recarga añadido */}
        <button
          onClick={fetchFacturas}
          className="w-full md:w-auto px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          disabled={loading}
          title="Recargar Facturas"
        >
          🔄 Recargar
        </button>
      </div>

      {/* MODAL EDICIÓN */}
      <FacturaEditModal
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        handleFormChange={handleFormChange}
        handleSave={handleSave}
        loading={loading}
        message={message}
      />

      {/* TABLA DE HISTORIAL */}
      {/* Se mantiene la clase overflow-x-auto para el scroll horizontal en móviles */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-xs sm:text-sm leading-normal">
              <th className="py-3 px-6 text-center w-32">N° Factura</th>
              <th className="py-3 px-6 text-left">Cliente</th>
              <th className="py-3 px-6 text-left">Fecha</th>
              <th className="py-3 px-6 text-right">Total</th>
              <th className="py-3 px-6 text-center">Método</th>
              <th className="py-3 px-6 text-center">Estado</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
            {filteredFacturas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  {loading
                    ? "Cargando facturas..."
                    : "📭 No hay facturas registradas o no se encontraron resultados."}
                </td>
              </tr>
            ) : (
              filteredFacturas.map((factura) => (
                <tr
                  key={factura.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-6 text-center font-mono text-gray-600 font-bold whitespace-nowrap">
                    {factura.numero_factura || `#${factura.id}`}
                  </td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <div className="font-bold text-gray-800">
                      {factura.cliente_nombre || "Consumidor Final"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {factura.cliente_cedula || "S/C"}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-left text-xs whitespace-nowrap">
                    {formatDate(factura.fecha_emision, factura.hora_emision)}
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-lg text-gray-800 whitespace-nowrap">
                    {/* Se asegura el uso de totalFactura */}
                    {formatCurrency(factura.totalFactura)}
                  </td>
                  <td className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {factura.metodo_pago}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-bold whitespace-nowrap ${getEstadoClass(
                        factura.state
                      )}`}
                    >
                      {ESTADOS_FACTURA.find((e) => e.value === factura.state)
                        ?.label || factura.state}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => handleImprimir(factura)}
                      className="text-gray-600 hover:text-gray-900 text-xl p-1"
                      title="Reimprimir Ticket"
                    >
                      🖨️
                    </button>

                    <button
                      onClick={() => openModal(factura)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium p-1"
                      title="Editar Método de Pago o Estado"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <NavBar />
    </div>
  );
};

export default GestionFacturacion;
