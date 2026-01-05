import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center group">
              <Utensils className="h-8 w-8 text-primary-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                FoodHub
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Delivering happiness to your doorstep. Fresh, hot, and delicious food from the best kitchens.
            </p>
            <div className="flex space-x-4 pt-2">
              <a 
                href="#facebook" 
                className="text-gray-400 hover:text-primary-500 transition-colors duration-200 hover:scale-110"
                title="Follow us on Facebook"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#twitter" 
                className="text-gray-400 hover:text-primary-500 transition-colors duration-200 hover:scale-110"
                title="Follow us on Twitter"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#instagram" 
                className="text-gray-400 hover:text-primary-500 transition-colors duration-200 hover:scale-110"
                title="Follow us on Instagram"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link 
                  to="/menu" 
                  className="hover:text-primary-500 transition-colors duration-200"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link 
                  to="/orders" 
                  className="hover:text-primary-500 transition-colors duration-200"
                >
                  My Orders
                </Link>
              </li>
              <li>
                <Link 
                  to="/cart" 
                  className="hover:text-primary-500 transition-colors duration-200"
                >
                  Cart
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="hover:text-primary-500 transition-colors duration-200"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center hover:text-primary-500 transition-colors duration-200">
                <Phone className="h-4 w-4 mr-3 text-primary-500 flex-shrink-0" />
                <a href="tel:+1-234-567-890">+1 (234) 567-890</a>
              </li>
              <li className="flex items-center hover:text-primary-500 transition-colors duration-200">
                <Mail className="h-4 w-4 mr-3 text-primary-500 flex-shrink-0" />
                <a href="mailto:support@foodhub.com">support@foodhub.com</a>
              </li>
              <li className="flex items-start hover:text-primary-500 transition-colors duration-200">
                <MapPin className="h-4 w-4 mr-3 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>123 Foodie Street, Flavor Town</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to get special offers and updates.</p>
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              // Add newsletter subscription logic here
            }}>
              <input
                type="email"
                placeholder="Your email"
                required
                className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-sm transition-all duration-200"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-r-md transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Subscribe to newsletter"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs sm:text-sm">
          <p>&copy; {currentYear} FoodHub. All rights reserved.</p>
          <div className="mt-3 flex justify-center space-x-6 text-xs">
            <a href="#privacy" className="hover:text-primary-500 transition-colors duration-200">Privacy Policy</a>
            <a href="#terms" className="hover:text-primary-500 transition-colors duration-200">Terms of Service</a>
            <a href="#cookies" className="hover:text-primary-500 transition-colors duration-200">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;