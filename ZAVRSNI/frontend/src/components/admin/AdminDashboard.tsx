import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { 
  fetchSensors, 
  createSensor, 
  updateSensor, 
  deleteSensor, 
  logoutAdmin 
} from '../../services/adminApi';
import { SensorForm } from './SensorForm';
import { 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Navigation, 
  Thermometer, 
  Zap, 
  Square,
  Activity
} from 'lucide-react';
import type { SensorLocation } from '../../types';

const getSensorIcon = (type: string) => {
  switch (type) {
    case 'traffic': return <Activity className="w-5 h-5" />;
    case 'environment': return <Thermometer className="w-5 h-5" />;
    case 'parking': return <Square className="w-5 h-5" />;
    case 'traffic-light': return <Navigation className="w-5 h-5" />;
    case 'energy': return <Zap className="w-5 h-5" />;
    default: return <Activity className="w-5 h-5" />;
  }
};

const getSensorTypeLabel = (type: string) => {
  switch (type) {
    case 'traffic': return 'Promet';
    case 'environment': return 'Okoliš';
    case 'parking': return 'Parking';
    case 'traffic-light': return 'Semafor';
    case 'energy': return 'Energija';
    default: return type;
  }
};

export const AdminDashboard = () => {
  const { sensors, setSensors, addSensor, updateSensor: updateSensorStore, removeSensor, logout } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SensorLocation | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    setLoading(true);
    const data = await fetchSensors();
    setSensors(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    logout();
  };

  const handleAddSensor = () => {
    setEditingSensor(null);
    setShowForm(true);
  };

  const handleEditSensor = (sensor: SensorLocation) => {
    setEditingSensor(sensor);
    setShowForm(true);
  };

  const handleDeleteSensor = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj senzor?')) return;

    const result = await deleteSensor(id);
    if (result.success) {
      removeSensor(id);
      showMessage('success', 'Senzor uspješno obrisan');
    } else {
      showMessage('error', result.message || 'Greška pri brisanju senzora');
    }
  };

  const handleSaveSensor = async (sensor: SensorLocation) => {
    let result;
    
    if (editingSensor) {
      // Update existing sensor
      result = await updateSensor(sensor.id, sensor);
      if (result.success) {
        updateSensorStore(sensor.id, sensor);
        showMessage('success', 'Senzor uspješno ažuriran');
      }
    } else {
      // Create new sensor
      result = await createSensor(sensor);
      if (result.success) {
        addSensor(sensor);
        showMessage('success', 'Senzor uspješno dodan');
      }
    }

    if (!result.success) {
      showMessage('error', result.message || 'Greška pri spremanju senzora');
    } else {
      setShowForm(false);
      setEditingSensor(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getSensorsByType = () => {
    const types = ['traffic', 'environment', 'parking', 'traffic-light', 'energy'];
    return types.map(type => ({
      type,
      label: getSensorTypeLabel(type),
      count: sensors.filter(s => s.type === type).length
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Upravljanje senzorima</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Odjava</span>
          </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          message.type === 'success'  
            ? 'bg-green-500/10 border border-green-500/50 text-green-400'
            : 'bg-red-500/10 border border-red-500/50 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {getSensorsByType().map(({ type, label, count }) => (
            <div key={type} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-blue-400">
                  {getSensorIcon(type)}
                </div>
                <div>
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Svi Senzori ({sensors.length})</h2>
          <button
            onClick={handleAddSensor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj Senzor</span>
          </button>
        </div>

        {/* Sensors List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : sensors.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <p className="text-gray-400 mb-4">Nema senzora</p>
            <button
              onClick={handleAddSensor}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Dodaj prvi senzor
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Naziv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lokacija
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sensors.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                      {sensor.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {sensor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">
                        {getSensorIcon(sensor.type)}
                        {getSensorTypeLabel(sensor.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                      {sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEditSensor(sensor)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition-colors mr-2"
                      >
                        <Edit className="w-4 h-4" />
                        Uredi
                      </button>
                      <button
                        onClick={() => handleDeleteSensor(sensor.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Obriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sensor Form Modal */}
      {showForm && (
        <SensorForm
          sensor={editingSensor}
          onClose={() => {
            setShowForm(false);
            setEditingSensor(null);
          }}
          onSave={handleSaveSensor}
        />
      )}
    </div>
  );
};
