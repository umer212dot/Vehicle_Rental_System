import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

function ReviewModal({ isOpen, onClose, onSubmit, vehicle }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comments, setComments] = useState('');
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate form
        const formErrors = {};
        if (rating === 0) {
            formErrors.rating = 'Please select a rating';
        }
        
        if (!comments.trim()) {
            formErrors.comments = 'Please provide some comments';
        } else if (comments.length < 5) {
            formErrors.comments = 'Comments must be at least 5 characters';
        }
        
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        
        // Submit review with rental_id (this will be handled by the parent component)
        onSubmit({ rating, comments });
        
        // Reset form
        setRating(0);
        setComments('');
        setErrors({});
    };

    return (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium text-gray-900">
                            Review Your Rental
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4">
                        <div className="mb-6">
                            <h4 className="text-lg font-medium text-gray-700 mb-2">
                                {vehicle?.brand} {vehicle?.model}
                            </h4>
                            <div className="flex items-center mb-1">
                                <img 
                                    src={vehicle?.image_path || "https://via.placeholder.com/300x200?text=No+Image"} 
                                    alt={`${vehicle?.brand} ${vehicle?.model}`}
                                    className="w-20 h-20 object-cover rounded"
                                />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600">{vehicle?.type}</p>
                                    <p className="text-sm text-gray-600">{vehicle?.color} • {vehicle?.year}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rate your experience
                            </label>
                            <div className="flex">
                                {[...Array(5)].map((_, index) => {
                                    const ratingValue = index + 1;
                                    
                                    return (
                                        <label key={index} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="rating"
                                                className="hidden"
                                                value={ratingValue}
                                                onClick={() => setRating(ratingValue)}
                                            />
                                            <FaStar
                                                className="mr-1"
                                                size={24}
                                                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                                onMouseEnter={() => setHover(ratingValue)}
                                                onMouseLeave={() => setHover(0)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.rating && (
                                <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                            )}
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                                Comments
                            </label>
                            <textarea
                                id="comments"
                                rows="4"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Share your experience with this vehicle..."
                            ></textarea>
                            {errors.comments && (
                                <p className="mt-1 text-sm text-red-600">{errors.comments}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReviewModal; 