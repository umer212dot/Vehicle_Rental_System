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
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome, {adminName}!</p>
      </div>
      
      <div className="mt-6 flex justify-center">
        {/* Admin Dashboard Card */}
      </div>
    </div>
  );
};

export default AdminDashboard; 