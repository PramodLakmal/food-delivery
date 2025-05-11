import { useState } from 'react';
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiFilter } from 'react-icons/fi';

const MenuItemList = ({ menuItems, onEdit, onDelete, onToggleAvailability }) => {
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Get unique categories from menu items
  const categories = [...new Set(menuItems.map(item => item.category))];
  
  // Filter and sort menu items
  const filteredItems = menuItems
    .filter(item => filterCategory ? item.category === filterCategory : true)
    .sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'category') {
        return sortOrder === 'asc' 
          ? a.category.localeCompare(b.category) 
          : b.category.localeCompare(a.category);
      }
      return 0;
    });
  
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <FiFilter className="text-gray-500 mr-2" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded-md py-1 px-3 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md py-1 px-3 text-sm"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="category">Category</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Order:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border rounded-md py-1 px-3 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item._id} 
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {item.image ? (
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                <span className="text-lg font-medium text-gray-700">${item.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center mb-2">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {item.category}
                </span>
                {item.isVegetarian && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 rounded-full text-green-700">
                    Vegetarian
                  </span>
                )}
                {item.isVegan && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 rounded-full text-green-700">
                    Vegan
                  </span>
                )}
                {item.isGlutenFree && (
                  <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 rounded-full text-yellow-700">
                    GF
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
              
              {item.spicyLevel > 0 && (
                <div className="flex items-center mb-3">
                  <span className="text-xs text-gray-600 mr-2">Spicy:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i}
                        className={`w-3 h-3 rounded-full mx-0.5 ${
                          i < item.spicyLevel ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                    onClick={() => onEdit(item)}
                    title="Edit Item"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    onClick={() => onDelete(item._id)}
                    title="Delete Item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                
                <button
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                  onClick={() => onToggleAvailability(item._id)}
                  title={item.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                >
                  {item.isAvailable ? (
                    <FiToggleRight className="text-green-500" />
                  ) : (
                    <FiToggleLeft className="text-red-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found.</p>
        </div>
      )}
    </div>
  );
};

export default MenuItemList; 
 
 
 
 