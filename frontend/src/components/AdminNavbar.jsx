import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from "react-feather";
import { Link } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#003366] text-white w-full shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 
              className="text-xl font-bold cursor-pointer" 
              onClick={() => navigate('/admin/dashboard')}
            >
              AutoZen Rental Services - Admin
            </h1>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
                <Link to="/admin/dashboard" className="px-3 py-2 hover:bg-[#004080] rounded-md">
                  Dashboard
                </Link>
                <Link to="/admin/maintenance" className="px-3 py-2 hover:bg-[#004080] rounded-md">
                  Maintenance Management
                </Link>
                <Link to="/logout" className="ml-4 px-3 py-2 bg-[#001f3f] hover:bg-[#00152a] rounded-md">
                  Logout
                </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#004080] focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/admin/dashboard"
              className="block px-3 py-2 hover:bg-[#004080] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/maintenance"
              className="block px-3 py-2 hover:bg-[#004080] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Maintenance Management
            </Link>
            <Link
              to="/logout"
              className="block px-3 py-2 bg-[#001f3f] hover:bg-[#00152a] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Logout
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar; 