import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:8000/api/facturas'; 

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
const [message, setMessage] = useState(null);
const [facturas, setFacturas] = useState([]);
const [editingItem, setEditingItem] = useState(null);
const [loading, setLoading] = useState(false);

const [searchTerm, setSearchTerm] = useState("");
const [filterEstado, setFilterEstado] = useState("");

// --- 1. CARGA DE DATOS ---
const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
    const response = await axios.get(`${API_URL}/`);
    console.log("🟢 [FETCH] Facturas cargadas:", response.data);
    setFacturas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
    console.error("🔴 [FETCH] Error:", error);
    setMessage({ type: "error", text: "No se pudo cargar el historial." });
    } finally {
    setLoading(false);
    }
}, []);

useEffect(() => {
    fetchFacturas();
}, [fetchFacturas]);

// --- HELPERS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// --- 2. FUNCIÓN DE REIMPRESIÓN (TICKET) ---
const handleImprimir = (factura) => {
    if (!factura) return;

    const ventanaImpresion = window.open('', 'PRINT', 'height=600,width=400');
    
    ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Reimpresión Ticket #${factura.id}</title>
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
            <div class="title">RESTAURANTE DEMO</div>
            <div>Rif: J-12345678-9</div>
            <div>Av. Principal, Ciudad</div>
            </div>
            
            <div class="watermark">*** COPIA REIMPRESA ***</div>

            <div class="info">
            <div><strong>Factura N°:</strong> ${factura.id}</div>
            <div><strong>Fecha Original:</strong> ${formatDate(factura.created_at)}</div>
            <div><strong>Cliente:</strong> ${factura.cliente_nombre}</div>
            <div><strong>CI/RIF:</strong> ${factura.cliente_cedula || '---'}</div>
            </div>

            ${factura.estado === 'ANULADO' ? '<div class="status">*** ANULADO ***</div>' : ''}

            <div class="totals">
            <!-- Si tu backend trae detalles, se pueden iterar aquí -->
            <div>Impuesto: $${parseFloat(factura.impuesto || 0).toFixed(2)}</div>
            <div>Descuento: -$${parseFloat(factura.descuento || 0).toFixed(2)}</div>
            <div class="total-row">TOTAL: $${parseFloat(factura.total).toFixed(2)}</div>
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

// --- 3. FILTRADO ---
const filteredFacturas = useMemo(() => {
    return facturas.filter((factura) => {
    const term = searchTerm.toLowerCase();
    const cliente = (factura.cliente_nombre || "").toLowerCase();
    const cedula = (factura.cliente_cedula || "").toLowerCase();
    const idFactura = String(factura.id);

    const matchesSearch = cliente.includes(term) || cedula.includes(term) || idFactura.includes(term);
    const matchesEstado = filterEstado === "" || factura.estado === filterEstado;
    return matchesSearch && matchesEstado;
    });
}, [facturas, searchTerm, filterEstado]);

// --- 4. HANDLERS ---
const handleFormChange = (arg1, arg2) => {
    let name, value;
    if (arg1 && arg1.target) {
        name = arg1.target.name;
        value = arg1.target.value;
    } else {
        name = arg1;
        value = arg2;
    }
    setEditingItem((prev) => ({ ...prev, [name]: value }));
};

const openModal = (item) => {
    setMessage(null);
    if (item) {
    setEditingItem({
        id: item.id,
        // Nota: Algunos campos son read-only en el backend, pero los mostramos para referencia
        cliente_nombre: item.cliente_nombre || "",
        cliente_cedula: item.cliente_cedula || "",
        total: item.total || 0,
        metodo_pago: item.metodo_pago || "EFECTIVO",
        estado: item.estado || "PAGADO",
        observaciones: item.observaciones || "",
    });
    }
};

const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
        // En el historial, generalmente solo editamos ESTADO u OBSERVACIONES
        // El resto de datos fiscales no deberían cambiarse después de emitir.
        const payload = {
            metodo_pago: editingItem.metodo_pago,
            estado: editingItem.estado,
            observaciones: editingItem.observaciones,
            // Enviamos cliente también por si acaso se permite corregir un error tipográfico
            cliente_nombre: editingItem.cliente_nombre,
            cliente_cedula: editingItem.cliente_cedula,
        };

        const response = await axios.patch(`${API_URL}/${editingItem.id}/`, payload);
        setFacturas(prev => prev.map(f => f.id === editingItem.id ? response.data : f));
        setMessage({ type: "success", text: "Factura actualizada correctamente." });
        
        setEditingItem(null);
    } catch (error) {
        console.error("🔴 Error save:", error);
        setMessage({ type: "error", text: "Error al actualizar la factura." });
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

    {/* FILTROS */}
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
            <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
                Editar Factura #{editingItem.id}
            </h2>
            
            <div className="bg-yellow-50 p-3 text-xs text-yellow-800 rounded mb-4 border border-yellow-200">
                ⚠️ Estás editando un documento ya emitido. Solo modifica datos si es estrictamente necesario.
            </div>

            <div className="space-y-4">
            <div className="flex gap-4">
                <div className="w-2/3"><InputField label="Cliente" name="cliente_nombre" value={editingItem.cliente_nombre} onChange={handleFormChange} /></div>
                <div className="w-1/3"><InputField label="Cédula" name="cliente_cedula" value={editingItem.cliente_cedula} onChange={handleFormChange} /></div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2 font-bold text-gray-700 border-b pb-2">
                    <span>Total Original:</span>
                    <span>{formatCurrency(editingItem.total)}</span>
                </div>
                
                <div className="flex gap-4 mt-3">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                        <select name="metodo_pago" value={editingItem.metodo_pago} onChange={handleFormChange} className="w-full border p-2 rounded-md focus:ring-red-500">
                            {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select name="estado" value={editingItem.estado} onChange={handleFormChange} 
                            className={`w-full border p-2 rounded-md font-bold ${
                                editingItem.estado === 'ANULADO' ? 'text-red-600 bg-red-50' : 'text-gray-800'
                            }`}
                        >
                            {ESTADOS_FACTURA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <InputField label="Observaciones / Motivo de cambio" name="observaciones" value={editingItem.observaciones} onChange={handleFormChange} />
            
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
            <th className="py-3 px-6 text-center w-20">N°</th>
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
            <tr><td colSpan="7" className="text-center py-8 text-gray-500">No hay facturas registradas.</td></tr>
            ) : (
            filteredFacturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-6 text-center font-mono text-gray-500">#{factura.id}</td>
                <td className="py-3 px-6 text-left">
                    <div className="font-bold text-gray-800">{factura.cliente_nombre}</div>
                    <div className="text-xs text-gray-400">{factura.cliente_cedula || "S/C"}</div>
                </td>
                <td className="py-3 px-6 text-left text-xs">{formatDate(factura.created_at)}</td>
                <td className="py-3 px-6 text-right font-bold text-lg text-gray-800">
                    {formatCurrency(factura.total)}
                </td>
                <td className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase">
                    {factura.metodo_pago}
                </td>
                <td className="py-3 px-6 text-center">
                    <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                        factura.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 
                        factura.estado === 'ANULADO' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {factura.estado}
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
                        Detalles
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