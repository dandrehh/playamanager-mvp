import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

interface SelectedItem {
  product: Product;
  quantity: number;
}

export default function NewRentalPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products?category=RENTAL&isActive=true');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const getItemQuantity = (productId: string): number => {
    const item = selectedItems.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (product: Product, delta: number) => {
    const currentQuantity = getItemQuantity(product.id);
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      setSelectedItems(selectedItems.filter((i) => i.product.id !== product.id));
    } else {
      const existingIndex = selectedItems.findIndex((i) => i.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...selectedItems];
        updated[existingIndex].quantity = newQuantity;
        setSelectedItems(updated);
      } else {
        setSelectedItems([...selectedItems, { product, quantity: newQuantity }]);
      }
    }
  };

  const calculateTotal = (): number => {
    return selectedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  const handleCreate = async () => {
    setError('');

    if (!customerName.trim()) {
      setError('Por favor ingresa el nombre del cliente');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Debes seleccionar al menos un producto');
      return;
    }

    setCreating(true);

    try {
      const rentalData = {
        customerName: customerName.trim(),
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      };

      const response = await apiClient.post('/rentals', rentalData);
      
      // Redirigir al detalle del nuevo arriendo
      navigate(`/rentals/${response.data.rental.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo crear el arriendo');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

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
          <h1 className="text-xl font-bold">Nuevo Arriendo</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-32">
        {/* Customer Details */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            DETALLES DEL CLIENTE
          </label>
          <input
            type="text"
            className="input"
            placeholder="Nombre del cliente (ej: Juan Pérez)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <button
            disabled
            className="w-full mt-3 border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-500 cursor-not-allowed"
          >
            📷 Foto de Identificación (Opcional)
          </button>
        </div>

        {/* Select Items */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            SELECCIONAR PRODUCTOS
          </label>
          
          {products.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No hay productos disponibles</p>
              <button
                onClick={() => navigate('/products')}
                className="btn-primary mt-4"
              >
                Agregar Productos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const quantity = getItemQuantity(product.id);
                const subtotal = product.price * quantity;

                return (
                  <div key={product.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-primary ml-4">
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => updateQuantity(product, -1)}
                        disabled={quantity === 0}
                        className="w-12 h-12 rounded-lg bg-primary text-white font-bold text-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product, 1)}
                        className="w-12 h-12 rounded-lg bg-primary text-white font-bold text-xl hover:bg-blue-600 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {quantity > 0 && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total de Productos:</span>
              <span className="font-bold text-blue-900">
                {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-700">Total</span>
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || total === 0 || !customerName.trim()}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <span>Creando...</span>
            ) : (
              <>
                <span>CONFIRMAR Y ENTREGAR</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
