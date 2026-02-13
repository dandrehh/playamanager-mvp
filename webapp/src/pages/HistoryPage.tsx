import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

type FilterType = 'today' | 'week' | 'month';

interface Rental {
  id: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    product: { name: string };
  }>;
}

interface VendorSale {
  id: string;
  totalAmount: number;
  createdAt: string;
  vendor: {
    name: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }>;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vendorSales, setVendorSales] = useState<VendorSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ARRIENDOS' | 'VENDEDORES'>('ARRIENDOS');
  const [filter, setFilter] = useState<FilterType>('today');

  useEffect(() => {
    loadHistory();
  }, [filter, activeTab]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ARRIENDOS') {
        const response = await apiClient.get('/rentals?status=CLOSED');
        const allRentals = response.data.rentals;

        // Filter by date
        const filtered = allRentals.filter((rental: Rental) => {
          const rentalDate = new Date(rental.createdAt);
          const now = new Date();

          if (filter === 'today') {
            return rentalDate.toDateString() === now.toDateString();
          } else if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return rentalDate >= weekAgo;
          } else {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return rentalDate >= monthAgo;
          }
        });

        setRentals(filtered);
      } else {
        // Load vendor sales
        const vendorsResponse = await apiClient.get('/vendors');
        const allVendors = vendorsResponse.data.vendors;

        // Recopilar todas las ventas de todos los vendedores
        const allSales: VendorSale[] = [];
        for (const vendor of allVendors) {
          const vendorDetail = await apiClient.get(`/vendors/${vendor.id}`);
          const sales = vendorDetail.data.vendor.sales || [];
          
          sales.forEach((sale: any) => {
            allSales.push({
              ...sale,
              vendor: { name: vendor.name },
            });
          });
        }

        // Filter by date
        const filtered = allSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt);
          const now = new Date();

          if (filter === 'today') {
            return saleDate.toDateString() === now.toDateString();
          } else if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return saleDate >= weekAgo;
          } else {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return saleDate >= monthAgo;
          }
        });

        // Ordenar por fecha más reciente primero
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setVendorSales(filtered);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = () => {
    if (activeTab === 'ARRIENDOS') {
      return rentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
    } else {
      return vendorSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Historial</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('ARRIENDOS')}
            className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'ARRIENDOS'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600'
            }`}
          >
            ARRIENDOS
          </button>
          <button
            onClick={() => setActiveTab('VENDEDORES')}
            className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'VENDEDORES'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600'
            }`}
          >
            VENDEDORES
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          {(['today', 'week', 'month'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'Esta Semana' : 'Este Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : activeTab === 'ARRIENDOS' ? (
          // ARRIENDOS TAB
          rentals.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">No hay registros de arriendos para este período</p>
            </div>
          ) : (
            <>
              {rentals.length > 0 && (
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {getDateLabel(rentals[0].createdAt)}
                </h2>
              )}

              <div className="space-y-3 mb-6">
                {rentals.map((rental) => (
                  <div
                    key={rental.id}
                    onClick={() => navigate(`/rentals/${rental.id}`)}
                    className="card cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{rental.customerName}</h3>
                      <span className="font-bold text-green-600">
                        {formatCurrency(rental.totalAmount)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {rental.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{formatTime(rental.createdAt)}</span>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                        ✅ DEVUELTO
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Summary */}
              <div className="bg-primary text-white rounded-xl p-6 text-center">
                <p className="text-sm font-semibold opacity-90 mb-2">Ingresos Totales</p>
                <p className="text-4xl font-bold">{formatCurrency(calculateTotalRevenue())}</p>
              </div>
            </>
          )
        ) : (
          // VENDEDORES TAB
          vendorSales.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🍦</div>
              <p className="text-gray-500 text-lg">No hay ventas de vendedores para este período</p>
            </div>
          ) : (
            <>
              {vendorSales.length > 0 && (
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {getDateLabel(vendorSales[0].createdAt)}
                </h2>
              )}

              <div className="space-y-3 mb-6">
                {vendorSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="card"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{sale.vendor.name}</h3>
                        <p className="text-sm text-gray-600">Venta de Vendedor</p>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {sale.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{formatTime(sale.createdAt)}</span>
                      <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                        🍦 VENDEDOR
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Summary */}
              <div className="bg-orange-500 text-white rounded-xl p-6 text-center">
                <p className="text-sm font-semibold opacity-90 mb-2">Ingresos Totales (Vendors)</p>
                <p className="text-4xl font-bold">{formatCurrency(calculateTotalRevenue())}</p>
                <p className="text-sm opacity-80 mt-2">{vendorSales.length} ventas</p>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
