import { Link, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  
  const goBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
            <FiAlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 
 
 