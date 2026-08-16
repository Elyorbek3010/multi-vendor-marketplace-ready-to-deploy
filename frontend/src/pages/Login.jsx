import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      const user = await login(email, password);
      navigate(user.role === 'VENDOR' ? '/dashboard/vendor' : '/');
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        const data = err.response.data;
        const newFieldErrors = {};
        const errorMessages = [];
        
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            newFieldErrors[key] = value[0];
            errorMessages.push(`${key === 'detail' || key === 'non_field_errors' ? '' : key + ': '}${value.join(' ')}`);
          } else if (typeof value === 'string') {
            newFieldErrors[key] = value;
            errorMessages.push(`${key === 'detail' || key === 'non_field_errors' ? '' : key + ': '}${value}`);
          }
        }
        
        setFieldErrors(newFieldErrors);
        if (errorMessages.length > 0) {
          setError(errorMessages.join(' | '));
        } else {
          setError('Invalid credentials');
        }
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 w-full max-w-md transition-colors duration-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sign in to your account</h2>
        {successMessage && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded mb-4 text-sm">{successMessage}</div>}
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${fieldErrors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:placeholder-gray-400 transition-colors duration-200`} 
              required 
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${fieldErrors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:placeholder-gray-400 transition-colors duration-200`} 
              required 
            />
            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
