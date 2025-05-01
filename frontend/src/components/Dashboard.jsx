import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaClock, FaCheck, FaHourglassHalf } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
    const [rentals, setRentals] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        ongoing: 0,
        completed: 0,
        pending: 0
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [popularVehicles, setPopularVehicles] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const userRole = localStorage.getItem('userRole');
        if(userRole === "Admin") {
            setIsAdmin(true);
        }
        
        fetchDashboardData(userRole);
    }, []);
    useEffect(() => {
        console.log("Vehicle Types:", vehicleTypes);
    }, [vehicleTypes]);

    const fetchDashboardData = async (userRole) => {
        try {
            const customerId = localStorage.getItem('customerId');
            const endpoint = (userRole==="Admin") ? '/rentals/all' : `/rentals/customer/${customerId}`;
            
            const response = await fetch(`http://localhost:3060${endpoint}`);
            const data = await response.json();       
            // Ensure data is an array before setting it to rentals
            const rentalData = Array.isArray(data) ? data : [];
            setRentals(rentalData);
            
            // Calculate statistics using the verified array
            const stats = {
                total: rentalData.length,
                ongoing: rentalData.filter(rental => rental.status === 'Ongoing').length,
                completed: rentalData.filter(rental => rental.status === 'Completed').length,
                pending: rentalData.filter(rental => rental.status === 'Awaiting Approval').length
            };
            setStats(stats);

            if (userRole === "Admin") {
                // Fetch popular vehicles
                const popularResponse = await fetch('http://localhost:3060/analytics/popular-vehicles');
                const popularData = await popularResponse.json();
                setPopularVehicles(Array.isArray(popularData) ? popularData : []);

                // Fetch vehicle type distribution
                const typesResponse = await fetch('http://localhost:3060/analytics/vehicle-types');
                const result = await typesResponse.json();
                const typesData = result.map(item => ({
                    ...item,
                    count: Number(item.count) // Convert count to a number
                }));
                setVehicleTypes(Array.isArray(typesData) ? typesData : []);

                // Fetch revenue data
                const revenueResponse = await fetch('http://localhost:3060/analytics/revenue');
                const revenueData = await revenueResponse.json();
                setRevenue(Array.isArray(revenueData) ? revenueData : []);
            } else {
                // For customers with no current rentals, fetch popular available vehicles as suggestions
                const ongoingRentals = rentalData.filter(rental => rental.status === 'Ongoing');
                if (ongoingRentals.length === 0) {
                    const suggestionsResponse = await fetch('http://localhost:3060/analytics/available-popular-vehicles');
                    const suggestionsData = await suggestionsResponse.json();
                    setPopularVehicles(Array.isArray(suggestionsData) ? suggestionsData : []);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Initialize empty arrays on error
            setRentals([]);
            setPopularVehicles([]);
            setVehicleTypes([]);
            setRevenue([]);
            setStats({
                total: 0,
                ongoing: 0,
                completed: 0,
                pending: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    const StatCard = ({ title, value, icon: Icon }) => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold mt-2">{value}</p>
                </div>
                <div className="text-blue-500">
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent,name }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        let baseAngle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
        if (x < cx) {
            baseAngle += 180; // Flip the label if it's on the left side
        }
        return (
          <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={14}
            transform={`rotate(${baseAngle}, ${x}, ${y})`}
          >
            {`${name}: ${(percent * 100).toFixed(0)}%`}
          </text>
        );
      };
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                {isAdmin && (
                    <Link to="/admin/vehicles" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Manage Vehicles
                    </Link>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Rentals" value={stats.total} icon={FaCar} />
                <StatCard title="Ongoing Rentals" value={stats.ongoing} icon={FaClock} />
                <StatCard title="Completed Rentals" value={stats.completed} icon={FaCheck} />
                <StatCard title="Pending Rentals" value={stats.pending} icon={FaHourglassHalf} />
            </div>

            {/* Admin Analytics Section */}
            {isAdmin && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Analytics Section</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Revenue Chart</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={revenue}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="month" 
                                            tickFormatter={formatDate}
                                        />
                                        <YAxis 
                                            tickFormatter={value => formatCurrency(value)}
                                        />
                                        <Tooltip 
                                            formatter={value => formatCurrency(value)}
                                            labelFormatter={value => formatDate(value)}
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="total_revenue" 
                                            name="Revenue" 
                                            fill="#0088FE" 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Popular Vehicles */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Popular Vehicles</h3>
                                <div className="space-y-4">
                                    {popularVehicles.map((vehicle, index) => (
                                        <div key={vehicle.vehicle_id} className="flex items-center space-x-3">
                                            <div className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                                                #{index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {vehicle.brand} {vehicle.model}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {vehicle.rental_count} rentals
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vehicle Type Distribution */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Vehicle Distribution</h3>
                                <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={vehicleTypes}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                labelPosition="center"
                                                
                                                label={renderCustomizedLabel}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="count"
                                                nameKey="type"
                                            >
                                                {vehicleTypes.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Currently Rented Vehicles or Suggestions */}
            <div>
                {Array.isArray(rentals) && rentals.filter(rental => rental.status === 'Ongoing').length > 0 ? (
                    <>
                        <h2 className="text-xl font-bold mb-4">Currently Rented Vehicles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rentals
                                .filter(rental => rental.status === 'Ongoing')
                                .map(rental => (
                                    <div key={rental.rental_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <img 
                                            src={rental.vehicle.image_path} 
                                            alt={`${rental.vehicle.brand} ${rental.vehicle.model}`}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-2">
                                                {rental.vehicle.brand} {rental.vehicle.model}
                                            </h3>
                                            <p className="text-gray-600">
                                                Return Date: {new Date(rental.return_date).toLocaleDateString()}
                                            </p>
                                            {isAdmin && rental.customer && (
                                                <p className="text-gray-600 mt-2">
                                                    Rented by: {rental.customer.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                ) : !isAdmin && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Popular Vehicles Available Now</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {popularVehicles.map(vehicle => (
                                <div key={vehicle.vehicle_id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                                    <img 
                                        src={vehicle.image_path} 
                                        alt={`${vehicle.brand} ${vehicle.model}`}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg mb-2 truncate" title={`${vehicle.brand} ${vehicle.model}`}>
                                            {vehicle.brand} {vehicle.model}
                                        </h3>
                                        <p className="text-gray-600">
                                            Daily Rate: ${vehicle.price_per_day}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 mb-3">
                                            {vehicle.rental_count} previous rentals
                                        </p>
                                        <button 
                                            onClick={() => navigate(`/search?vehicleId=${vehicle.vehicle_id}`)}
                                            className="mt-auto w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Rent Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;

