import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    // Get admin name from localStorage
    const name = localStorage.getItem('userName');
    if (name) {
      setAdminName(name);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome, {adminName}!</p>
      </div>
      
      <div className="mt-6 flex justify-center">
        {/* Admin Dashboard Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg max-w-md w-full">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Management</h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>Track and schedule vehicle maintenance</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.location.href = '#/admin/maintenance'}
              >
                Manage Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 