import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import SearchPage from "./components/SearchPage"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Bookings from "./components/Bookings"
import Logout from "./components/Logout"
import Login from "./components/Login"
import Payment from "./components/Payment"
import VehicleReviews from "./components/VehicleReviews"

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/vehicle/:vehicleId/reviews" element={<VehicleReviews />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/logout" element={<Logout />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;