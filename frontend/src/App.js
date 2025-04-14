import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import SearchPage from "./components/SearchPage"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Bookings from "./components/Bookings"
import Logout from "./components/Logout"

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
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