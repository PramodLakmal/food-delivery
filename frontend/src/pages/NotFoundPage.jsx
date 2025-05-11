import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-9xl font-extrabold text-blue-600">404</h2>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Page not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiHome className="mr-2" />
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 
 
 