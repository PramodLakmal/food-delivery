import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-10 pb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">FoodOrder</h3>
            <p className="text-gray-400 mb-4">
              Your favorite food, delivered fast and fresh to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FiInstagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-white">Menu</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <FiMapPin className="mr-2" />
                <span>123 Main Street, City, Country</span>
              </li>
              <li className="flex items-center text-gray-400">
                <FiPhone className="mr-2" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center text-gray-400">
                <FiMail className="mr-2" />
                <span>info@foodorder.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="my-8 border-gray-700" />
        
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} FoodOrder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
 
 