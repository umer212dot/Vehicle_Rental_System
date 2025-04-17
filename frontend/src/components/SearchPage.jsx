"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import CarDetailsCard from "./CarDetailsCard"

const SearchPage = () => {
  // Sample data for dropdowns
  const brands = ["All Brands", "Volvo", "BMW", "Audi", "Mercedes", "Toyota", "Honda"]
  const [models, setModels] = useState(["All Models"]) //get all models from the database
  const types = ["All Types", "Sedan", "SUV", "Hatchback", "Convertible", "Hybrid"]
  const colors = ["All Colors", "Black", "White", "Silver", "Blue", "Red", "Gray"]
  const transmissions = ["All Transmissions", "Automatic", "Manual"]

  // State for loading
  const [isLoading, setIsLoading] = useState(false)

  // State for form inputs
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    availability: true,
  })

  // search results initialized as empty array
  const [searchResults, setSearchResults] = useState([])
//   const [searchResults, setSearchResults] = useState([[
//     {
//       id: 0,
//       brand: "-",
//       model: "-",
//       type: "-",
//       price: 0,
//       color: "-",
//       transmission: "-",
//       year: 0,
//       image:
//         "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/searchPage.JPG-Mg0X1Nt9Q5NtGUw6WaAttYORgVympB.jpeg",
//     },
//   ]])

  // State to track if search has been performed
  const [hasSearched, setHasSearched] = useState(false)

  // Get location to check for direct booking requests
  const location = useLocation()
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  
  useEffect(() => {
    // Check if we have a vehicle to book from the reviews page
    if (location.state?.selectedVehicleId && location.state?.bookNow) {
      const vehicleId = location.state.selectedVehicleId
      setSelectedVehicleId(vehicleId)
      
      // Fetch the specific vehicle and show it in results
      fetchVehicle(vehicleId)
    }
  }, [location])
  
  // Fetch a specific vehicle by ID
  const fetchVehicle = async (vehicleId) => {
    try {
      setIsLoading(true)
      setHasSearched(true)
      
      const response = await fetch(`http://localhost:3060/search?availability=true`)
      if (response.ok) {
        const allVehicles = await response.json()
        
        // Filter to find the specific vehicle
        const vehicle = allVehicles.find(v => v.vehicle_id.toString() === vehicleId.toString())
        
        if (vehicle) {
          setSearchResults([vehicle])
        } else {
          setSearchResults([])
        }
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // If brand changes, reset model to default and update available models
    if (name === "brand") {
      // Update formData with the new brand and reset model to default
      setFormData({
        ...formData,
        [name]: value,
        model: "All Models", // Reset model to default empty value
      })

      // Fetch models for the selected brand
      fetchModelsByBrand(value)
    } else {
      // For all other inputs, update normally
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      })
    }
  }

  const fetchModelsByBrand = async (brand) => {
    if (brand === "All Brands" || brand === "Select a Brand" || !brand){
        setModels(["All Models"])
        return
    }

    try {
      const response = await fetch(`http://localhost:3060/models/${brand}`)
      const data = await response.json()

      if (data) {
        setModels(["All Models", ...data.map(car => car.model)])
      }
    } catch (error) {
      console.error("Error fetching models for brand:", error)
    }
  }

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setHasSearched(true)

    try {
      // Build query string from form data
      const queryParams = new URLSearchParams()

      if (formData.brand && formData.brand !== "All Brands") queryParams.append("brand", formData.brand)

      if (formData.model && formData.model !== "All Models") queryParams.append("model", formData.model)
      if (formData.type && formData.type !== "All Types") queryParams.append("type", formData.type)
      if (formData.color && formData.color !== "All Colors") queryParams.append("color", formData.color)
      if (formData.transmission && formData.transmission !== "All Transmissions")
        queryParams.append("transmission", formData.transmission)
      if (formData.minPrice) queryParams.append("minPrice", formData.minPrice)
      if (formData.maxPrice) queryParams.append("maxPrice", formData.maxPrice)
      if (formData.availability) queryParams.append("availability", "true")

      // Make API call with query parameters
      console.log(queryParams.toString())
      const response = await fetch(`http://localhost:3060/search?${queryParams.toString()}`)
      const data = await response.json()
        console.log(data)
      setSearchResults(data)
    } catch (error) {
      console.error("Error searching cars:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-8 pt-4">
        <h1 className="text-2xl font-bold mb-6">Search Available Cars</h1>

        {/* Only show search form if not directly booking a vehicle */}
        {!selectedVehicleId && (
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Brand Dropdown */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Brand:</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a Brand</option>
                  {brands.map((brand, index) => (
                    <option key={index} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Input */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Model:</label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a Model</option>
                  {models.map((model, index) => (
                    <option key={index} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Dropdown */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a Type</option>
                  {types.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Dropdown */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Color:</label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a Color</option>
                  {colors.map((color, index) => (
                    <option key={index} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transmission Dropdown */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Transmission:</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a Transmission</option>
                  {transmissions.map((transmission, index) => (
                    <option key={index} value={transmission}>
                      {transmission}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Price Range:</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="minPrice"
                    value={formData.minPrice}
                    onChange={handleInputChange}
                    placeholder="Min $"
                    className="border border-gray-300 rounded-md p-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    value={formData.maxPrice}
                    onChange={handleInputChange}
                    placeholder="Max $"
                    className="border border-gray-300 rounded-md p-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Availability Checkbox */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className="ml-2 font-medium text-gray-700">Show only available cars</label>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="bg-black text-white py-2 px-6 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search Car"}
              </button>
            </div>
          </form>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && !isLoading && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              {selectedVehicleId ? "Selected Vehicle" : "Search Results"}
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-500">
                {selectedVehicleId 
                  ? "The selected vehicle is not available for booking."
                  : "No cars found matching your criteria."}
              </p>
            ) : (
              <div className="space-y-6">
                {searchResults.map((car) => (
                  <CarDetailsCard 
                    key={car.vehicle_id} 
                    car={car} 
                    autoOpenBooking={selectedVehicleId === car.vehicle_id.toString()}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
