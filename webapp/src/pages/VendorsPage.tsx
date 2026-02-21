import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
  currentShiftStart?: string;
  currentShiftInventory?: any[];
}

const VendorsPage = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendedores</h1>
        <button
          onClick={() => navigate('/vendors/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nuevo Vendedor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {vendors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No hay vendedores registrados</p>
            <button
              onClick={() => navigate('/vendors/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Primer Vendedor
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => navigate(`/vendors/${vendor.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        vendor.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.isActive ? 'En turno' : 'Sin turno'}
                      </span>
                      {vendor.currentShiftStart && (
                        <span className="text-sm text-gray-600">
                          Desde {new Date(vendor.currentShiftStart).toLocaleTimeString('es-CL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {vendor.currentShiftInventory && vendor.currentShiftInventory.length > 0 && (
                      <p className="text-sm text-gray-600 font-medium">
                        {vendor.currentShiftInventory.length} productos asignados
                      </p>
                    )}
                    <svg 
                      className="w-5 h-5 text-gray-400 ml-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
