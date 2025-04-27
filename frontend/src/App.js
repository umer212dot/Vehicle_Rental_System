import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import SearchPage from "./components/SearchPage"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Bookings from "./components/Bookings"
import Logout from "./components/Logout"
import Login from "./components/Login"
import Register from "./components/Register"
import Payment from "./components/Payment"
import VehicleReviews from "./components/VehicleReviews"
import AdminLayout from "./components/AdminLayout"
import AdminDashboard from "./components/AdminDashboard"
import MaintenanceManagement from "./components/MaintenanceManagement"
import VehicleMaintenanceTracker from "./components/VehicleMaintenanceTracker"
import MaintenanceScheduler from "./components/MaintenanceScheduler"
import AdminBookings from "./components/AdminBookings"
import AdminSearch from "./components/AdminSearch"

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/vehicle/:vehicleId/reviews" element={<VehicleReviews />} />

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/search" element={<AdminSearch />} />
            <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
            <Route path="/admin/vehicle-maintenance" element={<VehicleMaintenanceTracker />} />
            <Route path="/admin/vehicle-maintenance/:vehicleId" element={<VehicleMaintenanceTracker />} />
            <Route path="/admin/add-maintenance/:vehicleId" element={<VehicleMaintenanceTracker />} />
            <Route path="/admin/maintenance-scheduler" element={<MaintenanceScheduler />} />
          </Route>

          {/* Customer Routes */}
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