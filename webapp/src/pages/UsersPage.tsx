import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN_KIOSK' | 'OPERATOR';
  createdAt: string;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'OPERATOR' as 'ADMIN_KIOSK' | 'OPERATOR'
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Solo admin puede acceder
    if (user?.role !== 'ADMIN' && user?.role !== 'ADMIN_KIOSK') {
      alert('No tienes permisos para acceder a esta página');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      alert('Todos los campos son requeridos');
      return;
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await apiClient.post('/users', formData);
      alert('Usuario creado exitosamente');
      setShowCreateModal(false);
      setFormData({ username: '', password: '', fullName: '', role: 'OPERATOR' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await apiClient.put(`/users/${selectedUserId}`, { password: newPassword });
      alert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUserId(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{u.fullName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN_KIOSK' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'ADMIN_KIOSK' ? 'ADMIN' : 'OPERADOR'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Usuario: <span className="font-medium">{u.username}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Creado: {new Date(u.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setShowPasswordModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      🔑 Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Crear Nuevo Usuario</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ej: jperez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN_KIOSK' | 'OPERATOR' })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="OPERATOR">Operador</option>
                  <option value="ADMIN_KIOSK">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ username: '', password: '', fullName: '', role: 'OPERATOR' });
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedUserId(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
