import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import { toast } from 'react-hot-toast';
import { FiMail, FiLoader, FiArrowLeft } from 'react-icons/fi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    
    try {
      await requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again later.');
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Check Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>
          <div className="mt-6">
            <Link to="/login" className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <FiArrowLeft className="mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isSubmitting ? (
                <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
              ) : null}
              Send Reset Link
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Remembered your password? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 
 
 