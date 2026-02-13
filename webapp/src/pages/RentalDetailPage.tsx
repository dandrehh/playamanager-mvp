import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface RentalItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    description?: string;
  };
}

interface Rental {
  id: string;
  customerName: string;
  status: 'ACTIVE' | 'CLOSED' | 'VOIDED';
  startTime: string;
  endTime?: string;
  totalAmount: number;
  items: RentalItem[];
  user: {
    username: string;
    fullName?: string;
  };
}

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modal states
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  
  // Add items modal states
  const [products, setProducts] = useState<Product[]>([]);
  const [itemsToAdd, setItemsToAdd] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([]);

  useEffect(() => {
    loadRental();
  }, [id]);

  const loadRental = async () => {
    try {
      const response = await apiClient.get(`/rentals/${id}`);
      setRental(response.data.rental);
    } catch (error) {
      console.error('Error loading rental:', error);
      alert('No se pudo cargar el arriendo');
      navigate('/rentals');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products?category=RENTAL&isActive=true');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleModify = async () => {
    setShowAddItemsModal(true);
    await loadProducts();
  };

  const updateAddQuantity = (productId: string, delta: number) => {
    const existing = itemsToAdd.find(i => i.productId === productId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setItemsToAdd(itemsToAdd.filter(i => i.productId !== productId));
      } else {
        setItemsToAdd(itemsToAdd.map(i => 
          i.productId === productId ? { ...i, quantity: newQty } : i
        ));
      }
    } else if (delta > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setItemsToAdd([...itemsToAdd, { 
          productId, 
          quantity: 1, 
          unitPrice: product.price 
        }]);
      }
    }
  };

  const getAddQuantity = (productId: string) => {
    return itemsToAdd.find(i => i.productId === productId)?.quantity || 0;
  };

  const handleConfirmAddItems = async () => {
    if (itemsToAdd.length === 0) {
      alert('Selecciona al menos un producto para agregar');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.put(`/rentals/${id}/add-items`, {
        items: itemsToAdd
      });
      
      alert('Productos agregados exitosamente');
      setShowAddItemsModal(false);
      setItemsToAdd([]);
      await loadRental();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al agregar productos');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!rental || !confirm(`¿Confirmar devolución de todos los artículos de ${rental.customerName}?`)) {
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/rentals/${rental.id}/close`);
      alert('Arriendo cerrado exitosamente');
      navigate('/rentals');
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo cerrar el arriendo');
    } finally {
      setProcessing(false);
    }
  };

  const handleVoid = async () => {
    if (!rental || !confirm('¿Estás seguro que deseas anular este arriendo? Esta acción no se puede deshacer.')) {
      return;
    }

    setProcessing(true);
    try {
      await apiClient.delete(`/rentals/${rental.id}`);
      alert('Arriendo anulado exitosamente');
      navigate('/rentals');
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo anular el arriendo');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Arriendo no encontrado</p>
          <button onClick={() => navigate('/rentals')} className="btn-primary">
            Volver a Arriendos
          </button>
        </div>
      </div>
    );
  }

  const isActive = rental.status === 'ACTIVE';
  const isClosed = rental.status === 'CLOSED';
  const isVoided = rental.status === 'VOIDED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/rentals')}
            className="text-2xl hover:text-primary"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Detalles del Arriendo</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-32">
        {/* Status Badge */}
        <div className="flex justify-between items-center mb-6">
          <div
            className={`px-4 py-2 rounded-full font-bold ${
              isActive ? 'bg-green-100 text-green-800' :
              isClosed ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {isActive && '🟢 ACTIVO'}
            {isClosed && '✅ CERRADO'}
            {isVoided && '❌ ANULADO'}
          </div>
        </div>

        {/* Customer Info */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">INFORMACIÓN DEL CLIENTE</h2>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{rental.customerName}</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Inicio:</span>
              <span className="font-semibold text-gray-900">
                {formatDate(rental.startTime)} - {formatTime(rental.startTime)}
              </span>
            </div>
            
            {rental.endTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Fin:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(rental.endTime)} - {formatTime(rental.endTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">PRODUCTOS ARRENDADOS</h2>
          <div className="space-y-2">
            {rental.items.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary w-12">
                    {item.quantity}x
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.unitPrice)} c/u
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-primary text-white rounded-xl p-6 mb-4">
          <p className="text-sm font-semibold opacity-90 mb-2">Total Pagado</p>
          <p className="text-4xl font-bold">{formatCurrency(rental.totalAmount)}</p>
        </div>

        {/* Operator Info */}
        <div className="text-center text-sm text-gray-600 italic">
          Atendido por: {rental.user.fullName || rental.user.username}
        </div>
      </main>

      {/* Actions (only if active) */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            <button
              onClick={handleClose}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <span>🔄</span>
                  <span>DEVOLVER TODO</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleModify}
                disabled={processing}
                className="border-2 border-primary text-primary font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>Agregar Productos</span>
              </button>

              <button
                onClick={handleVoid}
                disabled={processing}
                className="border-2 border-red-500 text-red-500 font-semibold py-3 px-4 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                <span>Anular</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full md:max-w-2xl md:rounded-t-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Agregar Productos</h2>
              <button onClick={() => setShowAddItemsModal(false)} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="p-4">
              <p className="text-gray-600 mb-4">Selecciona productos para agregar al arriendo:</p>

              <div className="space-y-3 mb-6">
                {products.map((product) => {
                  const qty = getAddQuantity(product.id);
                  return (
                    <div key={product.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        </div>
                        <p className="font-bold text-primary ml-4">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => updateAddQuantity(product.id, -1)}
                          disabled={qty === 0}
                          className="w-12 h-12 rounded-lg bg-primary text-white font-bold text-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">{qty}</span>
                        <button
                          onClick={() => updateAddQuantity(product.id, 1)}
                          className="w-12 h-12 rounded-lg bg-primary text-white font-bold text-xl hover:bg-blue-600 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {qty > 0 && (
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(product.price * qty)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {itemsToAdd.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-900 mb-1">Productos seleccionados</p>
                  <p className="text-sm text-green-700">
                    {itemsToAdd.reduce((sum, i) => sum + i.quantity, 0)} productos • Total: {formatCurrency(itemsToAdd.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0))}
                  </p>
                </div>
              )}

              <button
                onClick={handleConfirmAddItems}
                disabled={processing || itemsToAdd.length === 0}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Agregando...' : 'CONFIRMAR Y AGREGAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
