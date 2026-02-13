import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SyncPage() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      // Simular sincronización
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = {
        rentalsUploaded: Math.floor(Math.random() * 5),
        vendorsUpdated: 0,
        productCatalog: 'Actualizado',
        closuresSynced: Math.floor(Math.random() * 3),
      };

      setSyncResult(result);
      setLastSync(new Date());

      alert(`Sincronización exitosa: ${result.rentalsUploaded + result.closuresSynced} registros sincronizados`);
    } catch (error) {
      alert('No se pudo completar la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-2xl hover:text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">Sincronización del Sistema</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Status */}
        <div className="bg-white rounded-xl p-8 text-center mb-6">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              syncResult ? 'bg-green-100' : 'bg-blue-100'
            }`}
          >
            <span className="text-4xl">{syncResult ? '✅' : '☁️'}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {syncResult ? '¡Sincronización Exitosa!' : 'Sincronización del Sistemahronization'}
          </h2>
          <p className="text-gray-600">
            {syncResult
              ? 'Todos los datos locales han sido enviados al servidor'
              : 'Mantén los datos de tu dispositivo actualizados'}
          </p>
        </div>

        {/* Last Sync Info */}
        <div className="card mb-6">
          <div className="space-y-3">
            <div className="pb-3 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Última Sincronización Exitosa</p>
              <p className="font-semibold text-gray-900">
                {lastSync ? formatDate(lastSync) : 'Never'}
              </p>
            </div>
            <div className="pb-3 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Servidor Backend</p>
              <p className="font-semibold text-gray-900">api.beachmanager.io</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Entorno</p>
              <p className="font-semibold text-gray-900">
                {window.location.hostname === 'localhost' ? 'DESARROLLO' : 'PRODUCCIÓN_v2'}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">RESUMEN DE SINCRONIZACIÓN</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⛱️</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Arriendos Subidos</p>
                  <p className="font-bold text-gray-900">{syncResult.rentalsUploaded} Registros</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👥</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Vendedores Actualizados</p>
                  <p className="font-bold text-gray-900">{syncResult.vendorsUpdated} Registros</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💰</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Cierres Sincronizados</p>
                  <p className="font-bold text-gray-900">
                    {syncResult.closuresSynced} Turno{syncResult.closuresSynced !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📦</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Catálogo de Productos</p>
                  <p className="font-bold text-green-600">{syncResult.productCatalog}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Uploads */}
        {!syncResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
            <p className="text-2xl font-bold text-green-800 mb-1">0 Registros</p>
            <p className="text-sm text-green-700">Tu dispositivo está actualizado</p>
          </div>
        )}

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {syncing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>SINCRONIZAR AHORA</span>
            </>
          )}
        </button>

        {syncResult && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full border-2 border-primary text-primary font-bold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>VOLVER AL INICIO</span>
          </button>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            💡 Los datos se sincronizan automáticamente cuando estás conectado a WiFi
          </p>
        </div>
      </main>
    </div>
  );
}
