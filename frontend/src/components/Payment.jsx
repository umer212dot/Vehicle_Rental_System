import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [amount, setAmount] = useState(0);
    
    const navigate = useNavigate();
    
    useEffect(() => {
        // Check if user is logged in
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        // Get booking ID and amount from localStorage
        const currentBookingId = localStorage.getItem('currentBookingId');
        const paymentAmount = localStorage.getItem('paymentAmount');
        
        if (!currentBookingId || !paymentAmount) {
            navigate('/bookings');
            return;
        }
        
        setBookingId(currentBookingId);
        setAmount(paymentAmount);
        
        // Pre-fill card holder name if available
        const userName = localStorage.getItem('userName');
        if (userName) {
            setCardHolder(userName);
        }
    }, [navigate]);
    
    const formatCardNumber = (value) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Format in groups of 4
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        // Limit to 19 characters (16 digits + 3 spaces)
        return formatted.slice(0, 19);
    };
    
    const formatExpiryDate = (value) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Format as MM/YY
        if (digits.length > 2) {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
        }
        return digits;
    };
    
    const handleCardNumberChange = (e) => {
        setCardNumber(formatCardNumber(e.target.value));
    };
    
    const handleExpiryDateChange = (e) => {
        setExpiryDate(formatExpiryDate(e.target.value));
    };
    
    const handleCvvChange = (e) => {
        // Limit to 3 or 4 digits
        const digits = e.target.value.replace(/\D/g, '');
        setCvv(digits.slice(0, 4));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate card details
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            setError('Please enter a valid 16-digit card number');
            return;
        }
        
        if (!cardHolder.trim()) {
            setError('Please enter the cardholder name');
            return;
        }
        
        if (expiryDate.length !== 5) { // MM/YY format
            setError('Please enter a valid expiry date in MM/YY format');
            return;
        }
        
        if (cvv.length < 3) {
            setError('Please enter a valid CVV code');
            return;
        }
        
        setLoading(true);
        
        try {
            // Process payment
            const response = await fetch('http://localhost:3060/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rental_id: bookingId,
                    amount: parseFloat(amount),
                    // In a real app, you would securely process card details
                    // Here we're just simulating the payment
                    payment_status: 'Completed'
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to process payment');
            }
            
            // Clear the booking data from localStorage
            localStorage.removeItem('currentBookingId');
            localStorage.removeItem('paymentAmount');
            
            // Show success message and redirect to bookings page
            alert('Payment successful! Your booking has been confirmed.');
            navigate('/bookings');
        } catch (err) {
            console.error('Error processing payment:', err);
            setError('Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                        Payment Details
                    </h2>
                    
                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <p className="text-blue-800 font-medium">Booking #{bookingId}</p>
                        <p className="text-blue-700 text-lg font-bold">Amount: ${amount}</p>
                    </div>
                    
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Card Number
                            </label>
                            <input
                                type="text"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="1234 5678 9012 3456"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cardholder Name
                            </label>
                            <input
                                type="text"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                placeholder="John Doe"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiry Date
                                </label>
                                <input
                                    type="text"
                                    value={expiryDate}
                                    onChange={handleExpiryDateChange}
                                    placeholder="MM/YY"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CVV
                                </label>
                                <input
                                    type="text"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    placeholder="123"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate('/bookings')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : `Pay $${amount}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Payment; 