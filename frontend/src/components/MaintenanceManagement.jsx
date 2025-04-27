import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MaintenanceManagement = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [notifyWhenDue, setNotifyWhenDue] = useState(true);
  const navigate = useNavigate();

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleNotifyChange = (e) => {
    setNotifyWhenDue(e.target.checked);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      if (selectedOption === 'track') {
        // Navigate to the vehicle maintenance tracker page
        navigate('/admin/vehicle-maintenance');
      } else if (selectedOption === 'schedule') {
        // Navigate to the maintenance scheduler page
        navigate('/admin/maintenance-scheduler');
        
        // Store notification preference in localStorage (to be used by the scheduler)
        localStorage.setItem('notifyMaintenanceDue', notifyWhenDue.toString());
      }
    } else {
      alert('Please select an option');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
        <p className="mt-2 text-lg text-gray-600">Track and schedule vehicle maintenance</p>
      </div>
      
      <div className="mt-6 max-w-xl mx-auto bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <label htmlFor="maintenance-option" className="block text-sm font-medium text-gray-700 mb-2">
              Select Maintenance Option
            </label>
            <select
              id="maintenance-option"
              name="maintenance-option"
              value={selectedOption}
              onChange={handleOptionChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select an option</option>
              <option value="track">Track Vehicle Maintenance Records</option>
              <option value="schedule">Schedule Upcoming Maintenance Tasks</option>
            </select>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="notify-admin"
                name="notify-admin"
                type="checkbox"
                checked={notifyWhenDue}
                onChange={handleNotifyChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notify-admin" className="ml-2 block text-sm text-gray-900">
                Notify Admin when maintenance is due
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceManagement; 