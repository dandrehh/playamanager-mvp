import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface InventoryItem {
  id: string;
  product: Product;
  quantityAssigned: number;
  quantitySold: number;
  quantityReturned: number;
  isActive: boolean;
}

interface Sale {
  id: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: number;
  }>;
}

interface Vendor {
  id: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  totalSalesToday: number;
  inventoryAssignments: InventoryItem[];
  sales: Sale[];
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'assign' | 'sale' | 'close' | null>(null);
  
  // Assign Inventory State
  const [assignItems, setAssignItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  
  // Register Sale State
  const [saleItems, setSaleItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  
  // Close Shift State
  const [returns, setReturns] = useState<Array<{ productId: string; quantityReturned: number }>>([]);
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [vendorRes, productsRes] = await Promise.all([
        apiClient.get(`/vendors/${id}`),
        apiClient.get('/products?category=VENDOR&isActive=true'),
      ]);
      setVendor(vendorRes.data.vendor);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('No se pudo cargar la información del vendedor');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInventory = async () => {
    if (assignItems.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/vendors/${id}/assign-inventory`, { items: assignItems });
      alert('Inventario asignado exitosamente');
      setActiveModal(null);
      setAssignItems([]);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al asignar inventario');
    } finally {
      setProcessing(false);
    }
  };

  const handleRegisterSale = async () => {
    if (saleItems.length === 0) {
      alert('Selecciona al menos un producto vendido');
      return;
    }

    const items = saleItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product!.price,
      };
    });

    setProcessing(true);
    try {
      await apiClient.post(`/vendors/${id}/register-sale`, { items });
      alert('Venta registrada exitosamente');
      setActiveModal(null);
      setSaleItems([]);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al registrar venta');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    if (!confirm('¿Confirmar cierre de turno? Esta acción desactivará al vendedor.')) {
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/vendors/${id}/close-shift`, { returns });
      alert('Turno cerrado exitosamente');
      navigate('/vendors');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cerrar turno');
    } finally {
      setProcessing(false);
    }
  };

  const updateAssignQuantity = (productId: string, delta: number) => {
    const existing = assignItems.find(i => i.productId === productId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setAssignItems(assignItems.filter(i => i.productId !== productId));
      } else {
        setAssignItems(assignItems.map(i => 
          i.productId === productId ? { ...i, quantity: newQty } : i
        ));
      }
    } else if (delta > 0) {
      setAssignItems([...assignItems, { productId, quantity: 1 }]);
    }
  };

  const updateSaleQuantity = (productId: string, delta: number) => {
    const existing = saleItems.find(i => i.productId === productId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setSaleItems(saleItems.filter(i => i.productId !== productId));
      } else {
        setSaleItems(saleItems.map(i => 
          i.productId === productId ? { ...i, quantity: newQty } : i
        ));
      }
    } else if (delta > 0) {
      setSaleItems([...saleItems, { productId, quantity: 1 }]);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CL')}`;
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 ACTIVE' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600', label: '⚫ OFFLINE' },
      ON_BREAK: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 BREAK' },
    };
    return badges[status as keyof typeof badges];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) return null;

  const badge = getStatusBadge(vendor.status);
  const activeInventory = vendor.inventoryAssignments.filter(inv => inv.isActive);
  const canAssign = vendor.status !== 'ON_BREAK'; // Puede asignar si está ACTIVE o INACTIVE
  const canSell = vendor.status === 'ACTIVE' && activeInventory.length > 0;
  const canClose = vendor.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/vendors')} className="text-2xl">←</button>
          <h1 className="text-xl font-bold">{vendor.name}</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        {/* Status */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-2 rounded-full font-bold ${badge.bg} ${badge.text}`}>
            {badge.label}
          </div>
        </div>

        {/* Info */}
        <div className="card mb-4">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{vendor.name}</h3>
          {vendor.phone && <p className="text-gray-600 mb-3">{vendor.phone}</p>}
          {vendor.totalSalesToday > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-700">Today's Sales:</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(vendor.totalSalesToday)}</p>
            </div>
          )}
        </div>

        {/* Active Inventory */}
        {activeInventory.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">CURRENT INVENTORY</h3>
            <div className="max-h-64 overflow-y-auto">
              {activeInventory.map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-900">{inv.product.name}</span>
                  <span className="font-bold text-primary">
                    {inv.quantityAssigned - inv.quantitySold} / {inv.quantityAssigned}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sales */}
        {vendor.sales.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">RECENT SALES</h3>
            {vendor.sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{formatTime(sale.createdAt)}</span>
                  <span className="font-bold text-green-600">{formatCurrency(sale.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {sale.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {canAssign && (
              <button
                onClick={() => setActiveModal('assign')}
                className="w-full bg-primary text-white py-4 rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                {vendor.status === 'ACTIVE' ? '📦 RELOAD INVENTORY' : '📦 ASSIGN INVENTORY'}
              </button>
            )}

            {canSell && (
              <button
                onClick={() => setActiveModal('sale')}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                💰 REGISTER SALE
              </button>
            )}

            {canClose && (
              <button
                onClick={() => setActiveModal('close')}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold hover:bg-orange-700 transition-colors"
              >
                🔚 CLOSE SHIFT
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Assign Inventory Modal */}
      {activeModal === 'assign' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold">
                {vendor.status === 'ACTIVE' ? 'Reload Inventory' : 'Assign Inventory'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                {vendor.status === 'ACTIVE' 
                  ? `Add more products to ${vendor.name}'s inventory`
                  : `Select products and quantities to assign to ${vendor.name}`
                }
              </p>
              {products.map(product => {
                const qty = assignItems.find(i => i.productId === product.id)?.quantity || 0;
                const currentInv = activeInventory.find(inv => inv.product.id === product.id);
                const currentQty = currentInv ? (currentInv.quantityAssigned - currentInv.quantitySold) : 0;
                
                return (
                  <div key={product.id} className="card">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(product.price)} c/u</p>
                        {currentQty > 0 && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            📦 Current: {currentQty} in stock
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => updateAssignQuantity(product.id, -1)}
                        disabled={qty === 0}
                        className="w-12 h-12 rounded-lg bg-primary text-white text-xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                      >−</button>
                      <span className="text-2xl font-bold w-16 text-center">{qty}</span>
                      <button
                        onClick={() => updateAssignQuantity(product.id, 1)}
                        className="w-12 h-12 rounded-lg bg-primary text-white text-xl font-bold hover:bg-blue-600 transition-colors"
                      >+</button>
                    </div>
                    {qty > 0 && currentQty > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                        <p className="text-sm text-green-700 font-semibold">
                          New total: {currentQty + qty} units
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAssignInventory}
                disabled={processing || assignItems.length === 0}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg"
              >
                {processing ? (vendor.status === 'ACTIVE' ? 'Reloading...' : 'Assigning...') : 
                  vendor.status === 'ACTIVE' 
                    ? `CONFIRM RELOAD (${assignItems.length} products)` 
                    : `CONFIRM ASSIGNMENT (${assignItems.length} products)`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Sale Modal */}
      {activeModal === 'sale' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold">Register Sale</h2>
              <button onClick={() => setActiveModal(null)} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-4">Mark products sold by {vendor.name}</p>
              {activeInventory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No inventory assigned</p>
              ) : (
                activeInventory.map(inv => {
                  const available = inv.quantityAssigned - inv.quantitySold;
                  const qty = saleItems.find(i => i.productId === inv.product.id)?.quantity || 0;
                  return (
                    <div key={inv.id} className="card">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{inv.product.name}</p>
                          <p className="text-sm text-gray-600">Available: {available}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => updateSaleQuantity(inv.product.id, -1)}
                          disabled={qty === 0}
                          className="w-12 h-12 rounded-lg bg-green-600 text-white text-xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                        >−</button>
                        <span className="text-2xl font-bold w-16 text-center">{qty}</span>
                        <button
                          onClick={() => updateSaleQuantity(inv.product.id, 1)}
                          disabled={qty >= available}
                          className="w-12 h-12 rounded-lg bg-green-600 text-white text-xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                        >+</button>
                      </div>
                    </div>
                  );
                })
              )}
              <button
                onClick={handleRegisterSale}
                disabled={processing || saleItems.length === 0}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-lg"
              >
                {processing ? 'Registering...' : `CONFIRM SALE (${saleItems.length} products)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {activeModal === 'close' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold">Close Shift</h2>
              <button onClick={() => setActiveModal(null)} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4">
              <div className="bg-blue-50 rounded-lg p-6 mb-6 text-center">
                <p className="text-sm text-blue-700 mb-2">Total Sales Today:</p>
                <p className="text-4xl font-bold text-blue-900">{formatCurrency(vendor.totalSalesToday)}</p>
              </div>
              
              <h3 className="font-semibold text-gray-700 mb-3">Inventory Summary:</h3>
              <div className="space-y-2 mb-6">
                {activeInventory.map(inv => {
                  const remaining = inv.quantityAssigned - inv.quantitySold;
                  return (
                    <div key={inv.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-900">{inv.product.name}</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{remaining} remaining</p>
                        <p className="text-sm text-gray-600">{inv.quantitySold} sold</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  ⚠️ This will deactivate {vendor.name} and reset their daily sales counter.
                </p>
              </div>

              <button
                onClick={handleCloseShift}
                disabled={processing}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors text-lg"
              >
                {processing ? 'Closing Shift...' : 'CONFIRM CLOSE SHIFT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
