import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Vendor {
  id: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  totalSalesToday: number;
  inventoryAssignments: Array<{
    product: {
      name: string;
    };
    quantityAssigned: number;
    quantitySold: number;
  }>;
}

export default function VendorsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeVendors: 0,
    todaySales: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vendorsRes, statsRes] = await Promise.all([
        apiClient.get('/vendors'),
        apiClient.get('/vendors/stats'),
      ]);
      setVendors(vendorsRes.data.vendors);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 ACTIVE' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600', label: '⚫ OFFLINE' },
      ON_BREAK: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 BREAK' },
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Panel de Vendedores</h1>
          <button
            onClick={() => navigate('/vendors/new')}
            className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold"
          >
            + Agregar
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-sm font-semibold text-gray-600 mb-2">VENDEDORES ACTIVOS</p>
            <p className="text-4xl font-bold text-gray-900">{stats.activeVendors}</p>
          </div>
          <div className="bg-green-500 text-white rounded-xl p-4 text-center">
            <p className="text-sm font-semibold opacity-90 mb-2">INGRESOS DEL DÍA</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-xs opacity-80 mt-1">{stats.todaySales} ventas</p>
          </div>
        </div>

        {/* Vendors List */}
        <h2 className="text-sm font-semibold text-gray-700 mb-4">TODOS LOS VENDEDORES</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500 mb-4">No hay vendedores registrados</p>
            <button onClick={() => navigate('/vendors/new')} className="btn-primary">
              Crear Primer Vendedor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => {
              const badge = getStatusBadge(vendor.status);
              return (
                <div
                  key={vendor.id}
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                  className="card cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                      {vendor.phone && (
                        <p className="text-sm text-gray-600">{vendor.phone}</p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </div>
                  </div>

                  {vendor.status === 'ACTIVE' && vendor.inventoryAssignments.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">INVENTORY:</p>
                      <p className="text-sm text-gray-900">
                        {vendor.inventoryAssignments
                          .map(
                            (inv) =>
                              `${inv.quantityAssigned - inv.quantitySold}/${inv.quantityAssigned} ${inv.product.name}`
                          )
                          .join(' • ')}
                      </p>
                    </div>
                  )}

                  {vendor.totalSalesToday > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Ventas de Hoy:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(vendor.totalSalesToday)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
