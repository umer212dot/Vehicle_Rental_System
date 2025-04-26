import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle, FaCalendarPlus } from 'react-icons/fa';

// Maintenance Scheduling Modal component
const MaintenanceScheduleModal = ({ vehicle, isOpen, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    description: '',
    maintenance_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    cost: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form if modal is closed or vehicle changes
    if (isOpen) {
      setFormData({
        description: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        cost: '0'
      });
      setError('');
    }
  }, [isOpen, vehicle]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle cost field specially to validate numeric input
    if (name === 'cost') {
      // Allow empty string or numbers (with decimal)
      if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!formData.maintenance_date) {
      setError('Maintenance date is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSchedule({
        ...formData,
        vehicle_id: vehicle.vehicle_id,
        cost: formData.cost === '' ? 0 : parseFloat(formData.cost)
      });
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule maintenance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Schedule Maintenance</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Vehicle Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {vehicle?.image_path ? (
                <img 
                  className="h-12 w-12 rounded-md object-cover mr-4" 
                  src={vehicle.image_path} 
                  alt={`${vehicle.brand} ${vehicle.model}`} 
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-gray-500 text-lg font-bold">{vehicle?.brand?.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                <p className="text-sm text-gray-500">{vehicle?.type} • {vehicle?.year}</p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Date*</label>
                <input
                  type="date"
                  name="maintenance_date"
                  value={formData.maintenance_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter maintenance description..."
                  rows="3"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <FaCalendarPlus className="mr-2" />
                    Schedule Maintenance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MaintenanceScheduler = () => {
  // Sample data for dropdowns - same as VehicleMaintenanceTracker for consistency
  const brands = ["All Brands", "Volvo", "BMW", "Audi", "Mercedes", "Toyota", "Honda"];
  const [models, setModels] = useState(["All Models"]);
  const types = ["All Types", "Sedan", "SUV", "Hatchback", "Convertible", "Hybrid"];
  const colors = ["All Colors", "Black", "White", "Silver", "Blue", "Red", "Gray"];
  const transmissions = ["All Transmissions", "Automatic", "Manual"];
  
  // Maintenance types
  const maintenanceTypes = [
    "Routine Check",
    "Oil Change",
    "Tire Replacement",
    "Brake Service",
    "Battery Replacement",
    "Air Filter Replacement",
    "Major Service",
    "Repair",
    "Other"
  ];
  
  // Explanation of status determination
  const statusExplanation = "Status will be automatically set based on the scheduled date:" +
    "\n• Scheduled: If date is in the future" +
    "\n• Ongoing: If date is today" + 
    "\n• Completed: If date has passed" +
    "\n• Only 'Cancelled' status can be manually changed";

  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for form inputs
  const [formData, setFormData] = useState({
    brand: "All Brands",
    model: "All Models",
    type: "All Types",
    color: "All Colors",
    transmission: "All Transmissions"
  });

  // State for vehicles and modal
  const [vehicles, setVehicles] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maintenanceDates, setMaintenanceDates] = useState({});
  const [maintenanceType, setMaintenanceType] = useState("Routine Check");
  const [description, setDescription] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [existingMaintenances, setExistingMaintenances] = useState([]);
  const [maintenanceDate, setMaintenanceDate] = useState("");
  
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'Admin') {
      navigate('/login');
    }
    
    // Fetch all vehicles with maintenance status on load
    fetchVehicles();
  }, [navigate]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If brand changes, reset model to default and update available models
    if (name === "brand") {
      // Update formData with the new brand and reset model to default
      setFormData({
        ...formData,
        [name]: value,
        model: "All Models", // Reset model to default empty value
      });

      // Fetch models for the selected brand
      fetchModelsByBrand(value);
    } else {
      // For all other inputs, update normally
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const fetchModelsByBrand = async (brand) => {
    if (brand === "All Brands" || brand === "Select a Brand" || !brand) {
      setModels(["All Models"]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3060/models/${brand}`);
      const data = await response.json();

      if (data) {
        setModels(["All Models", ...data.map(car => car.model)]);
      }
    } catch (error) {
      console.error("Error fetching models for brand:", error);
    }
  };

  // Fetch all vehicles with maintenance status
  const fetchVehicles = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3060/vehicles/maintenance');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
        setHasSearched(true);
        
        // Fetch maintenance dates for all vehicles
        fetchMaintenanceDates(data.map(vehicle => vehicle.vehicle_id));
      } else {
        console.error('Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch scheduled maintenance dates for vehicles
  const fetchMaintenanceDates = async (vehicleIds) => {
    try {
      const dates = {};
      
      await Promise.all(vehicleIds.map(async (vehicleId) => {
        const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/maintenance`);
        if (response.ok) {
          const data = await response.json();
          if (data.maintenance_records && data.maintenance_records.length > 0) {
            // Get scheduled maintenance dates
            const scheduledDates = data.maintenance_records
              .filter(record => record.status === 'Scheduled')
              .map(record => new Date(record.maintenance_date).toLocaleDateString());
            
            dates[vehicleId] = scheduledDates;
          } else {
            dates[vehicleId] = [];
          }
        }
      }));
      
      setMaintenanceDates(dates);
    } catch (error) {
      console.error('Error fetching maintenance dates:', error);
    }
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Build query string from form data
      const queryParams = new URLSearchParams();

      if (formData.brand && formData.brand !== "All Brands") queryParams.append("brand", formData.brand);
      if (formData.model && formData.model !== "All Models") queryParams.append("model", formData.model);
      if (formData.type && formData.type !== "All Types") queryParams.append("type", formData.type);
      if (formData.color && formData.color !== "All Colors") queryParams.append("color", formData.color);
      if (formData.transmission && formData.transmission !== "All Transmissions")
        queryParams.append("transmission", formData.transmission);

      // Make API call with query parameters
      console.log("Search query params:", queryParams.toString());
      const response = await fetch(`http://localhost:3060/vehicles/maintenance?${queryParams.toString()}`);
      const data = await response.json();
      console.log(`Fetched ${data.length} vehicles`);
      setVehicles(data);
      
      // Fetch maintenance dates for filtered vehicles
      if (data.length > 0) {
        fetchMaintenanceDates(data.map(vehicle => vehicle.vehicle_id));
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle schedule maintenance button click
  const handleScheduleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  // Schedule maintenance
  const handleScheduleMaintenance = async (maintenanceData) => {
    try {
      // Make API request to schedule maintenance
      const response = await fetch(`http://localhost:3060/vehicles/${maintenanceData.vehicle_id}/schedule-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_date: maintenanceData.maintenance_date,
          description: maintenanceData.description,
          cost: maintenanceData.cost
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule maintenance');
      }
      
      // Success! Show success message and refresh vehicles
      setSuccessMessage(`Maintenance scheduled successfully for ${selectedVehicle.brand} ${selectedVehicle.model}`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refresh vehicles to show updated data
      fetchVehicles();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      throw error;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show maintenance status
  const getMaintenanceStatus = (vehicle) => {
    const vehicleId = vehicle.vehicle_id;
    const dates = maintenanceDates[vehicleId] || [];
    
    if (dates.length === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No scheduled maintenance
        </span>
      );
    }
    
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Maintenance scheduled
        </span>
        <div className="text-xs text-gray-500">
          Next: {dates[0]}
        </div>
      </div>
    );
  };

  // Fetch existing maintenance records for a vehicle
  useEffect(() => {
    if (selectedVehicle) {
      fetchExistingMaintenances(selectedVehicle.vehicle_id);
    } else {
      setExistingMaintenances([]);
    }
  }, [selectedVehicle]);

  const fetchExistingMaintenances = async (vehicleId) => {
    try {
      const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/maintenance`);
      if (response.ok) {
        const data = await response.json();
        setExistingMaintenances(data.maintenance_records || []);
      } else {
        console.error("Failed to fetch maintenance records");
      }
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsScheduling(true);
    
    try {
      // Format date for backend
      const formattedDate = new Date(maintenanceDate).toISOString().split('T')[0];
      
      // Check if maintenance date has existing bookings
      const bookingCheckResponse = await fetch(`http://localhost:3060/bookings/check-date?vehicleId=${selectedVehicle}&date=${formattedDate}`);
      
      if (bookingCheckResponse.ok) {
        const bookingData = await bookingCheckResponse.json();
        
        if (bookingData.hasBooking) {
          setMessage({
            text: `There is already a booking for this vehicle on ${formattedDate}. Please select a different date.`,
            type: 'error'
          });
          setIsScheduling(false);
          return;
        }
      }
      
      // Schedule maintenance
      const response = await fetch(`http://localhost:3060/vehicles/${selectedVehicle}/schedule-maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduled_date: formattedDate,
          description: maintenanceType + ': ' + description,
          cost: 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          text: `Maintenance scheduled successfully. Status set to: ${result.status}`,
          type: 'success'
        });
        
        // Clear form
        setMaintenanceDate("");
        setMaintenanceType("Routine Check");
        setDescription("");
        
        // Refresh maintenance list
        if (selectedVehicle) {
          fetchExistingMaintenances(selectedVehicle.vehicle_id);
        }
      } else {
        const error = await response.json();
        setMessage({
          text: error.error || "Failed to schedule maintenance",
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      setMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsScheduling(false);
    }
  };

  // Calculate the minimum date (today) for the date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Schedule Vehicle Maintenance</h1>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-800">
            {successMessage}
          </div>
        )}
        
        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Vehicles</h2>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="All Brands">All Brands</option>
                {brands.slice(1).map((brand, index) => (
                  <option key={index} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="All Models">All Models</option>
                {models.slice(1).map((model, index) => (
                  <option key={index} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="All Types">All Types</option>
                {types.slice(1).map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3 mt-4">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Filter Vehicles'}
              </button>
            </div>
          </form>
        </div>

        {/* Vehicles Display */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Vehicles</h2>
            <p className="text-sm text-gray-500">Schedule maintenance for any vehicle</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FaInfoCircle className="mx-auto mb-2 text-gray-400 text-3xl" />
              <p>No vehicles found for the selected filters.</p>
              <p className="text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.vehicle_id} className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Vehicle Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {vehicle.image_path ? (
                      <img 
                        src={vehicle.image_path} 
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <span className="text-gray-400 text-lg">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-sm text-gray-500">{vehicle.type} • {vehicle.year} • {vehicle.color}</p>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        {getMaintenanceStatus(vehicle)}
                      </div>
                      <button
                        onClick={() => handleScheduleClick(vehicle)}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaCalendarPlus className="mr-2" /> Schedule
                      </button>
                    </div>
                    
                    {/* Last Maintenance Info */}
                    {vehicle.last_maintenance_description !== 'No maintenance records' && (
                      <div className="mt-3 text-xs text-gray-500">
                        <p className="font-medium">Last Maintenance:</p>
                        <p className="truncate">{vehicle.last_maintenance_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Maintenance Schedule Modal */}
      {selectedVehicle && (
        <MaintenanceScheduleModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSchedule={handleScheduleMaintenance}
        />
      )}

      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Schedule Vehicle Maintenance</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Vehicle</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                required
              >
                <option value="">-- Select a Vehicle --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.license_plate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                min={today} // Only allow current or future dates
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a date that doesn't have existing bookings.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                required
              >
                {maintenanceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the maintenance"
                required
              ></textarea>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status Information</h3>
              <p className="text-xs text-gray-600 whitespace-pre-line">{statusExplanation}</p>
            </div>

            <div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isScheduling}
              >
                {isScheduling ? "Scheduling..." : "Schedule Maintenance"}
              </button>
            </div>
          </form>

          {message.text && (
            <div
              className={`mt-4 p-3 rounded-md ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {selectedVehicle && existingMaintenances.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Existing Maintenance Records</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {existingMaintenances.map((maintenance) => (
                    <tr key={maintenance.maintenance_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(maintenance.maintenance_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintenance.maintenance_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{maintenance.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            maintenance.status
                          )}`}
                        >
                          {maintenance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get badge color based on status
const getStatusBadgeColor = (status) => {
  switch (status) {
    case "Scheduled":
      return "bg-blue-100 text-blue-800";
    case "Ongoing":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default MaintenanceScheduler; 