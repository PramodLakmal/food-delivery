import { useState, useEffect, useRef } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

const MenuItemForm = ({ menuItem, onSubmit, onCancel, isLoading, restaurantId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    preparationTime: 15,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    isAvailable: true,
    restaurantId: restaurantId || ''
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  
  // Update formData when restaurantId prop changes
  useEffect(() => {
    if (restaurantId) {
      setFormData(prevData => ({
        ...prevData,
        restaurantId
      }));
    }
  }, [restaurantId]);
  
  // Load menu item data if editing
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || '',
        description: menuItem.description || '',
        price: menuItem.price || '',
        image: menuItem.image || '',
        category: menuItem.category || '',
        preparationTime: menuItem.preparationTime || 15,
        isVegetarian: menuItem.isVegetarian || false,
        isVegan: menuItem.isVegan || false,
        isGlutenFree: menuItem.isGlutenFree || false,
        spicyLevel: menuItem.spicyLevel || 0,
        isAvailable: menuItem.isAvailable !== undefined ? menuItem.isAvailable : true,
        restaurantId: menuItem.restaurantId || restaurantId || ''
      });
      
      setImagePreview(menuItem.image || '');
    }
  }, [menuItem, restaurantId]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'price' || name === 'preparationTime' || name === 'spicyLevel') {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData({ ...formData, image: base64String });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting menu item with restaurantId:', formData.restaurantId);
    onSubmit(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {menuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Appetizers">Appetizers</option>
                  <option value="Soups">Soups</option>
                  <option value="Salads">Salads</option>
                  <option value="Main Courses">Main Courses</option>
                  <option value="Sides">Sides</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Specials">Specials</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  max="180"
                />
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Item Image
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center"
                  >
                    <FiUpload className="mr-2" /> Upload Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Menu item preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: '' });
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Spicy Level
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="spicyLevel"
                    value={formData.spicyLevel}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="1"
                    className="w-full"
                  />
                  <span className="ml-2">{formData.spicyLevel}/5</span>
                </div>
              </div>
              
              <div className="mb-4 space-y-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Dietary Information
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVegetarian"
                    checked={formData.isVegetarian}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Vegetarian</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVegan"
                    checked={formData.isVegan}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Vegan</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Gluten Free</label>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    Available for ordering
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : menuItem ? 'Update Menu Item' : 'Add Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemForm; 
 
 
 
 