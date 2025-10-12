// ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error atrapado por ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-6">
            <h1 className="text-3xl font-bold mb-4">¡Ups! Algo salió mal 😢</h1>
            <p className="text-lg text-center max-w-md">
                Parece que hubo un error en esta parte de la aplicación. Intenta recargar la página o vuelve más tarde.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
                Recargar
            </button>
            </div>
        );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
