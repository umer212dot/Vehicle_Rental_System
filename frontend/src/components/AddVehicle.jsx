import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddVehicle = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        brand: '',
        customBrand: '',
        model: '',
        type: '',
        customType: '',
        color: '',
        customColor: '',
        transmission: '',
        year: new Date().getFullYear(),
        price_per_day: '',
        image_path: '',
        vehicle_no_plate: ''
    });

    // Predefined options for dropdowns
    const types = ["Sedan", "SUV", "Hatchback", "Convertible", "Hybrid"];
    const colors = ["Black", "White", "Silver", "Blue", "Red", "Gray"];
    const transmissions = ["Automatic", "Manual"];
    const brands = ["Volvo", "BMW", "Audi", "Mercedes", "Toyota", "Honda"];

    useEffect(() => {
        // Check if user is admin
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const userRole = localStorage.getItem('userRole');
        
        if (!isAuthenticated || userRole !== 'Admin') {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Use custom values if selected, otherwise use dropdown values
            const finalBrand = formData.brand === 'custom' ? formData.customBrand : formData.brand;
            const finalColor = formData.color === 'custom' ? formData.customColor : formData.color;
            const finalType = formData.type === 'custom' ? formData.customType : formData.type;

            const submitData = {
                ...formData,
                brand: finalBrand,
                color: finalColor,
                type: finalType
            };

            // Remove extra fields that shouldn't be sent to the server
            delete submitData.customBrand;
            delete submitData.customColor;
            delete submitData.customType;

            const response = await fetch('http://localhost:3060/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userRole')}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add vehicle');
            }

            navigate('/admin/vehicles');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Vehicle</h2>
                <button
                    onClick={() => navigate('/admin/vehicles')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Back to Vehicles
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Brand:</label>
                        <select
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mb-2"
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                            <option value="custom">Other</option>
                        </select>
                        {formData.brand === 'custom' && (
                            <input
                                type="text"
                                name="customBrand"
                                value={formData.customBrand}
                                onChange={handleChange}
                                placeholder="Enter Brand Name"
                                required
                                className="w-full p-2 border rounded"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Model:</label>
                        <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Type:</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mb-2"
                        >
                            <option value="">Select Type</option>
                            {types.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                            <option value="custom">Other</option>
                        </select>
                        {formData.type === 'custom' && (
                            <input
                                type="text"
                                name="customType"
                                value={formData.customType}
                                onChange={handleChange}
                                placeholder="Enter Type"
                                required
                                className="w-full p-2 border rounded"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Color:</label>
                        <select
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mb-2"
                        >
                            <option value="">Select Color</option>
                            {colors.map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                            <option value="custom">Other</option>
                        </select>
                        {formData.color === 'custom' && (
                            <input
                                type="text"
                                name="customColor"
                                value={formData.customColor}
                                onChange={handleChange}
                                placeholder="Enter Color"
                                required
                                className="w-full p-2 border rounded"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Transmission:</label>
                        <select
                            name="transmission"
                            value={formData.transmission}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Transmission</option>
                            {transmissions.map(transmission => (
                                <option key={transmission} value={transmission}>{transmission}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Year:</label>
                        <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            min="2000"
                            max={new Date().getFullYear() + 1}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Price per Day ($):</label>
                        <input
                            type="number"
                            name="price_per_day"
                            value={formData.price_per_day}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Vehicle Number Plate</label>
                        <input
                            type="text"
                            name="vehicle_no_plate"
                            value={formData.vehicle_no_plate}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">Image Path:</label>
                        <input
                            type="text"
                            name="image_path"
                            value={formData.image_path}
                            onChange={handleChange}
                            required
                            placeholder="Enter image URL or path"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Add Vehicle
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddVehicle;