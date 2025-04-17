import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BookingModal from './BookingModal';
import { FaStar } from 'react-icons/fa';

const CarDetailsCard = ({ car, autoOpenBooking = false }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the rating for this car
    const fetchRating = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3060/vehicles/${car.vehicle_id}/rating`);
        
        if (response.ok) {
          const data = await response.json();
          setRating({
            average: parseFloat(data.average_rating) || 0,
            count: data.review_count || 0
          });
        }
      } catch (err) {
        console.error('Error fetching vehicle rating:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRating();
    
    // Auto-open booking modal if directed from reviews page
    if (autoOpenBooking && car.availability) {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const customerId = localStorage.getItem('customerId');
      
      if (isAuthenticated && customerId) {
        setIsBookingModalOpen(true);
      }
    }
  }, [car.vehicle_id, autoOpenBooking, car.availability]);

  const handleBookNowClick = () => {
    // Check if the user is logged in by checking localStorage
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const customerId = localStorage.getItem('customerId');
    
    if (!isAuthenticated || !customerId) {
      // If not logged in, redirect to login page
      alert('Please log in to book a car');
      navigate('/login');
      return;
    }
    
    // If logged in, open the booking modal
    setIsBookingModalOpen(true);
  };

  const handleBooking = async (bookingData) => {
    try {
      const response = await fetch('http://localhost:3060/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      alert('Booking request submitted successfully! Your booking is pending administrator approval. The vehicle will be reserved for you once approved.');
      return result;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  // Render stars for the rating
  const renderStars = () => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className="mr-1"
        size={16}
        color={index < Math.round(rating.average) ? "#ffc107" : "#e4e5e9"}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row h-auto">
      {/* Car Image - Fixed height and width container */}
      <div className="md:w-1/3 h-64 md:h-80 flex-shrink-0">
        <img
          src={car.image_path || "https://via.placeholder.com/300x200?text=No+Image"}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Car Details */}
      <div className="p-6 md:w-2/3">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-blue-600">
            {car.brand} - {car.model}
          </h3>
          <p className="text-lg text-gray-600">
            {car.brand} {car.model}
          </p>
          
          {/* Rating display */}
          <div className="flex items-center mt-2">
            <div className="flex">
              {renderStars()}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {rating.count > 0 
                ? `${rating.average.toFixed(1)} out of 5 (${rating.count} reviews)` 
                : 'No reviews yet'}
            </span>
            {rating.count > 0 && (
              <Link 
                to={`/vehicle/${car.vehicle_id}/reviews`}
                className="ml-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Read Reviews
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-b py-4 my-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
            <p>
              <span className="font-medium">Price:</span> ${car.price_per_day}
            </p>
            <p>
              <span className="font-medium">Color:</span> {car.color}
            </p>
            <p>
              <span className="font-medium">Transmission:</span> {car.transmission}
            </p>
            <p>
              <span className="font-medium">Type:</span> {car.type}
            </p>
            <p>
              <span className="font-medium">Year:</span> {car.year}
            </p>
            <p>
              <span className="font-medium">Available:</span> {car.availability ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          {rating.count === 0 && (
            <Link 
              to={`/vehicle/${car.vehicle_id}/reviews`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Be the first to review
            </Link>
          )}
          
          {car.availability ? (
            <button 
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleBookNowClick}
            >
              Book Now
            </button>
          ) : (
            <button className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Not Available
            </button>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        car={car}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onConfirm={handleBooking}
      />
    </div>
  );
};

export default CarDetailsCard;