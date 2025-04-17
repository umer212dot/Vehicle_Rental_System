import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReviewModal from './ReviewModal';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaStar } from 'react-icons/fa';

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState({});
    const [vehicleRatings, setVehicleRatings] = useState({});
    const [activeTab, setActiveTab] = useState('All');
    
    const navigate = useNavigate();

    // Define status tabs
    const statusTabs = ['All', 'Awaiting Approval', 'Pending', 'Ongoing', 'Completed', 'Cancelled'];

    useEffect(() => {
        // Check if user is logged in
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const userRole = localStorage.getItem('userRole');
        const customerId = localStorage.getItem('customerId');
        
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        // Update rental statuses from Ongoing to Completed if return date has passed
        updateRentalStatuses();
        
        // Check if user is admin
        if (userRole === 'Admin') {
            setIsAdmin(true);
            fetchAdminBookings();
        } else {
            // Regular customer
            if (!customerId) {
                navigate('/login');
                return;
            }
            fetchCustomerBookings();
        }
    }, [navigate]);

    // Filter bookings when tab changes or bookings are updated
    useEffect(() => {
        if (activeTab === 'All') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(booking => booking.status === activeTab));
        }
    }, [activeTab, bookings]);

    // Update rental statuses based on return dates
    const updateRentalStatuses = async () => {
        try {
            const response = await fetch('http://localhost:3060/rentals/update-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                console.error('Failed to update rental statuses');
                return;
            }
            
            const result = await response.json();
            console.log(`Updated ${result.updated} rental(s) to Completed status`);
        } catch (err) {
            console.error('Error updating rental statuses:', err);
        }
    };

    const fetchCustomerBookings = async () => {
        try {
            setLoading(true);
            const customerId = localStorage.getItem('customerId');
            const response = await fetch(`http://localhost:3060/rentals/customer/${customerId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }
            
            const data = await response.json();
            setBookings(data);
            setFilteredBookings(data);
            
            // Check completed bookings for existing reviews
            const completedBookings = data.filter(booking => booking.status === 'Completed');
            await checkExistingReviews(completedBookings, customerId);
            
            // Fetch ratings for all vehicles
            await fetchVehicleRatings(data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3060/rentals/all');
            
            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }
            
            const data = await response.json();
            setBookings(data);
            setFilteredBookings(data);
            
            // Fetch ratings for all vehicles
            await fetchVehicleRatings(data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveBooking = async (rental_id) => {
        try {
            const response = await fetch(`http://localhost:3060/rentals/${rental_id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to approve booking');
            }
            
            // Refresh bookings list
            fetchAdminBookings();
            alert('Booking approved successfully!');
        } catch (err) {
            console.error('Error approving booking:', err);
            alert('Failed to approve booking. Please try again.');
        }
    };

    const handleRejectBooking = async (rental_id) => {
        if (!window.confirm('Are you sure you want to reject this booking?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3060/rentals/${rental_id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to reject booking');
            }
            
            // Refresh bookings list
            fetchAdminBookings();
            alert('Booking rejected successfully!');
        } catch (err) {
            console.error('Error rejecting booking:', err);
            alert('Failed to reject booking. Please try again.');
        }
    };

    const handleGenerateInvoice = (booking) => {
        try {
            const doc = new jsPDF();
            
            // Add company logo or header
            doc.setFontSize(20);
            doc.text('Vehicle Rental System', 105, 20, { align: 'center' });
            
            doc.setFontSize(16);
            doc.text('INVOICE', 105, 30, { align: 'center' });
            
            // Add booking details
            doc.setFontSize(12);
            doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 50);
            doc.text(`Booking ID: ${booking.rental_id}`, 20, 60);
            doc.text(`Customer ID: ${booking.customer_id}`, 20, 70);
            doc.text(`Customer Name: ${isAdmin ? booking.customer.name : localStorage.getItem('userName')}`, 20, 80);
            
            // Vehicle details
            doc.text('Vehicle Details:', 20, 100);
            doc.text(`Brand: ${booking.vehicle.brand}`, 30, 110);
            doc.text(`Model: ${booking.vehicle.model}`, 30, 120);
            doc.text(`Type: ${booking.vehicle.type}`, 30, 130);
            doc.text(`Color: ${booking.vehicle.color}`, 30, 140);
            
            // Booking details
            doc.text('Booking Details:', 20, 160);
            doc.text(`Rental Date: ${new Date(booking.rental_date).toLocaleDateString()}`, 30, 170);
            doc.text(`Return Date: ${new Date(booking.return_date).toLocaleDateString()}`, 30, 180);
            doc.text(`Status: ${booking.status}`, 30, 190);
            
            // Calculate number of days
            const rentalDate = new Date(booking.rental_date);
            const returnDate = new Date(booking.return_date);
            const diffTime = returnDate.getTime() - rentalDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Payment details
            doc.text('Payment Details:', 20, 210);
            
            const tableColumns = ['Description', 'Days', 'Rate ($/day)', 'Amount ($)'];
            const tableRows = [
                [
                    `${booking.vehicle.brand} ${booking.vehicle.model} Rental`, 
                    diffDays.toString(), 
                    booking.vehicle.price_per_day.toString(), 
                    booking.total_fee.toString()
                ],
                ['Total', '', '', booking.total_fee.toString()]
            ];
            
            autoTable(doc,{
                startY: 220,
                head: [tableColumns],
                body: tableRows
            });
            
            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
            
            // Save the PDF
            doc.save(`Invoice_Booking_${booking.rental_id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate invoice. Please try again.");
        }
    };

    const handlePayment = (booking) => {
        // Store the booking ID in localStorage to access it on the payment page
        localStorage.setItem('currentBookingId', booking.rental_id);
        localStorage.setItem('paymentAmount', booking.total_fee);
        
        // Navigate to the payment page
        navigate('/payment');
    };

    const handleOpenReviewModal = (booking) => {
        setSelectedBooking(booking);
        setIsReviewModalOpen(true);
    };

    const handleCloseReviewModal = () => {
        setIsReviewModalOpen(false);
        setSelectedBooking(null);
    };

    const handleSubmitReview = async (reviewData) => {
        try {
            const response = await fetch('http://localhost:3060/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: selectedBooking.customer_id,
                    vehicle_id: selectedBooking.vehicle_id,
                    rating: reviewData.rating,
                    comments: reviewData.comments
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit review');
            }
            
            // Mark this booking as reviewed
            setReviewedBookings(prev => ({
                ...prev,
                [selectedBooking.rental_id]: true
            }));
            
            alert('Review submitted successfully!');
            handleCloseReviewModal();
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Failed to submit review. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Get status-based CSS class
    const getStatusClass = (status) => {
        switch(status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Ongoing':
                return 'bg-blue-100 text-blue-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Awaiting Approval':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Check if customer has already reviewed completed bookings
    const checkExistingReviews = async (completedBookings, customerId) => {
        const reviewStatus = {};
        
        try {
            await Promise.all(completedBookings.map(async (booking) => {
                const response = await fetch(`http://localhost:3060/reviews/check?customer_id=${customerId}&vehicle_id=${booking.vehicle_id}`);
                
                if (response.ok) {
                    const data = await response.json();
                    reviewStatus[booking.rental_id] = data.hasReviewed;
                }
            }));
            
            setReviewedBookings(reviewStatus);
        } catch (err) {
            console.error('Error checking review status:', err);
        }
    };

    // Fetch ratings for all vehicles in bookings
    const fetchVehicleRatings = async (bookingsData) => {
        const ratings = {};
        
        try {
            await Promise.all(bookingsData.map(async (booking) => {
                const vehicleId = booking.vehicle_id;
                // Skip if we already have the rating
                if (ratings[vehicleId]) return;
                
                const response = await fetch(`http://localhost:3060/vehicles/${vehicleId}/rating`);
                
                if (response.ok) {
                    const data = await response.json();
                    ratings[vehicleId] = {
                        average: parseFloat(data.average_rating) || 0,
                        count: parseInt(data.review_count) || 0
                    };
                }
            }));
            
            setVehicleRatings(ratings);
        } catch (err) {
            console.error('Error fetching vehicle ratings:', err);
        }
    };

    // Render stars for a given rating
    const renderStars = (vehicleId) => {
        const rating = vehicleRatings[vehicleId] || { average: 0 };
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className="mr-1"
                size={14}
                color={index < Math.round(rating.average) ? "#ffc107" : "#e4e5e9"}
            />
        ));
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Count bookings by status for tab badges
    const getStatusCount = (status) => {
        if (status === 'All') {
            return bookings.length;
        }
        return bookings.filter(booking => booking.status === status).length;
    };

    // Render booking actions based on status and user role
    const renderBookingActions = (booking) => {
        if (isAdmin) {
            // Admin actions
            if (booking.status === 'Awaiting Approval') {
                return (
                    <>
                        <button 
                            onClick={() => handleApproveBooking(booking.rental_id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Approve
                        </button>
                        <button 
                            onClick={() => handleRejectBooking(booking.rental_id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Reject
                        </button>
                    </>
                );
            } else {
                return (
                    <button 
                        onClick={() => handleGenerateInvoice(booking)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                        Generate Invoice
                    </button>
                );
            }
        } else {
            // Customer actions
            if (booking.status === 'Awaiting Approval') {
                return (
                    <div className="text-purple-700 font-medium py-2">
                        Awaiting admin approval
                    </div>
                );
            } else if (booking.status === 'Pending') {
                return (
                    <>
                        <button 
                            onClick={() => handleGenerateInvoice(booking)}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                            Generate Invoice
                        </button>
                        <button 
                            onClick={() => handlePayment(booking)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Pay Online
                        </button>
                    </>
                );
            } else if (booking.status === 'Completed') {
                if (reviewedBookings[booking.rental_id]) {
                    return (
                        <div className="text-green-700 font-medium py-2">
                            Review Submitted
                        </div>
                    );
                } else {
                    return (
                        <button 
                            onClick={() => handleOpenReviewModal(booking)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Write Review
                        </button>
                    );
                }
            } else {
                return (
                    <button 
                        onClick={() => handleGenerateInvoice(booking)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                        Generate Invoice
                    </button>
                );
            }
        }
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
                    <button 
                        onClick={isAdmin ? fetchAdminBookings : fetchCustomerBookings}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">
                    {isAdmin ? 'All Bookings' : 'My Bookings'}
                </h1>
                
                {bookings.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-gray-500">
                            {isAdmin ? 'There are no bookings in the system.' : 'You don\'t have any bookings yet.'}
                        </p>
                        {!isAdmin && (
                            <button 
                                onClick={() => navigate('/search')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Find a Car to Rent
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Status Tabs */}
                        <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
                            <div className="flex border-b">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        className={`flex items-center px-4 py-3 text-sm font-medium ${
                                            activeTab === tab 
                                                ? 'border-b-2 border-blue-500 text-blue-600' 
                                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleTabChange(tab)}
                                    >
                                        {tab}
                                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                            activeTab === tab 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {getStatusCount(tab)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bookings List */}
                        {filteredBookings.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-6 text-center">
                                <p className="text-gray-500">
                                    No bookings found with status: {activeTab}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.rental_id} className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="md:flex">
                                            {/* Vehicle Image */}
                                            <div className="md:w-1/4">
                                                <img 
                                                    src={booking.vehicle.image_path || "https://via.placeholder.com/300x200?text=No+Image"} 
                                                    alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                                    className="w-full h-48 object-cover"
                                                />
                                            </div>
                                            
                                            {/* Booking Details */}
                                            <div className="p-6 md:w-3/4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-800">
                                                            {booking.vehicle.brand} {booking.vehicle.model}
                                                        </h2>
                                                        <p className="text-gray-600">{booking.vehicle.type} • {booking.vehicle.color} • {booking.vehicle.year}</p>
                                                        
                                                        {/* Rating Display */}
                                                        <div className="flex items-center mt-1">
                                                            <div className="flex">
                                                                {renderStars(booking.vehicle_id)}
                                                            </div>
                                                            <span className="ml-2 text-xs text-gray-500">
                                                                {vehicleRatings[booking.vehicle_id]?.count > 0 
                                                                    ? `${vehicleRatings[booking.vehicle_id].average.toFixed(1)} out of 5 (${vehicleRatings[booking.vehicle_id].count} reviews)` 
                                                                    : 'No reviews yet'}
                                                            </span>
                                                            {vehicleRatings[booking.vehicle_id]?.count > 0 && (
                                                                <Link 
                                                                    to={`/vehicle/${booking.vehicle_id}/reviews`}
                                                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                                                >
                                                                    Read Reviews
                                                                </Link>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Show customer details for admin */}
                                                        {isAdmin && booking.customer && (
                                                            <div className="mt-2 text-sm text-gray-500">
                                                                <p>Customer: {booking.customer.name}</p>
                                                                <p>Email: {booking.customer.email}</p>
                                                                <p>Phone: {booking.customer.phone}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Rental Date</p>
                                                        <p className="font-medium">{formatDate(booking.rental_date)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Return Date</p>
                                                        <p className="font-medium">{formatDate(booking.return_date)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Booking ID</p>
                                                        <p className="font-medium">#{booking.rental_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Total Fee</p>
                                                        <p className="font-medium">${booking.total_fee}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t pt-4 flex flex-wrap gap-2 justify-end">
                                                    {renderBookingActions(booking)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Review Modal */}
            {selectedBooking && (
                <ReviewModal 
                    isOpen={isReviewModalOpen}
                    onClose={handleCloseReviewModal}
                    onSubmit={handleSubmitReview}
                    vehicle={selectedBooking.vehicle}
                />
            )}
        </div>
    );
}

export default Bookings;
