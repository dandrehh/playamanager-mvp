import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface InventoryItem {
  id: string;
  product: Product;
  quantityStart: number;
  quantityCurrent: number;
}

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
  currentShiftStart?: string;
  currentShiftInventory?: InventoryItem[];
}

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchVendor();
    fetchProducts();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const response = await apiClient.get(`/vendors/${id}`);
      setVendor(response.data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      alert('Error al cargar vendedor');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      console.log('Products response:', response.data);
      
      // Manejar diferentes formatos de respuesta
      let productsList = Array.isArray(response.data) ? response.data : response.data.products || [];
      
      const vendorProducts = productsList.filter((p: Product) => p.category === 'VENDOR');
      setProducts(vendorProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAssignInventory = async () => {
    const inventory = Object.entries(selectedProducts)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (inventory.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    try {
      await apiClient.post(`/vendors/${id}/assign-inventory`, { inventory });
      alert(vendor?.isActive ? 'Inventario recargado' : 'Turno iniciado');
      setShowAssignModal(false);
      setSelectedProducts({});
      fetchVendor();
    } catch (error: any) {
      console.error('Error assigning inventory:', error);
      alert(error.response?.data?.message || 'Error al asignar inventario');
    }
  };

  const handleRegisterSale = async () => {
    const items = Object.entries(selectedProducts)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          quantity,
          unitPrice: product?.price || 0
        };
      });

    if (items.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    try {
      await apiClient.post(`/vendors/${id}/register-sale`, { items });
      alert('Venta registrada');
      setShowSaleModal(false);
      setSelectedProducts({});
      fetchVendor();
    } catch (error: any) {
      console.error('Error registering sale:', error);
      alert(error.response?.data?.message || 'Error al registrar venta');
    }
  };

  const handleCloseShift = async () => {
    if (!confirm('¿Cerrar turno del vendedor?')) return;

    try {
      await apiClient.post(`/vendors/${id}/close-shift`, {});
      alert('Turno cerrado');
      fetchVendor();
    } catch (error: any) {
      console.error('Error closing shift:', error);
      alert(error.response?.data?.message || 'Error al cerrar turno');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!vendor) {
    return <div className="text-center py-8">Vendedor no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/vendors')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Vendedor: {vendor.name}</h1>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {vendor.isActive ? 'En turno' : 'Sin turno'}
            </span>
            {vendor.currentShiftStart && (
              <p className="text-sm text-gray-600 mt-2">
                Turno iniciado: {new Date(vendor.currentShiftStart).toLocaleString('es-CL')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {vendor.isActive ? '🔄 Recargar Inventario' : '▶️ Iniciar Turno'}
        </button>
        
        <button
          onClick={() => setShowSaleModal(true)}
          disabled={!vendor.isActive}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💰 Registrar Venta
        </button>

        <button
          onClick={handleCloseShift}
          disabled={!vendor.isActive}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⏹️ Cerrar Turno
        </button>
      </div>

      {/* Current Inventory */}
      {vendor.currentShiftInventory && vendor.currentShiftInventory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-semibold text-lg mb-4">Inventario Actual</h2>
          <div className="space-y-2">
            {vendor.currentShiftInventory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <p className="text-sm text-gray-600">${item.product.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{item.quantityCurrent} unidades</p>
                  <p className="text-xs text-gray-500">Asignadas: {item.quantityStart}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign/Reload Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {vendor.isActive ? 'Recargar Inventario' : 'Asignar Inventario Inicial'}
            </h2>
            
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay productos para vendedores. Créalos en "Gestionar Productos".
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">${product.price.toLocaleString()}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={selectedProducts[product.id] || 0}
                      onChange={(e) => setSelectedProducts({
                        ...selectedProducts,
                        [product.id]: parseInt(e.target.value) || 0
                      })}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProducts({});
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignInventory}
                disabled={products.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Venta</h2>
            
            {!vendor.currentShiftInventory || vendor.currentShiftInventory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay inventario asignado. Inicia turno primero.
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {vendor.currentShiftInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.product.price.toLocaleString()} | Disponible: {item.quantityCurrent}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={item.quantityCurrent}
                      value={selectedProducts[item.product.id] || 0}
                      onChange={(e) => setSelectedProducts({
                        ...selectedProducts,
                        [item.product.id]: Math.min(parseInt(e.target.value) || 0, item.quantityCurrent)
                      })}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedProducts({});
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterSale}
                disabled={!vendor.currentShiftInventory || vendor.currentShiftInventory.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Registrar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailPage;
