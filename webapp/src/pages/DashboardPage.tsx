import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

interface Stats {
  activeRentals: number;
  todayRentals: number;
  todayRevenue: number;
  activeVendors?: number;
  vendorRevenue?: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ activeRentals: 0, todayRentals: 0, todayRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [rentalsRes, vendorsRes] = await Promise.all([
        apiClient.get('/rentals/stats'),
        apiClient.get('/vendors/stats'),
      ]);
      
      setStats({
        ...rentalsRes.data.stats,
        activeVendors: vendorsRes.data.stats.activeVendors,
        vendorRevenue: vendorsRes.data.stats.todayRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Hola, {user?.fullName?.split(' ')[0] || 'Operador'}
              </h1>
              <button
                onClick={loadStats}
                className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
              >
                <span>🔄</span>
                <span>Sincronizar Datos</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600">EN LÍNEA</span>
              </div>
              
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-2xl">☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-4 top-16 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <button
              onClick={() => { navigate('/profile'); setMenuOpen(false); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <span>👤</span>
              <span>Perfil</span>
            </button>
            <button
              onClick={() => { navigate('/sync'); setMenuOpen(false); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Configuración</span>
            </button>
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              ARRIENDOS<br />ACTIVOS
            </p>
            <p className="text-4xl font-bold text-gray-900">{stats.activeRentals}</p>
          </div>
          
          <div className="card text-center">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              VENDEDORES<br />EN RUTA
            </p>
            <p className="text-4xl font-bold text-gray-900">{stats.activeVendors || 0}</p>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-primary text-white rounded-xl p-6 mb-6 shadow-lg">
          <p className="text-sm font-semibold opacity-90 mb-2">INGRESOS DEL DÍA</p>
          <p className="text-4xl font-bold mb-1">
            {formatCurrency(stats.todayRevenue + (stats.vendorRevenue || 0))}
          </p>
          <div className="flex justify-between text-sm opacity-80 mt-2">
            <span>Arriendos: {formatCurrency(stats.todayRevenue)}</span>
            <span>Vendedores: {formatCurrency(stats.vendorRevenue || 0)}</span>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => navigate('/rentals')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-8 transition-colors"
          >
            <div className="text-5xl mb-3">⛱️</div>
            <div className="text-xl font-bold">ARRIENDOS</div>
          </button>

          <button
            onClick={() => navigate('/vendors')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-8 transition-colors"
          >
            <div className="text-5xl mb-3">🍦</div>
            <div className="text-xl font-bold">VENDEDORES</div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/history')}
            className="card hover:shadow-md transition-shadow text-center py-6"
          >
            <div className="text-4xl mb-2">📋</div>
            <div className="text-sm font-semibold text-gray-900">Historial</div>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="card hover:shadow-md transition-shadow text-center py-6"
          >
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm font-semibold text-gray-900">Gestionar Productos</div>
          </button>

          {/* Solo visible para ADMIN */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/users')}
              className="card hover:shadow-md transition-shadow text-center py-6 col-span-2"
            >
              <div className="text-4xl mb-2">👥</div>
              <div className="text-sm font-semibold text-gray-900">Gestionar Usuarios</div>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
