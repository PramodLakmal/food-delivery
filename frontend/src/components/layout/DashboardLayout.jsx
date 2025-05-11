import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiBell, FiPackage } from 'react-icons/fi';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine sidebar links based on user role
  const getSidebarLinks = () => {
    switch (user?.role) {
      case 'system_admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
          { to: '/profile', label: 'My Profile', icon: <FiUser /> },
        ];
      case 'restaurant_admin':
        return [
          { to: '/restaurant-admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
          { to: '/restaurant-admin/orders', label: 'Orders', icon: <FiPackage /> },
          { to: '/profile', label: 'My Profile', icon: <FiUser /> },
        ];
      case 'delivery_person':
        return [
          { to: '/delivery/dashboard', label: 'Dashboard', icon: <FiHome /> },
          { to: '/profile', label: 'My Profile', icon: <FiUser /> },
        ];
      default:
        return [
          { to: '/profile', label: 'My Profile', icon: <FiUser /> },
        ];
    }
  };

  const sidebarLinks = getSidebarLinks();

  // Get user-friendly role name
  const getRoleName = (role) => {
    switch (role) {
      case 'system_admin':
        return 'System Admin';
      case 'restaurant_admin':
        return 'Restaurant Manager';
      case 'delivery_person':
        return 'Delivery Partner';
      default:
        return 'User';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 p-1">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <FiX className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-xl font-semibold text-gray-800">Food Delivery</span>
          </div>
          
          <div className="px-4 py-3 mt-2 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                <div className="text-xs text-blue-500">{getRoleName(user?.role)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {sidebarLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <span className="mr-3 h-6 w-6">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <FiLogOut className="mr-3 h-6 w-6" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-xl font-semibold text-gray-800">Food Delivery</span>
              </div>
              
              <div className="px-4 py-3 mt-2 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    <div className="text-xs text-blue-500">{getRoleName(user?.role)}</div>
                  </div>
                </div>
              </div>
              
              <nav className="mt-5 flex-1 px-3 space-y-1">
                {sidebarLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.to}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <span className="mr-3 h-5 w-5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiLogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 md:hidden text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-end">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">View notifications</span>
                <FiBell className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
