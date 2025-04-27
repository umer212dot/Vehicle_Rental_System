// function Dashboard() {
//     return (
//         <div>
//             <h1>Customer Panel</h1>
//             <p className="mt-2 text-lg text-gray-600">Welcome!</p>
//         </div>
//     )
// }

// export default Dashboard;

import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get admin name from localStorage
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome, {userName}!</p>
      </div>
    </div>
  );
};

export default Dashboard;
