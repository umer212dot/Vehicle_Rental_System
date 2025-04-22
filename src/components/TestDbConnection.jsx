import React, { useState, useEffect } from 'react';

function TestDbConnection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:3060/search?availability=true');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        setVehicles(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return <div>Loading vehicles data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Available Vehicles</h2>
      {vehicles.length === 0 ? (
        <p>No vehicles found in database.</p>
      ) : (
        <div>
          <p>Found {vehicles.length} vehicles:</p>
          <ul>
            {vehicles.map(vehicle => (
              <li key={vehicle.vehicle_id}>
                {vehicle.brand} {vehicle.model} ({vehicle.year}) - ${vehicle.price_per_day}/day
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TestDbConnection; 