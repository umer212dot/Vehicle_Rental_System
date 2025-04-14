"use client"

import { useState } from "react"
import { Menu } from "react-feather" // Using react-feather instead of lucide-react
import { Link } from "react-router-dom"
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#003366] text-white w-full shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold">
              Vehicle Rental System
            </a>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
                <Link to="/" className="px-3 py-2 hover:bg-[#004080] rounded-md">
                  Dashboard
                </Link>
                <Link to="/bookings" className="px-3 py-2 hover:bg-[#004080] rounded-md">
                  Bookings
                </Link>
                <Link to="/search" className="px-3 py-2 hover:bg-[#004080] rounded-md">
                  Search
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
            <a
              href="/dashboard"
              className="block px-3 py-2 hover:bg-[#004080] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </a>
            <a
              href="/bookings"
              className="block px-3 py-2 hover:bg-[#004080] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Bookings
            </a>
            <a
              href="/search"
              className="block px-3 py-2 hover:bg-[#004080] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </a>
            <a
              href="/logout"
              className="block px-3 py-2 bg-[#001f3f] hover:bg-[#00152a] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
