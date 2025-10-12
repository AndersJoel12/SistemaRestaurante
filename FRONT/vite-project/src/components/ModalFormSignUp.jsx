import './Components.css'

function SignUpModal({ isOpen, onClose }) {
    if (!isOpen) return null // Evita renderizar el modal si está cerrado

    const handleSubmit = (e) => {
        e.preventDefault()
        // Aquí puedes manejar el login (validación, API, etc.)
        console.log('Formulario enviado')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 opacity-100"
            onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10 transform transition-all duration-300 opacity-100 scale-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">Iniciar Sesión</h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Usuario"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
                type="password"
                placeholder="Contraseña"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
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
    )
}

export default SignUpModal