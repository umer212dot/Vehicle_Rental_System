import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'Customer',
    name: '',
    phone: '',
    licenseNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      console.log('Submitting registration data:', {
        email: formData.email,
        password: formData.password,
        role: formData.userType,
        name: formData.name,
        phone: formData.userType === 'Customer' ? formData.phone : null,
        licenseNumber: formData.userType === 'Customer' ? formData.licenseNumber : null
      });
      
      // Register user account
      const response = await fetch('http://localhost:3060/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.userType,
          name: formData.name,
          phone: formData.userType === 'Customer' ? formData.phone : null,
          licenseNumber: formData.userType === 'Customer' ? formData.licenseNumber : null
        }),
      });
      
      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse as JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing response:', responseText);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Registration failed');
      }
      
      // Redirect to login page after successful registration
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in with your new account.' 
        } 
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep2 = () => {
    // Implement validation logic for step 2
    return true; // Placeholder return, actual implementation needed
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default Register; 