import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function NewVendorPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre del vendedor es requerido');
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post('/vendors', formData);
      alert('Vendedor creado exitosamente');
      navigate(`/vendors/${response.data.vendor.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'No se pudo crear el vendedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/vendors')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Nuevo Vendedor</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Vendedor
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Carlos Ramírez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              className="input"
              placeholder="+56 9 1234 5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {saving ? 'Creando...' : 'CREAR VENDEDOR'}
          </button>
        </div>
      </main>
    </div>
  );
}
