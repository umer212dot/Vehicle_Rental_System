import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UpdateVehicle = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    color: '',
    price_per_day: '',
    image_path: '',
    vehicle_no_plate: ''
  });
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated || userRole !== 'Admin') {
      navigate('/login');
      return;
    }

    // Fetch vehicle data
    fetchVehicleData();
  }, [vehicleId, navigate]);

  const fetchVehicleData = async () => {
    try {
      const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userRole')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch vehicle data');
      
      const data = await response.json();
      setVehicleDetails(data);
      setFormData({
        color: data.color,
        price_per_day: data.price_per_day,
        image_path: data.image_path,
        vehicle_no_plate: data.vehicle_no_plate
      });
      setLoading(false);
    } catch (err) {
      setError('Error loading vehicle data');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        admin_id: localStorage.getItem('adminId') // Include admin_id in the submitted data
      };
      const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userRole')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vehicle');
      }

      navigate('/admin/vehicles');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    try {
      const id = localStorage.getItem('adminId');
      const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userRole')}`
        },
        body: JSON.stringify({ admin_id: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle');
      }

      navigate('/admin/vehicles');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Update Vehicle</h2>
        <button
          onClick={() => navigate('/admin/vehicles')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Vehicles
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {vehicleDetails && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{vehicleDetails.brand} {vehicleDetails.model}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Type:</p>
                  <p className="font-medium">{vehicleDetails.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Year:</p>
                  <p className="font-medium">{vehicleDetails.year}</p>
                </div>
                <div>
                  <p className="text-gray-600">Color:</p>
                  <p className="font-medium">{vehicleDetails.color}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transmission:</p>
                  <p className="font-medium">{vehicleDetails.transmission}</p>
                </div>
                <div>
                  <p className="text-gray-600">Price per Day:</p>
                  <p className="font-medium">${vehicleDetails.price_per_day}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="font-medium">{vehicleDetails.availability ? 'Available' : 'Unavailable'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Plate No:</p>
                  <p className="font-medium">{vehicleDetails.vehicle_no_plate}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <img
                src={vehicleDetails.image_path}
                alt={`${vehicleDetails.brand} ${vehicleDetails.model}`}
                className="max-h-48 object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Edit Details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Color:</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Price per Day:</label>
            <input
              type="number"
              name="price_per_day"
              value={formData.price_per_day}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Image Path:</label>
            <input
              type="text"
              name="image_path"
              value={formData.image_path}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Number Plate:</label>
            <input
              type="text"
              name="vehicle_no_plate"
              value={formData.vehicle_no_plate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex-1"
            >
              Update Vehicle
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
            >
              Delete Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateVehicle;