import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de que la importación sea correcta según tu versión

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    
    // 1. LÓGICA DE INICIALIZACIÓN ROBUSTA
    const getInitialAuthData = () => {
        try {
            const storedTokens = localStorage.getItem('authTokens');
            
            if (!storedTokens) return { tokens: null, user: null };

            const tokens = JSON.parse(storedTokens);
            
            // Decodificamos para verificar integridad y expiración
            const decoded = jwtDecode(tokens.access);
            
            // CHEQUEO DE SEGURIDAD: ¿El token ha expirado?
            // 'exp' viene en segundos, Date.now() en milisegundos
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
                console.warn("Sesión expirada. Limpiando almacenamiento.");
                localStorage.removeItem('authTokens');
                return { tokens: null, user: null };
            }

            // Si todo está bien, devolvemos los tokens y los datos del usuario
            return { 
                tokens: tokens, 
                user: decoded // Guardamos TODO el objeto (rol, nombre, user_id, etc.)
            };

        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            localStorage.removeItem('authTokens');
            return { tokens: null, user: null };
        }
    };

    // Inicializamos el estado una sola vez
    const { tokens: initialTokens, user: initialUser } = getInitialAuthData();

    const [authTokens, setAuthTokens] = useState(initialTokens);
    const [user, setUser] = useState(initialUser);

    // 2. FUNCIÓN DE LOGIN
    const loginUser = (data) => {
        // 'data' debe contener { access: "...", refresh: "..." }
        try {
            const decoded = jwtDecode(data.access);
            
            setAuthTokens(data);
            setUser(decoded); // Ahora 'user' tiene { nombre: "Juan", rol: "admin", ... }

            localStorage.setItem('authTokens', JSON.stringify(data));
        } catch (error) {
            console.error("Token inválido recibido en login");
        }
    };

    // 3. FUNCIÓN DE LOGOUT
    const logout = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        // Opcional: Limpiar también sessionStorage si usaste algo ahí
        sessionStorage.removeItem("usuario_sesion"); 
    };

    // 4. PREPARAR DATOS PARA EXPORTAR
    // Unificamos nombres: 'user' y 'logout' coinciden con lo que usamos en Header.jsx
    const contextData = {
        user,          // Objeto completo (contiene .nombre y .rol)
        userRole: user?.rol, // Helper por si alguien solo quiere el rol rápido
        authTokens,
        loginUser,
        logout
    };

    // Efecto opcional: Si quieres sincronizar cambios manuales en localStorage (avanzado)
    useEffect(() => {
        if (authTokens) {
            localStorage.setItem('authTokens', JSON.stringify(authTokens));
        }
    }, [authTokens]);

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);