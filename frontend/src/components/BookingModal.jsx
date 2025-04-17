import React, { useState, useEffect } from 'react';

const BookingModal = ({ car, isOpen, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or car changes
  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setTotalDays(0);
      setTotalFee(0);
      setError('');
    }
  }, [isOpen, car]);

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
      } else {
        setError('');
        setTotalDays(diffDays);
        setTotalFee(diffDays * car.price_per_day);
      }
    }
  }, [startDate, endDate, car]);

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
                disabled={loading || !!error}
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