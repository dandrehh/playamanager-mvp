import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
  currentShiftStart?: string;
  currentShiftInventory?: any[];
}

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendor();
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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!vendor) {
    return <div className="text-center py-8">Vendedor no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{vendor.name}</h1>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {vendor.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <button
            onClick={() => navigate('/vendors')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Volver
          </button>
        </div>

        {vendor.currentShiftStart && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold mb-2">Turno Actual</h2>
            <p className="text-sm text-gray-600">
              Inicio: {new Date(vendor.currentShiftStart).toLocaleString()}
            </p>
          </div>
        )}

        {vendor.currentShiftInventory && vendor.currentShiftInventory.length > 0 && (
          <div>
            <h2 className="font-semibold mb-4">Inventario</h2>
            <div className="space-y-2">
              {vendor.currentShiftInventory.map((item: any) => (
                <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>{item.product?.name}</span>
                  <span className="font-semibold">{item.quantityCurrent} unidades</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetailPage;
