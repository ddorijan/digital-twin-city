import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SensorLocation } from '../../types';

interface SensorFormProps {
  sensor?: SensorLocation | null;
  onClose: () => void;
  onSave: (sensor: SensorLocation) => void;
}

export const SensorForm = ({ sensor, onClose, onSave }: SensorFormProps) => {
  const [formData, setFormData] = useState<SensorLocation>({
    id: '',
    name: '',
    lat: 45.3089,
    lng: 18.4103,
    type: 'traffic'
  });

  useEffect(() => {
    if (sensor) {
      setFormData(sensor);
    }
  }, [sensor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {sensor ? 'Uredi Senzor' : 'Dodaj Novi Senzor'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Zatvori"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-2">
              ID Senzora *
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              disabled={!!sensor}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="npr. traffic-004"
              required
            />
            {sensor && (
              <p className="mt-1 text-xs text-gray-500">ID se ne može mijenjati</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Naziv Lokacije *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="npr. Glavna ulica"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Tip Senzora *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="traffic">Promet</option>
              <option value="environment">Okoliš</option>
              <option value="parking">Parking</option>
              <option value="traffic-light">Semafori</option>
              <option value="energy">Energija</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-gray-300 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                id="lat"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="lng" className="block text-sm font-medium text-gray-300 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                id="lng"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Odustani
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {sensor ? 'Spremi Promjene' : 'Dodaj Senzor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
