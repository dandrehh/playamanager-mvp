import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function RentalsPage() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      const response = await apiClient.get('/rentals?status=ACTIVE');
      setRentals(response.data.rentals);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/dashboard')} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">Arriendos Activos ({rentals.length})</h1>
        <button onClick={() => navigate('/rentals/new')} className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold">
          + Nuevo
        </button>
      </header>
      
      <main className="p-4 space-y-3">
        {rentals.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">No hay arriendos activos</p>
        ) : (
          rentals.map((rental) => (
            <div
              key={rental.id}
              onClick={() => navigate(`/rentals/${rental.id}`)}
              className="card cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{rental.customerName}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(rental.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {rental.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', ')}
              </p>
              <p className="text-primary font-bold">${rental.totalAmount.toLocaleString('es-CL')}</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
