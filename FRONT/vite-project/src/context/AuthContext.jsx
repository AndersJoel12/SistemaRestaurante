import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const getInitialAuthData = () => {

        try {
            const tokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
        let role = null;

        if (tokens) {
            try {
                const decoded = jwtDecode(tokens.access);
                role = decoded.rol;
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('authTokens');
                return { authTokens: null, userRole: null };
            }
        }
        return { authTokens: tokens, userRole: role };

        } catch (error) {
            console.error('Error retrieving auth tokens from localStorage:', error);
            localStorage.removeItem('authTokens');
        }

        return { authTokens: null, userRole: null };
    
    };

    const { authTokens: initialTokens, userRole: initialRole } = getInitialAuthData();

    const [authTokens, setAuthTokens] = useState(initialTokens);
    const [userRole, setUserRole] = useState(initialRole);

    const loginUser = (data) => {
        const decoded = jwtDecode(data.access);
        const role = decoded.rol;

        localStorage.setItem('authTokens', JSON.stringify(data));

        setAuthTokens(data);
        setUserRole(role);
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUserRole(null);
        localStorage.removeItem('authTokens');
    };

    const contextData = {
        userRole,
        authTokens,
        loginUser,
        logoutUser,
    };
    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);