import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-blue-900 text-white py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <h1 
          className="text-2xl font-bold cursor-pointer" 
          onClick={() => navigate('/')}
        >
          AutoZen Rental Services
        </h1>
        
        <div className="space-x-4">
          {location.pathname !== '/register' && (
            <button 
              onClick={() => navigate('/register')} 
              className="bg-transparent hover:bg-blue-800 text-white font-semibold py-2 px-4 border border-blue-400 hover:border-white rounded transition duration-300"
            >
              Sign Up
            </button>
          )}
          
          {location.pathname !== '/login' && (
            <button 
              onClick={() => navigate('/login')} 
              className="bg-blue-950 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded transition duration-300"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar; 