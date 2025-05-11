import { useState } from 'react';
import { FiUsers, FiSettings, FiHome, FiList, FiTruck, FiBarChart2 } from 'react-icons/fi';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data for the dashboard
  const stats = {
    totalUsers: 1254,
    totalRestaurants: 82,
    totalOrders: 5678,
    pendingOrders: 37,
    newUsers: 48,
    revenue: 15784.50
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={<FiUsers className="text-blue-500" />} 
            />
            <StatCard 
              title="Total Restaurants" 
              value={stats.totalRestaurants} 
              icon={<FiHome className="text-green-500" />} 
            />
            <StatCard 
              title="Total Orders" 
              value={stats.totalOrders} 
              icon={<FiList className="text-purple-500" />} 
            />
            <StatCard 
              title="Pending Orders" 
              value={stats.pendingOrders} 
              icon={<FiTruck className="text-orange-500" />} 
            />
            <StatCard 
              title="New Users (Last 30 days)" 
              value={stats.newUsers} 
              icon={<FiUsers className="text-teal-500" />} 
            />
            <StatCard 
              title="Revenue (Monthly)" 
              value={`$${stats.revenue.toFixed(2)}`} 
              icon={<FiBarChart2 className="text-red-500" />} 
            />
          </div>
        );
      case 'users':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Users</h3>
            <p className="text-gray-500">User management interface will be implemented here.</p>
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">John Doe</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">john@example.com</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Customer</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Deactivate</button>
                    </td>
                  </tr>
                  {/* More sample rows would go here */}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'restaurants':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Restaurants</h3>
            <p className="text-gray-500">Restaurant management interface will be implemented here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
            <p className="text-gray-500">System settings interface will be implemented here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your entire food ordering system</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <nav className="mt-2">
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('overview')}
              >
                <FiBarChart2 className="mr-3" /> 
                Overview
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('users')}
              >
                <FiUsers className="mr-3" />
                Users
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'restaurants' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('restaurants')}
              >
                <FiHome className="mr-3" />
                Restaurants
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('settings')}
              >
                <FiSettings className="mr-3" />
                Settings
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center">
      <div className="p-3 rounded-full bg-gray-100 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard; 