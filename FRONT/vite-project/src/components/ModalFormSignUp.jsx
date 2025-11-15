import React, { useState } from 'react';
import './Components.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
//import * as jwt_decode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';

const LOGIN_URL = 'http://127.0.0.1:8000/token/';

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
    const { loginUser } = useAuth();

    const [username, setUsername]   = useState('');
    const [password, setPassword]   = useState('');
    const [errors, setErrors]       = useState({});
    const [apiError, setApiError]   = useState('');
    const [loading, setLoading]     = useState(false);

    if (isOpen){
        console.log("El modal de inicio de sesión está abierto.");
    } else {
        console.log("El modal de inicio de sesión está cerrado.");
    }

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Formulario de inicio de sesión iniciado.");
        setErrors({});
        setApiError('');

        //Validaciones
        const newErrors = {};
        if (!username.trim()) { newErrors.username = 'El usuario es obligatorio'; }
        if (!password.trim()) { newErrors.password = 'La contraseña es obligatoria'; } 
        else if (password.length < 6) { newErrors.password = 'La contraseña debe tener al menos 6 caracteres'; }
        
        console.log("Validaciones completadas.", newErrors);

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            console.log("Errores de validación encontrados:", newErrors);
            return;
        }

        setLoading(true);
        console.log('Enviando datos de inicio de sesión:', { username, password });

        try {
            console.log(`Enviando POST a la URL: ${LOGIN_URL}`);
            const response = await axios.post(LOGIN_URL, {
                username: username,
                password: password
            });

            const data = response.data;
            console.log('Login exitoso:', data);

            const accessToken = data.access;
            if (accessToken) {
                const decodedToken = jwtDecode(accessToken);
                const role = decodedToken.rol;
                console.log('Token de acceso decodificado:', decodedToken);
                console.log('Rol del usuario decodificado del token:', role);
            
            
                loginUser(data);
                console.log('loginUser de AuthContext llamado.');

                if (onLoginSuccess) {
                    onLoginSuccess(role);
                    console.log('onLoginSuccess llamado con rol:', role);
                }

                setUsername('');
                setPassword('');
                setApiError('');
                setErrors({});
                onClose();
                console.log('Modal cerrado después del inicio de sesión exitoso.');
            } else {
                setApiError('Error: Token de acceso no recibido.');
                console.log('Error: Token de acceso no recibido en la respuesta.');
            }

        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            if (error.response) {
                console.log('Respuesta del servidor con error:', error.response.data);
                setApiError('Error de autenticación: Usuario o contraseña incorrectos.');
            } else  if (error.request) {
                console.log('No se recibió respuesta del servidor:', error.request);
                setApiError('Error de red: No se pudo conectar al servidor.');
            } else {
                console.log('Error al configurar la solicitud:', error.message);
                setApiError('Error inesperado: ' + error.message);
            }

        } finally {
            setLoading(false);
            console.log('Proceso de inicio de sesión finalizado.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 opacity-100"
            onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10 transform transition-all duration-300 opacity-100 scale-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">Iniciar Sesión</h2>
            {apiError && (
                <div className="text-red-600 text-sm mb-4 p-2 bg-red-100 border border-red-300 rounded">
                    {apiError}
                </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                    console.log('Usuario actualizado:', e.target.value);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.username ? 'border-red-500 ring-red-500' : 'focus:ring-red-500'
                }`}
                />
                {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
            </div>

            <div>
                <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    console.log('Contraseña actualizada: ***');
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500 ring-red-500' : 'focus:ring-red-500'
                }`}
                />
                {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading} // Deshabilita el botón mientras está cargando
                className={`w-full text-white py-2 rounded-lg transition cursor-pointer ${
                    loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
            >
                {loading ? 'Accediendo...' : 'Acceder'}
            </button>
            </form>

            <button
            onClick={() => {
                onClose();
                console.log('Botón Cancelar presionado. Modal cerrado.');
            }}
            className="mt-4 text-sm text-gray-500 hover:underline cursor-pointer"
            >
            Cancelar
            </button>
        </div>
        </div>
    );
    }

export default SignUpModal;