import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  if (!user) return null;

  const roleLabel = user.role === 'ADMIN_KIOSK' ? 'Administrador' : 'Operador de Caja';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Perfil</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Avatar Section */}
        <div className="bg-white rounded-xl p-8 text-center mb-4">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl font-bold text-white">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : '👤'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {user.fullName || 'Usuario'}
          </h2>
          <p className="text-gray-600 mb-2">@{user.username}</p>
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold">
            {roleLabel}
          </div>
        </div>

        {/* Company Information */}
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">INFORMACIÓN DE LA EMPRESA</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">ID de Empresa</span>
              <span className="font-semibold text-gray-900">{user.company.companyId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Nombre del Kiosko</span>
              <span className="font-semibold text-gray-900">{user.company.name}</span>
            </div>
            {user.company.location && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Ubicación</span>
                <span className="font-semibold text-gray-900">{user.company.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">CONFIGURACIÓN DE CUENTA</h3>
          <button
            onClick={() => alert('Función de cambiar contraseña disponible próximamente')}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔑</span>
              <span className="font-semibold text-gray-900">Cambiar Contraseña</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* App Information */}
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">INFORMACIÓN DE LA APP</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Versión</span>
              <span className="font-semibold text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Entorno</span>
              <span className="font-semibold text-gray-900">
                {window.location.hostname === 'localhost' ? 'Desarrollo' : 'Producción'}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full border-2 border-red-500 text-red-500 font-bold py-4 px-6 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>

        {/* Footer */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-sm text-gray-500">PlayaManager © 2026</p>
          <p className="text-sm text-gray-500">Gestión inteligente para tu negocio</p>
        </div>
      </main>
    </div>
  );
}
