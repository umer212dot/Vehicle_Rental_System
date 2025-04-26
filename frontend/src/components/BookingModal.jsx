import React, { useState, useEffect } from 'react';

const BookingModal = ({ car, isOpen, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maintenanceDates, setMaintenanceDates] = useState([]);
  const [maintenanceConflict, setMaintenanceConflict] = useState(false);

  // Reset form when modal opens/closes or car changes
  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setTotalDays(0);
      setTotalFee(0);
      setError('');
      setMaintenanceConflict(false);
      
      // Fetch maintenance dates for this vehicle
      if (car && car.vehicle_id) {
        fetchMaintenanceDates(car.vehicle_id);
      }
    }
  }, [isOpen, car]);

  // Fetch maintenance dates for the vehicle
  const fetchMaintenanceDates = async (vehicleId) => {
    try {
      const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/maintenance`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.maintenance_records && data.maintenance_records.length > 0) {
          // Extract dates of scheduled maintenance
          const scheduledMaintenance = data.maintenance_records
            .filter(record => record.status === 'Scheduled')
            .map(record => ({
              date: new Date(record.maintenance_date),
              description: record.description
            }));
          
          setMaintenanceDates(scheduledMaintenance);
        }
      }
    } catch (error) {
      console.error('Error fetching maintenance dates:', error);
    }
  };

  // Check if a date conflicts with scheduled maintenance
  const checkMaintenanceConflict = (start, end) => {
    if (!start || !end || maintenanceDates.length === 0) return false;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if any maintenance date falls within the booking period
    for (const maintenance of maintenanceDates) {
      const maintenanceDate = maintenance.date;
      
      if (maintenanceDate >= startDate && maintenanceDate <= endDate) {
        return {
          conflict: true,
          date: maintenanceDate.toLocaleDateString(),
          description: maintenance.description
        };
      }
    }
    
    return { conflict: false };
  };

  // Calculate total days and fee when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate difference in days
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        setError('Return date must be after rental date');
        setTotalDays(0);
        setTotalFee(0);
        setMaintenanceConflict(false);
      } else {
        // Check for maintenance conflicts
        const conflict = checkMaintenanceConflict(startDate, endDate);
        
        if (conflict.conflict) {
          setMaintenanceConflict(true);
          setError(`Cannot book: Vehicle scheduled for maintenance on ${conflict.date} (${conflict.description})`);
          setTotalDays(diffDays);
          setTotalFee(diffDays * car.price_per_day);
        } else {
          setMaintenanceConflict(false);
          setError('');
          setTotalDays(diffDays);
          setTotalFee(diffDays * car.price_per_day);
        }
      }
    }
  }, [startDate, endDate, car, maintenanceDates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setError('Please select both rental and return dates');
      return;
    }
    
    if (totalDays <= 0) {
      setError('Invalid date range');
      return;
    }
    
    if (maintenanceConflict) {
      return; // Prevent submission if there's a maintenance conflict
    }
    
    setLoading(true);
    
    try {
      // Get customer ID from localStorage (assuming it's stored there after login)
      const customerId = localStorage.getItem('customerId');
      
      if (!customerId) {
        setError('You must be logged in to book a car');
        setLoading(false);
        return;
      }
      
      // Call onConfirm function passed from parent component
      await onConfirm({
        customer_id: customerId,
        vehicle_id: car.vehicle_id,
        rental_date: startDate,
        return_date: endDate,
        total_fee: totalFee,
        status: 'Pending'
      });
      
      onClose();
    } catch (err) {
      setError('Failed to book the car. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Book {car.brand} {car.model}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Price per day: <span className="font-semibold">${car.price_per_day}</span></p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rental Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Show maintenance dates if any */}
            {maintenanceDates.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-1">Vehicle Maintenance Dates:</p>
                <ul className="text-xs text-yellow-700 list-disc pl-4">
                  {maintenanceDates.map((maintenance, index) => (
                    <li key={index}>{maintenance.date.toLocaleDateString()} - {maintenance.description}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Days:</span>
                <span className="font-semibold">{totalDays}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Total Fee:</span>
                <span className="font-bold">${totalFee}</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="mr-3 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || !!error || maintenanceConflict}
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;