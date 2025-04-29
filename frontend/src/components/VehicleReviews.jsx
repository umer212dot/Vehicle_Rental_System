import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

function VehicleReviews() {
    const [vehicle, setVehicle] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState({ average: 0, count: 0 });
    const [isAdmin, setIsAdmin] = useState(false);
    
    const { vehicleId } = useParams();
    const navigate = useNavigate();
    
    useEffect(() => {
        // Check if user is admin
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'Admin') {
            setIsAdmin(true);
        }
        
        fetchVehicleReviews();
        fetchVehicleRating();
    }, [vehicleId]);
    
    const fetchVehicleReviews = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/reviews`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch vehicle reviews');
            }
            
            const data = await response.json();
            setVehicle(data.vehicle);
            setReviews(data.reviews);
        } catch (err) {
            console.error('Error fetching vehicle reviews:', err);
            setError('Failed to load reviews. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchVehicleRating = async () => {
        try {
            const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/rating`);
            
            if (response.ok) {
                const data = await response.json();
                setRating({
                    average: parseFloat(data.average_rating) || 0,
                    count: parseInt(data.review_count) || 0
                });
            }
        } catch (err) {
            console.error('Error fetching vehicle rating:', err);
        }
    };
    
    const handleRentNowClick = () => {
        // Check if the user is logged in by checking localStorage
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const customerId = localStorage.getItem('customerId');
        
        if (!isAuthenticated || !customerId) {
            // If not logged in, redirect to login page
            alert('Please log in to book a car');
            navigate('/login');
            return;
        }
        
        // Navigate to search page with this vehicle info
        navigate('/search', { 
            state: { 
                selectedVehicleId: vehicleId,
                bookNow: true 
            } 
        });
    };
    
    // Render stars for a given rating
    const renderStars = (ratingValue) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className="mr-1"
                size={16}
                color={index < ratingValue ? "#ffc107" : "#e4e5e9"}
            />
        ));
    };
    
    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'No date available';
        
        try {
            // Handle ISO string format
            if (dateString.includes('T')) {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            // Handle PostgreSQL date format (YYYY-MM-DD)
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
                const day = parseInt(parts[2]);
                
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    return new Date(year, month, day).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            }
            
            return dateString; // Return as is if we can't parse it
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid date';
        }
    };
    
    const getBackUrl = () => {
        const userRole = localStorage.getItem('userRole');
        return userRole === 'Admin' ? '/admin/vehicles' : '/search';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                    <Link 
                        to={getBackUrl()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to {isAdmin ? 'Vehicles' : 'Search'}
                    </Link>
                </div>
            </div>
        );
    }
    
    if (!vehicle) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                        <p className="text-yellow-700">Vehicle not found</p>
                    </div>
                    <Link 
                        to={getBackUrl()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                    >
                        Back to {isAdmin ? 'Vehicles' : 'Search'}
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link 
                        to={getBackUrl()}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        ← Back to {isAdmin ? 'Vehicles' : 'Search'}
                    </Link>
                </div>
                
                {/* Vehicle Details */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <div className="md:flex">
                        <div className="md:w-1/3">
                            <img 
                                src={vehicle.image_path || "https://via.placeholder.com/300x200?text=No+Image"} 
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="w-full h-48 md:h-full object-cover"
                            />
                        </div>
                        <div className="p-6 md:w-2/3">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                {vehicle.brand} {vehicle.model}
                            </h1>
                            <p className="text-gray-600 mb-4">
                                {vehicle.type} • {vehicle.color} • {vehicle.year} • {vehicle.transmission}
                            </p>
                            <div className="flex items-center mb-4">
                                <div className="flex mr-2">
                                    {renderStars(Math.round(rating.average))}
                                </div>
                                <p className="text-gray-700">
                                    {rating.count > 0 
                                        ? `${rating.average.toFixed(1)} out of 5 (${rating.count} reviews)` 
                                        : 'No reviews yet'}
                                </p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-2xl font-bold text-gray-800">${vehicle.price_per_day}/day</p>
                                {!isAdmin && (
                                    <button 
                                        onClick={handleRentNowClick}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Rent Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Reviews Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                        Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
                    </h2>
                    
                    {reviews.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">This vehicle has no reviews yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.review_id} className="border-b pb-6 last:border-b-0 last:pb-0">
                                    <div className="flex items-center mb-2">
                                        <div className="flex mr-2">
                                            {renderStars(review.rating)}
                                        </div>
                                        <span className="font-medium text-gray-700">
                                            {review.rating} out of 5
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-700 mb-3">{review.comments}</p>
                                    
                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                        <p>By {review.customer_name}</p>
                                        <p>{formatDate(review.review_date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VehicleReviews;