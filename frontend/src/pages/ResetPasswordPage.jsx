import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../services/authService';
import { toast } from 'react-hot-toast';
import { FiLock, FiLoader, FiArrowLeft } from 'react-icons/fi';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        await verifyResetToken(token);
        setTokenValid(true);
        setTokenChecked(true);
      } catch (error) {
        setTokenValid(false);
        setTokenChecked(true);
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };

    if (token) {
      checkToken();
    } else {
      setTokenValid(false);
      setTokenChecked(true);
      setError('No reset token provided. Please request a new password reset link.');
    }
  }, [token]);

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (error) validateForm();
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) validateForm();
  };

  const validateForm = () => {
    if (!newPassword) {
      setError('New password is required');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const resetData = {
        token,
        newPassword
      };
      
      await resetPassword(resetData);
      toast.success('Password reset successful');
      navigate('/login', { replace: true });
    } catch (error) {
      setError(error.message || 'Failed to reset password. Please try again.');
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin w-10 h-10 text-blue-500" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Verifying your reset link...</h2>
        </div>
      </div>
    );
  }

  if (tokenChecked && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
          <div className="mt-6 flex justify-center">
            <Link to="/forgot-password" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <FiArrowLeft className="mr-2" />
              Request a new reset link
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="new-password" className="sr-only">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={handlePasswordChange}
                  className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="New password"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Confirm password"
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
              Reset Password
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 
 