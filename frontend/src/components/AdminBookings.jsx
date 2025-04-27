import React from 'react';
import Bookings from './Bookings';

const AdminBookings = () => {
  // The Bookings component already checks localStorage for the user role
  // and handles both admin and customer views
  return <Bookings />;
};

export default AdminBookings; 