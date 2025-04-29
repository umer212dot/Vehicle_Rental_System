import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const AdminVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Sample data for dropdowns
    const brands = ["All Brands", "Volvo", "BMW", "Audi", "Mercedes", "Toyota", "Honda"];
    const [models, setModels] = useState(["All Models"]);
    const types = ["All Types", "Sedan", "SUV", "Hatchback", "Convertible", "Hybrid"];
    const colors = ["All Colors", "Black", "White", "Silver", "Blue", "Red", "Gray"];
    const transmissions = ["All Transmissions", "Automatic", "Manual"];
    
    const [searchParams, setSearchParams] = useState({
        brand: "All Brands",
        model: "All Models",
        type: "All Types",
        color: "All Colors",
        transmission: "All Transmissions"
    });
    
    const [availabilitySort, setAvailabilitySort] = useState('all'); // 'all', 'available-first', 'available-last'
    
    const itemsPerPage = 20;
    const maxPageButtons = 5;

    useEffect(() => {
        fetchVehicles();
    }, [currentPage]);

    const fetchModelsByBrand = async (brand) => {
        if (brand === "All Brands") {
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "brand") {
            setSearchParams({
                ...searchParams,
                [name]: value,
                model: "All Models"
            });
            fetchModelsByBrand(value);
        } else {
            setSearchParams({
                ...searchParams,
                [name]: value
            });
        }
    };

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3060/search');
            const data = await response.json();
            setVehicles(data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sort vehicles by availability
    const sortVehiclesByAvailability = (vehicles, sortType) => {
        if (sortType === 'all') return vehicles;
        
        return [...vehicles].sort((a, b) => {
            if (sortType === 'available-first') {
                return b.availability - a.availability;
            } else {
                return a.availability - b.availability;
            }
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            
            if (searchParams.brand !== "All Brands") queryParams.append('brand', searchParams.brand);
            if (searchParams.model !== "All Models") queryParams.append('model', searchParams.model);
            if (searchParams.type !== "All Types") queryParams.append('type', searchParams.type);
            if (searchParams.color !== "All Colors") queryParams.append('color', searchParams.color);
            if (searchParams.transmission !== "All Transmissions") queryParams.append('transmission', searchParams.transmission);

            const response = await fetch(`http://localhost:3060/search?${queryParams.toString()}`);
            const data = await response.json();
            const sortedData = sortVehiclesByAvailability(data, availabilitySort);
            setVehicles(sortedData);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error searching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate pagination values
    const totalPages = Math.ceil(vehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVehicles = vehicles.slice(startIndex, endIndex);

    // Generate page numbers
    const getPageNumbers = () => {
        let pages = [];
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (totalPages > maxPageButtons && endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
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
                <h1 className="text-2xl font-bold">Vehicles Management</h1>
                <Link to="/admin/add-vehicle" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add New Vehicle
                </Link>
            </div>

            {/* Search Form */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <select
                            name="brand"
                            value={searchParams.brand}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {brands.map((brand, index) => (
                                <option key={index} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <select
                            name="model"
                            value={searchParams.model}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {models.map((model, index) => (
                                <option key={index} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={searchParams.type}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {types.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <select
                            name="color"
                            value={searchParams.color}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {colors.map((color, index) => (
                                <option key={index} value={color}>{color}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                        <select
                            name="transmission"
                            value={searchParams.transmission}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {transmissions.map((transmission, index) => (
                                <option key={index} value={transmission}>{transmission}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                        >
                            <FaSearch className="mr-2" />
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {/* Availability Sort */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                    Showing {currentVehicles.length} of {vehicles.length} vehicles
                </div>
                <div className="flex items-center">
                    <span className="mr-3 text-gray-700 font-medium">Availability:</span>
                    <select
                        value={availabilitySort}
                        onChange={(e) => {
                            setAvailabilitySort(e.target.value);
                            if (vehicles.length > 0) {
                                setVehicles(sortVehiclesByAvailability(vehicles, e.target.value));
                            }
                        }}
                        className="border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="all">No Sort</option>
                        <option value="available-first">Available First</option>
                        <option value="available-last">Available Last</option>
                    </select>
                </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {currentVehicles.map(vehicle => (
                    <div key={vehicle.vehicle_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <img 
                            src={vehicle.image_path} 
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 truncate" title={`${vehicle.brand} ${vehicle.model}`}>
                                {vehicle.brand} {vehicle.model}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>Type: {vehicle.type}</p>
                                <p>Color: {vehicle.color}</p>
                                <p>Year: {vehicle.year}</p>
                                <p>Price per day: ${vehicle.price_per_day}</p>
                                <p className={`font-semibold ${vehicle.availability ? 'text-green-600' : 'text-red-600'}`}>
                                    {vehicle.availability ? 'Available' : 'Not Available'}
                                </p>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <Link 
                                    to={`/admin/edit-vehicle/${vehicle.vehicle_id}`}
                                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
                                >
                                    Edit
                                </Link>
                                <Link 
                                    to={`/vehicle/${vehicle.vehicle_id}/reviews`}
                                    className="flex-1 bg-gray-600 text-white text-center py-2 rounded hover:bg-gray-700"
                                >
                                    Reviews
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        First
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {getPageNumbers().map(number => (
                        <button
                            key={number}
                            onClick={() => setCurrentPage(number)}
                            className={`px-4 py-2 rounded ${
                                currentPage === number
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {number}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Last
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminVehicles;