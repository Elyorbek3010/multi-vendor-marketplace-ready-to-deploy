import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'BUYER'
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      await register(formData);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        const data = err.response.data;
        const newFieldErrors = {};
        const errorMessages = [];
        
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            newFieldErrors[key] = value[0];
            errorMessages.push(`${key}: ${value.join(' ')}`);
          } else if (typeof value === 'string') {
            newFieldErrors[key] = value;
            errorMessages.push(`${key}: ${value}`);
          }
        }
        
        setFieldErrors(newFieldErrors);
        if (errorMessages.length > 0) {
          setError(errorMessages.join(' | '));
        } else {
          setError('Failed to register. Please check your inputs.');
        }
      } else {
        setError('Failed to register. Please check your inputs.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 w-full max-w-md transition-colors duration-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Create an account</h2>
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${fieldErrors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:placeholder-gray-400 transition-colors duration-200`} 
              required 
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${fieldErrors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:placeholder-gray-400 transition-colors duration-200`} 
              required 
              minLength="8"
            />
            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Account Type</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="BUYER">Buyer</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
