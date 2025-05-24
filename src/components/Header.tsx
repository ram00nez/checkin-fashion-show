import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-blue-600 text-2xl font-bold">Event Check-in</span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link 
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/' 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/admin') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Admin Dashboard
                </Link>
                
                <div className="flex items-center ml-2">
                  <div className="flex items-center mr-4">
                    <UserCircle className="h-5 w-5 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => logout()}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link 
                to="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/login' 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Admin Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;