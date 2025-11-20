import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/facturas'; 

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

const GestionFacturacion = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // --- 1. CARGA DE DATOS ---
  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
        const response = await axios.get(`${API_URL}/`);
        console.log("🟢 [FETCH] Facturas cargadas:", response.data);
        
        if (Array.isArray(response.data)) {
            setFacturas(response.data);
        } else {
            console.warn("⚠️ La respuesta no es un array:", response.data);
            setFacturas([]);
        }
    } catch (error) {
        console.error("🔴 [FETCH] Error:", error);
        setMessage({ type: "error", text: "No se pudo cargar el historial de facturas." });
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // --- HELPERS ---
  const formatCurrency = (amount) => {
    // Usamos parseFloat para asegurar que sea número
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount) || 0);
  };

  const formatDate = (fecha, hora) => {
    if (!fecha) return "---";
    // Si tienes fecha y hora separadas, las unimos visualmente
    return `${fecha} ${hora ? hora.substring(0, 5) : ''}`;
  };

  // --- 2. FUNCIÓN DE REIMPRESIÓN (TICKET) ---
  const handleImprimir = (factura) => {
    if (!factura) return;

    const ventanaImpresion = window.open('', 'PRINT', 'height=600,width=400');
    
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
            .status { text-align: center; font-weight: bold; margin: 5px 0; }
            .watermark { text-align: center; font-size: 10px; color: #666; margin-top: 5px; border: 1px solid #ccc; padding: 2px;}
            </style>
        </head>
        <body>
            <div class="header">
            <div class="title">REST. DATTEBAYO</div>
            <div>Rif: J-12345678-9</div>
            <div>Av. Principal, Ciudad</div>
            </div>
            
            <div class="watermark">*** COPIA REIMPRESA ***</div>

            <div class="info">
            <div><strong>Factura:</strong> ${factura.numero_factura || factura.id}</div>
            <div><strong>Fecha:</strong> ${factura.fecha_emision}</div>
            <div><strong>Cliente:</strong> ${factura.cliente_nombre}</div>
            <div><strong>CI/RIF:</strong> ${factura.cliente_cedula || '---'}</div>
            </div>

            ${factura.state === 'ANULADO' ? '<div class="status">*** ANULADO ***</div>' : ''}

            <div class="totals">
            <div>Subtotal: $${parseFloat(factura.subtotal || 0).toFixed(2)}</div>
            <div>Impuesto: $${(parseFloat(factura.totalFactura) - parseFloat(factura.subtotal) + parseFloat(factura.descuento || 0)).toFixed(2)}</div>
            <div>Descuento: -$${parseFloat(factura.descuento || 0).toFixed(2)}</div>
            <div class="total-row">TOTAL: $${parseFloat(factura.totalFactura).toFixed(2)}</div>
            <br/>
            <div>Método: ${factura.metodo_pago}</div>
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
    }, 500);
  };

  // --- 3. FILTRADO INTELIGENTE ---
  const filteredFacturas = useMemo(() => {
    return facturas.filter((factura) => {
        const term = searchTerm.toLowerCase();
        
        // Datos a comparar
        const cliente = (factura.cliente_nombre || "").toLowerCase();
        const cedula = (factura.cliente_cedula || "").toLowerCase();
        const numFactura = (factura.numero_factura || "").toLowerCase();
        const idSimple = String(factura.id);

        const matchesSearch = cliente.includes(term) || cedula.includes(term) || numFactura.includes(term) || idSimple.includes(term);
        
        // Nota: Tu backend usa 'state', el filtro usa 'filterEstado'
        const matchesEstado = filterEstado === "" || factura.state === filterEstado;
        
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
            
            // Campos Editables
            metodo_pago: item.metodo_pago || "EFECTIVO",
            state: item.state || "PAGADO", // Ojo: 'state' según backend
            
            // Campos Informativos (Read Only en UI)
            cliente_nombre: item.cliente_nombre || "",
            cliente_cedula: item.cliente_cedula || "",
            totalFactura: item.totalFactura || 0,
        });
    }
  };

  // Guardar cambios (PATCH)
  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
        // Preparamos SOLO lo que se permite editar
        const payload = {
            metodo_pago: editingItem.metodo_pago,
            state: editingItem.state,
            // Si tu backend permite editar cliente, descomenta esto:
            // cliente_nombre: editingItem.cliente_nombre,
            // cliente_cedula: editingItem.cliente_cedula,
        };

        const response = await axios.patch(`${API_URL}/${editingItem.id}/`, payload);
        
        // Actualizamos la lista local sin recargar todo
        setFacturas(prev => prev.map(f => f.id === editingItem.id ? response.data : f));
        
        setMessage({ type: "success", text: "Factura actualizada correctamente." });
        setEditingItem(null);

    } catch (error) {
        console.error("🔴 Error save:", error);
        setMessage({ type: "error", text: "Error al actualizar. Verifica permisos." });
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
    
    <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-yellow-400">Historial de Facturación</h1>
        {loading && <span className="text-sm animate-pulse font-medium bg-red-900 px-3 py-1 rounded-full">Cargando...</span>}
    </div>

    {!editingItem && <MessageAlert msg={message} />}

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
            <option value="">Todos los Estados</option>
            {ESTADOS_FACTURA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        </div>
    </div>

    {/* MODAL EDICIÓN */}
    {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={() => setEditingItem(null)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-t-4 border-red-500" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-1 text-gray-700 text-center">
                Editar Factura
            </h2>
            <p className="text-center text-gray-500 mb-4 font-mono text-sm">{editingItem.numero_factura || `ID: ${editingItem.id}`}</p>
            
            <div className="bg-yellow-50 p-3 text-xs text-yellow-800 rounded mb-4 border border-yellow-200">
                ⚠️ Estás editando un documento ya emitido.
            </div>

            <div className="space-y-4">
            {/* Datos Informativos */}
            <div className="flex gap-4">
                <div className="w-2/3">
                    <label className="block text-xs font-bold text-gray-500">Cliente</label>
                    <input type="text" value={editingItem.cliente_nombre} disabled className="w-full bg-gray-100 border p-2 rounded text-gray-600" />
                </div>
                <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-500">Cédula</label>
                    <input type="text" value={editingItem.cliente_cedula} disabled className="w-full bg-gray-100 border p-2 rounded text-gray-600" />
                </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2 font-bold text-gray-700 border-b pb-2">
                    <span>Total Factura:</span>
                    <span>{formatCurrency(editingItem.totalFactura)}</span>
                </div>
                
                <div className="flex gap-4 mt-3">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select name="metodo_pago" value={editingItem.metodo_pago} onChange={handleFormChange} className="w-full border p-2 rounded-md focus:ring-red-500">
                            {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select name="state" value={editingItem.state} onChange={handleFormChange} 
                            className={`w-full border p-2 rounded-md font-bold ${
                                editingItem.state === 'ANULADO' ? 'text-red-600 bg-red-50' : 'text-gray-800'
                            }`}
                        >
                            {ESTADOS_FACTURA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="button" onClick={handleSave} disabled={loading} className="px-6 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800">
                    {loading ? "..." : "Guardar Cambios"}
                </button>
            </div>
            </div>
        </div>
        </div>
    )}

    {/* TABLA DE HISTORIAL */}
    <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
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
            <tr><td colSpan="7" className="text-center py-8 text-gray-500">No hay facturas registradas o encontradas.</td></tr>
            ) : (
            filteredFacturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-6 text-center font-mono text-gray-600 font-bold">
                    {factura.numero_factura || `#${factura.id}`}
                </td>
                <td className="py-3 px-6 text-left">
                    <div className="font-bold text-gray-800">{factura.cliente_nombre}</div>
                    <div className="text-xs text-gray-400">{factura.cliente_cedula || "S/C"}</div>
                </td>
                <td className="py-3 px-6 text-left text-xs">
                    {formatDate(factura.fecha_emision, factura.hora_emision)}
                </td>
                <td className="py-3 px-6 text-right font-bold text-lg text-gray-800">
                    {/* CORRECCIÓN: Usar totalFactura */}
                    {formatCurrency(factura.totalFactura)}
                </td>
                <td className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase">
                    {factura.metodo_pago}
                </td>
                <td className="py-3 px-6 text-center">
                    <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                        factura.state === 'PAGADO' ? 'bg-green-100 text-green-700' : 
                        factura.state === 'ANULADO' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {factura.state}
                    </span>
                </td>
                <td className="py-3 px-6 text-center space-x-3">
                    <button 
                        onClick={() => handleImprimir(factura)} 
                        className="text-gray-600 hover:text-gray-900 text-xl" 
                        title="Reimprimir Ticket"
                    >
                        🖨️
                    </button>
                    
                    <button onClick={() => openModal(factura)} className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Editar
                    </button>
                </td>
                </tr>
            ))
            )}
        </tbody>
        </table>
    </div>
    </div>
  );
};

export default GestionFacturacion;