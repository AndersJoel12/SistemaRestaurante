import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Components.css';
import axios from 'axios';

const LOGIN_URL = 'http://127.0.0.1:8000/token/';

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setApiError('');


        const newErrors = {};
        if (!username.trim()) { newErrors.username = 'El usuario es obligatorio'; }
        if (!password.trim()) { newErrors.password = 'La contraseña es obligatoria'; } 
        else if (password.length < 6) { newErrors.password = 'La contraseña debe tener al menos 6 caracteres'; }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(LOGIN_URL, {
                username: username,
                password: password
            });

            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            onLoginSuccess();
        } catch (error) {
            if (error.response) {
                setApiError('Error de autenticación: Usuario o contraseña incorrectos.');
            } else {
                setApiError('Error de red: No se pudo conectar al servidor.');
            }
        } finally {
            setLoading(false);
        }


        // Si no hay errores, continúa con el envío
        setErrors({});
        onClose();         // Cierra el modal
        navigate('/menu'); 
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 opacity-100"
            onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10 transform transition-all duration-300 opacity-100 scale-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">Iniciar Sesión</h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
            >
                Acceder
            </button>
            </form>

            <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:underline cursor-pointer"
            >
            Cancelar
            </button>
        </div>
        </div>
    );
    }

export default SignUpModal;