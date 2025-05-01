import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle, FaCalendarPlus } from 'react-icons/fa';

// Maintenance Scheduling Modal component
const MaintenanceScheduleModal = ({ vehicle, isOpen, onClose, onSchedule, existingBookings, hasBookingConflict }) => {
  const [formData, setFormData] = useState({
    description: '',
    maintenance_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow's date
    cost: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form if modal is closed or vehicle changes
    if (isOpen) {
      setFormData({
        description: '',
        maintenance_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow's date
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

    // Check if the selected date is today or in the past
    const selectedDate = new Date(formData.maintenance_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      setError('Maintenance can only be scheduled for dates after today');
      return;
    }

    // Check for booking conflicts
    if (hasBookingConflict(formData.maintenance_date)) {
      setError('Cannot schedule maintenance during an active rental period');
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
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Maintenance can only be scheduled for dates after today and outside of rental periods</p>
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
  const [existingBookings, setExistingBookings] = useState([]);

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
  const [existingMaintenances, setExistingMaintenances] = useState([]);
  
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

  // Fetch existing bookings for a vehicle
  const fetchExistingBookings = async (vehicleId) => {
    try {
      const response = await fetch(`http://localhost:3060/rentals/vehicle/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Check if a date falls within any booking period
  const hasBookingConflict = (date) => {
    const selectedDate = new Date(date);
    return existingBookings.some(booking => {
      const rentalDate = new Date(booking.rental_date);
      const returnDate = new Date(booking.return_date);
      return selectedDate >= rentalDate && selectedDate <= returnDate;
    });
  };

  // Handle schedule maintenance button click
  const handleScheduleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    fetchExistingBookings(vehicle.vehicle_id);
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
      // Log the API URL and request body for debugging
      console.log('Scheduling maintenance with:', {
        url: `http://localhost:3060/vehicles/${maintenanceData.vehicle_id}/schedule-maintenance`,
        body: {
          scheduled_date: maintenanceData.maintenance_date,
          description: maintenanceData.description,
          cost: maintenanceData.cost
        }
      });
      
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
      
      // Parse the response JSON regardless of status
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }
      
      if (!response.ok) {
        console.error('Server response error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(responseData.error || responseData.details || 'Failed to schedule maintenance');
      }
      
      // Success! Show success message and refresh vehicles
      setSuccessMessage(`Maintenance scheduled successfully for ${selectedVehicle.brand} ${selectedVehicle.model}. Status: ${responseData.status || 'Scheduled'}`);
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
                    <p className="text-sm text-gray-500">{vehicle.type} • {vehicle.year} • {vehicle.vehicle_no_plate} • {vehicle.color}</p>
                    
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
          existingBookings={existingBookings}
          hasBookingConflict={hasBookingConflict}
        />
      )}
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