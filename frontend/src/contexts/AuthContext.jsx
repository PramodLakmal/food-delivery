import { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

// Enable debug mode for development
const DEBUG = true;

// Create the Auth context
export const AuthContext = createContext();

// Custom hook to use the Auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Debug logger
  const logDebug = (...args) => {
    if (DEBUG) {
      console.log('[AuthContext]', ...args);
    }
  };

  // Normalize user object to ensure consistent property names
  const normalizeUser = (userData) => {
    if (!userData) return null;
    
    // Check if userData is wrapped in a 'user' property
    const rawUserData = userData.user || userData;
    
    // Create a normalized user object with consistent property names
    const normalized = { ...rawUserData };
    
    // Ensure id is consistent (some responses use _id, others use id)
    if (normalized._id && !normalized.id) {
      normalized.id = normalized._id;
    } else if (normalized.id && !normalized._id) {
      normalized._id = normalized.id;
    }
    
    logDebug('Normalized user:', normalized);
    return normalized;
  };
  
  // Load user from local storage on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const storedUser = authService.getAuthUser();
        
        logDebug('Initializing auth - Token exists:', !!token, 'User exists:', !!storedUser);
        
        if (token && storedUser) {
          const normalizedStoredUser = normalizeUser(storedUser);
          setUser(normalizedStoredUser);
          logDebug('Setting initial user from storage:', normalizedStoredUser);
          
          // Verify token and update user data from the server
          try {
            logDebug('Verifying token with server...');
            const response = await authService.getCurrentUser();
            logDebug('Server response for current user:', response);
            
            // Extract user from response
            const currentUser = response.user || response;
            
            if (currentUser) {
              const normalizedCurrentUser = normalizeUser(currentUser);
              logDebug('Token valid, received current user:', normalizedCurrentUser);
              setUser(normalizedCurrentUser);
              
              // Update stored user data if it's different
              if (JSON.stringify(normalizedCurrentUser) !== JSON.stringify(normalizedStoredUser)) {
                logDebug('Updating stored user data');
                localStorage.setItem('user', JSON.stringify(normalizedCurrentUser));
              }
            }
          } catch (error) {
            console.error('Failed to fetch current user:', error);
            logDebug('Token validation failed:', error);
            
            // If token is invalid or expired, clean up
            if (error.response && error.response.status === 401) {
              logDebug('Unauthorized - clearing auth data');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          }
        } else {
          // No token or user in storage
          logDebug('No valid auth data in storage');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logDebug('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        logDebug('Auth initialization complete');
      }
    };
    
    initializeAuth();
  }, []);
  
  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    try {
      logDebug('Registering new user:', userData.email);
      const data = await authService.register(userData);
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      logDebug('Registration successful:', normalizedUser);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      const errorMsg = error.message || 'Registration failed. Please try again.';
      logDebug('Registration failed:', errorMsg);
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login function
  const login = async (credentials) => {
    setIsLoading(true);
    try {
      logDebug('Logging in user:', credentials.email);
      const data = await authService.login(credentials);
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      logDebug('Login successful:', normalizedUser);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      const errorMsg = error.message || 'Invalid email or password. Please try again.';
      logDebug('Login failed:', errorMsg);
      toast.error(errorMsg, {
        duration: 4000, // Show longer toast for errors
        position: 'top-center',
        style: {
          border: '1px solid #f56565',
          padding: '16px',
          color: '#e53e3e',
          backgroundColor: '#fff5f5'
        },
        icon: '⚠️'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    logDebug('Logging out user');
    authService.logout();
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };
  
  // Update user function
  const updateUser = (userData) => {
    logDebug('Updating user data:', userData);
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };
  
  const value = {
    user,
    loading,
    isLoading,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'system_admin',
    isRestaurantAdmin: user?.role === 'restaurant_admin',
    isDeliveryPerson: user?.role === 'delivery_person',
    isCustomer: user?.role === 'customer',
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}; 

export default AuthProvider;