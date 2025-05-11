import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMenu, FiX, FiLogOut, FiHome, FiShoppingCart, FiSettings, FiUsers, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isRestaurantAdmin, isDeliveryPerson } = useAuth();
  const { cartItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                FoodOrder
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600">
                <FiHome className="mr-1" /> Home
              </Link>
              <Link to="/menu" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600">
                <FiShoppingCart className="mr-1" /> Menu
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
          
          {/* Desktop user menu */}
          <div className="hidden sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative ml-3">
                <div className="flex items-center space-x-3">
                  {isAuthenticated && (
                    <Link to="/cart" className="text-gray-700 hover:text-blue-600 relative">
                      <FiShoppingCart className="w-5 h-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link to="/orders" className="text-gray-700 hover:text-blue-600">
                      <FiPackage className="w-5 h-5" />
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                      <FiSettings className="w-5 h-5" />
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center text-gray-700 hover:text-blue-600">
                    <FiUser className="mr-1" />
                    {user?.name || 'Profile'}
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center text-gray-700 hover:text-red-600"
                  >
                    <FiLogOut className="mr-1" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={closeMenu}
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiHome className="inline mr-2" /> Home
            </Link>
            <Link
              to="/menu"
              onClick={closeMenu}
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiShoppingCart className="inline mr-2" /> Menu
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FiShoppingCart className="inline mr-2" /> 
                  Cart {cartItemCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">{cartItemCount}</span>}
                </Link>
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FiPackage className="inline mr-2" /> My Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FiUser className="inline mr-2" /> Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FiSettings className="inline mr-2" /> Admin Dashboard
                  </Link>
                )}
                {isRestaurantAdmin && (
                  <Link
                    to="/restaurant-admin"
                    onClick={closeMenu}
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FiSettings className="inline mr-2" /> Restaurant Dashboard
                  </Link>
                )}
                {isDeliveryPerson && (
                  <Link
                    to="/delivery"
                    onClick={closeMenu}
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FiSettings className="inline mr-2" /> Delivery Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  <FiLogOut className="inline mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
 
 