import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'RENTAL' | 'VENDOR';
  isActive: boolean;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RENTAL' | 'VENDOR'>('RENTAL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      const response = await apiClient.get(`/products?category=${activeTab}`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '' });
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
    });
    setModalOpen(true);
  };

  const handleEliminar = async (product: Product) => {
    if (!confirm(`¿Estás seguro que deseas eliminar "${product.name}"?`)) return;

    try {
      await apiClient.delete(`/products/${product.id}`);
      alert('Producto eliminado');
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo eliminar el producto');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser un número mayor a 0');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price,
        category: activeTab,
        isActive: true,
      };

      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, productData);
        alert('Producto actualizado');
      } else {
        await apiClient.post('/products', productData);
        alert('Producto creado');
      }

      setModalOpen(false);
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Gestionar Productos</h1>
          <button onClick={handleAdd} className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold">
            + Agregar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('RENTAL')}
            className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'RENTAL'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600'
            }`}
          >
            Rentals
          </button>
          <button
            onClick={() => setActiveTab('VENDOR')}
            className={`flex-1 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'VENDOR'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600'
            }`}
          >
            Vendors
          </button>
        </div>
      </div>

      {/* Product List */}
      <main className="max-w-4xl mx-auto p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          {activeTab === 'RENTAL' ? 'PRODUCTOS DE ARRIENDO' : 'PRODUCTOS DE VENDEDORES'}
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500 mb-4">No hay productos en esta categoría</p>
            <button onClick={handleAdd} className="btn-primary">
              Agregar Primer Producto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="card">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{activeTab === 'RENTAL' ? '⛱️' : '🍦'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(product.price)}</p>
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-sm text-primary hover:underline mt-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleEliminar(product)}
                  className="w-full border-t border-gray-200 pt-3 text-sm text-red-600 hover:text-red-700 font-semibold"
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full md:max-w-lg md:rounded-t-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-3xl text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Beach Umbrella, Ice Cream"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio por unidad
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold">$</span>
                  <input
                    type="number"
                    className="input flex-1"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Price charged to customers per unit
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product type
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">
                    {activeTab === 'RENTAL' ? 'Rentals' : 'Vendors'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {activeTab === 'RENTAL'
                      ? 'Chairs, umbrellas, lockers'
                      : 'Ice cream, drinks, snacks'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Umbrellas, Frozen, Drinks"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'GUARDAR PRODUCTO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
