import { useAuth } from '../contexts/AuthContext';
import { LogIn, CheckSquare } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <CheckSquare className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Task Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your tasks
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={login}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
              </span>
              Sign in with Google
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Secure authentication powered by Google OAuth 2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
