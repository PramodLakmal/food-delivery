import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllMenuItems } from '../services/menuService';
import { getAllRestaurants, getMenuItemsByRestaurant } from '../services/restaurantService';
import { toast } from 'react-hot-toast';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiMapPin, FiClock, FiPhone } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';

const MenuPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [sortBy, setSortBy] = useState('name');

  // Fetch restaurants on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurants - only active ones
        const response = await getAllRestaurants(1, 50, searchTerm, true);
        setRestaurants(response.restaurants);
        
        // Extract unique cuisine types
        const uniqueCuisines = [...new Set(response.restaurants.map(restaurant => restaurant.cuisineType))];
        setCuisineTypes(uniqueCuisines);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
        toast.error('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, [searchTerm]);
  
  // Fetch menu items when a restaurant is expanded
  useEffect(() => {
    const fetchMenuItems = async (restaurantId) => {
      if (!restaurantId || menuItems[restaurantId]) return;
      
      try {
        const items = await getMenuItemsByRestaurant(restaurantId);
        setMenuItems(prev => ({
          ...prev,
          [restaurantId]: items.filter(item => item.isAvailable !== false)
        }));
      } catch (error) {
        console.error(`Failed to fetch menu items for restaurant ${restaurantId}:`, error);
        toast.error('Failed to load menu items');
      }
    };
    
    if (expandedRestaurant) {
      fetchMenuItems(expandedRestaurant);
    }
  }, [expandedRestaurant, menuItems]);
  
  // Toggle restaurant expansion
  const toggleRestaurant = (restaurantId) => {
    setExpandedRestaurant(expandedRestaurant === restaurantId ? null : restaurantId);
  };
  
  // Filter restaurants
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      // Filter by search term
      const matchesSearch = 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisineType.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by cuisine type
      const matchesCuisine = selectedCuisine === 'all' || restaurant.cuisineType === selectedCuisine;
      
      return matchesSearch && matchesCuisine;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
  
  // Handle order button click
  const handleOrderClick = async (item, restaurant) => {
    if (!isAuthenticated) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }
    
    const cartItem = {
      menuItem: item._id,
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name
    };
    
    const success = await addToCart(cartItem);
    if (success) {
      toast.success(`${item.name} added to cart`);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="mt-2 text-gray-600">Browse through our partner restaurants and their delicious dishes!</p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="relative inline-block w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Cuisines</option>
                  {cuisineTypes.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="name">Sort by Name</option>
                <option value="rating_desc">Sort by Rating</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Restaurants List */}
        {filteredRestaurants.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-lg">No restaurants found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Restaurant Header with Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  {restaurant.isActive && (
                    <span className="absolute top-4 right-4 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Open
                    </span>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{restaurant.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">{restaurant.cuisineType}</p>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FiMapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>{restaurant.address}</p>
                      </div>
                      
                      {restaurant.phone && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <FiPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{restaurant.phone}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <button
                        onClick={() => toggleRestaurant(restaurant._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {expandedRestaurant === restaurant._id ? (
                          <>Hide Menu <FiChevronUp className="ml-2" /></>
                        ) : (
                          <>View Menu <FiChevronDown className="ml-2" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Restaurant Menu Items */}
                {expandedRestaurant === restaurant._id && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    {!menuItems[restaurant._id] ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : menuItems[restaurant._id].length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No menu items available for this restaurant.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems[restaurant._id].map(item => (
                          <div key={item._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="h-40 overflow-hidden">
                              <img 
                                src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80'} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                              <p className="mt-2 text-gray-600 text-sm h-12 overflow-hidden">{item.description}</p>
                              
                              <div className="mt-4 flex justify-between items-center">
                                <div>
                                  {item.isVegetarian && (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                      Vegetarian
                                    </span>
                                  )}
                                  {item.isVegan && (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                      Vegan
                                    </span>
                                  )}
                                  {item.isGlutenFree && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                      Gluten Free
                                    </span>
                                  )}
                                  {item.spicyLevel > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      {Array(item.spicyLevel).fill('🌶️').join('')}
                                    </span>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => handleOrderClick(item, restaurant)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
 
 