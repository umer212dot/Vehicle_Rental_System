import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import AdminNavbar from './AdminNavbar';
import { FaTools, FaClipboardList, FaCalendarCheck, FaExclamationTriangle, FaMoneyBillWave, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';

// MaintenanceStatusEditor component for updating status
const MaintenanceStatusEditor = ({ maintenanceId, currentStatus, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:3060/maintenance/${maintenanceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      if (res.ok) {
        setError('');
        onStatusUpdated('Cancelled', maintenanceId); // Call the callback to update the UI
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Error updating status: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-1">
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}
      <div className="flex items-center space-x-2">
        {(currentStatus !== 'Cancelled' && currentStatus !== 'Good Condition') && (
          <button
            onClick={updateStatus}
            disabled={isUpdating || currentStatus === 'Cancelled' || currentStatus === 'Good Condition'}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Cancel Maintenance'}
          </button>
        )}
      </div>
      {currentStatus !== 'Cancelled' && currentStatus !== 'Good Condition' && (
        <div className="text-xs text-gray-500">
        </div>
      )}
    </div>
  );
};

const VehicleMaintenanceTracker = () => {
  // Sample data for dropdowns - same as SearchPage for consistency
  const brands = ["All Brands", "Volvo", "BMW", "Audi", "Mercedes", "Toyota", "Honda"];
  const [models, setModels] = useState(["All Models"]);
  const types = ["All Types", "Sedan", "SUV", "Hatchback", "Convertible", "Hybrid"];
  const colors = ["All Colors", "Black", "White", "Silver", "Blue", "Red", "Gray"];
  const transmissions = ["All Transmissions", "Automatic", "Manual"];
  const maintenanceStatuses = [
    "All Statuses", 
    "Completed", 
    "Ongoing", 
    "Scheduled", 
    "Cancelled",
    "Good Condition"
  ];

  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");

  // State for form inputs
  const [formData, setFormData] = useState({
    brand: "All Brands",
    model: "All Models",
    type: "All Types",
    color: "All Colors",
    transmission: "All Transmissions",
    maintenanceStatus: "All Statuses"
  });

  // State for vehicles and their maintenance records
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
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
        
        // After vehicles are loaded, fetch their maintenance records
        if (data.length > 0) {
          const vehicleIds = data.map(vehicle => vehicle.vehicle_id);
          fetchMaintenanceRecords(vehicleIds);
        }
      } else {
        console.error('Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch maintenance records for all vehicles or filtered vehicles
  const fetchMaintenanceRecords = async (vehicleIds) => {
    setIsLoading(true);
    
    try {
      let allRecords = [];
      
      // Directly fetch all maintenance records if no specific vehicle IDs
      if (!vehicleIds || vehicleIds.length === 0) {
        const response = await fetch('http://localhost:3060/maintenance/all');
        if (response.ok) {
          const data = await response.json();
          // Add vehicle information to each maintenance record
          for (const record of data) {
            // Fetch vehicle info for this record
            try {
              const vehicleResponse = await fetch(`http://localhost:3060/vehicles/${record.vehicle_id}`);
              if (vehicleResponse.ok) {
                const vehicleData = await vehicleResponse.json();
                allRecords.push({
                  ...record,
                  brand: vehicleData.brand,
                  model: vehicleData.model,
                  type: vehicleData.type,
                  color: vehicleData.color,
                  year: vehicleData.year,
                  price_per_day: vehicleData.price_per_day,
                  image_path: vehicleData.image_path,
                  transmission: vehicleData.transmission
                });
              }
            } catch (vehicleError) {
              console.error(`Error fetching vehicle ${record.vehicle_id}:`, vehicleError);
            }
          }
        }
      } else {
        // Get maintenance records for specific vehicles
        const promises = vehicleIds.map(vehicleId => 
          fetch(`http://localhost:3060/vehicles/${vehicleId}/maintenance`)
            .then(res => res.json())
            .catch(error => {
              console.error(`Error fetching maintenance for vehicle ${vehicleId}:`, error);
              return { maintenance_records: [] };
            })
        );
        
        const results = await Promise.all(promises);
        
        // Combine all maintenance records with vehicle info
        results.forEach((result, index) => {
          if (result.maintenance_records && result.maintenance_records.length > 0) {
            const vehicleId = vehicleIds[index];
            const vehicle = vehicles.find(v => v.vehicle_id === vehicleId) || {};
            
            const recordsWithVehicleInfo = result.maintenance_records.map(record => ({
              ...record,
              brand: result.vehicle?.brand || vehicle.brand,
              model: result.vehicle?.model || vehicle.model,
              type: result.vehicle?.type || vehicle.type,
              color: result.vehicle?.color || vehicle.color,
              year: result.vehicle?.year || vehicle.year,
              price_per_day: result.vehicle?.price_per_day || vehicle.price_per_day,
              image_path: result.vehicle?.image_path || vehicle.image_path,
              transmission: result.vehicle?.transmission || vehicle.transmission
            }));
            
            allRecords = [...allRecords, ...recordsWithVehicleInfo];
          }
        });
      }
      
      console.log(`Fetched ${allRecords.length} maintenance records`);
      setMaintenanceRecords(allRecords);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch maintenance statistics
  const fetchMaintenanceStats = async () => {
    // This function is no longer needed, but keeping empty implementation
    // to avoid having to update all references
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
      if (formData.maintenanceStatus && formData.maintenanceStatus !== "All Statuses")
        queryParams.append("maintenanceStatus", formData.maintenanceStatus);

      // Make API call with query parameters
      console.log("Search query params:", queryParams.toString());
      const response = await fetch(`http://localhost:3060/vehicles/maintenance?${queryParams.toString()}`);
      const data = await response.json();
      console.log(`Fetched ${data.length} vehicles`);
      setVehicles(data);
      
      // Get maintenance records for the filtered vehicles
      if (data.length > 0) {
        const vehicleIds = data.map(vehicle => vehicle.vehicle_id);
        fetchMaintenanceRecords(vehicleIds);
      } else {
        setMaintenanceRecords([]);
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add maintenance record
  const handleAddMaintenance = (vehicleId) => {
    navigate(`/admin/add-maintenance/${vehicleId}`);
  };

  // Handle status update callback from MaintenanceStatusEditor
  const handleStatusUpdated = (newStatus, maintenanceId) => {
    // Update the records in state
    const updatedRecords = maintenanceRecords.map(record => {
      if (record.maintenance_id === maintenanceId) {
        return { ...record, status: newStatus };
      }
      return record;
    });
    
    setMaintenanceRecords(updatedRecords);
    
    // Show success message
    setUpdateStatus("success");
    setUpdateMessage(`Maintenance has been cancelled successfully`);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setUpdateMessage("");
      setUpdateStatus("");
    }, 5000);
    
    // Refresh vehicles data to reflect changes
    fetchVehicles();
  };

  // Render maintenance status badge
  const renderMaintenanceStatus = (status) => {
    if (!status) return (
      <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs font-medium">
        No Records
      </span>
    );
    
    switch (status) {
      case 'Completed':
        return (
          <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs font-medium flex items-center">
            <FaCalendarCheck className="mr-1" /> Completed
          </span>
        );
      case 'Ongoing':
        return (
          <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs font-medium flex items-center">
            <FaTools className="mr-1" /> Ongoing
          </span>
        );
      case 'Scheduled':
        return (
          <span className="bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full text-xs font-medium flex items-center">
            <FaClipboardList className="mr-1" /> Scheduled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-red-100 text-red-800 py-1 px-2 rounded-full text-xs font-medium flex items-center">
            <FaExclamationTriangle className="mr-1" /> Cancelled
          </span>
        );
      case 'Good Condition':
        return (
          <span className="bg-purple-100 text-purple-800 py-1 px-2 rounded-full text-xs font-medium flex items-center">
            <FaInfoCircle className="mr-1" /> Good Condition
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs font-medium">
            {status}
          </span>
        );
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

  // Format cost with currency symbol
  const formatCost = (cost) => {
    if (cost === undefined || cost === null) return 'N/A';
    return `$${parseFloat(cost).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <temp1 />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Vehicle Maintenance Records</h1>
        
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Status</label>
              <select
                name="maintenanceStatus"
                value={formData.maintenanceStatus}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="All Statuses">All Statuses</option>
                {maintenanceStatuses.slice(1).map((status, index) => (
                  <option key={index} value={status}>{status}</option>
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

        {/* Status update message */}
        {updateMessage && (
          <div className={`mb-4 p-4 rounded-md ${updateStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {updateMessage}
          </div>
        )}

        Maintenance Records Display
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Maintenance Records</h2>
            <p className="text-sm text-gray-500">Showing all maintenance records for the selected filters</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : maintenanceRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FaInfoCircle className="mx-auto mb-2 text-gray-400 text-3xl" />
              <p>No maintenance records found for the selected filters.</p>
              <p className="text-sm mt-1">Try adjusting your filters or add maintenance records for vehicles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Update Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maintenanceRecords.map((record) => (
                    <tr key={record.maintenance_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {record.image_path ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={record.image_path} alt={`${record.brand} ${record.model}`} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">{record.brand?.charAt(0)}</span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.brand} {record.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.type} ({record.year})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{record.maintenance_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {record.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderMaintenanceStatus(record.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <MaintenanceStatusEditor 
                          maintenanceId={record.maintenance_id}
                          currentStatus={record.status}
                          onStatusUpdated={handleStatusUpdated}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-1" />
                          {formatDate(record.maintenance_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="text-green-500 mr-1" />
                          {formatCost(record.cost)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleMaintenanceTracker; 