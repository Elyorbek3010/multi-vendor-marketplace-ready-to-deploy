import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user: userData } = useAuth();
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/password-change/', passwords);
      setMessage(response.data.detail || "Password changed successfully.");
      setPasswords({ old_password: '', new_password: '' });
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.old_password) {
          setError(err.response.data.old_password[0]);
        } else if (err.response.data.new_password) {
          setError(err.response.data.new_password[0]);
        } else {
          setError("Failed to change password. Please check your inputs.");
        }
      } else {
        setError("Network error occurred.");
      }
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white">Account Settings</h1>

      {/* Profile Information Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Username</p>
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{userData.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{userData.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Role</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {userData.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Change Password</h2>
        
        {message && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input 
              type="password" 
              required
              value={passwords.old_password}
              onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              value={passwords.new_password}
              onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Enter new password (min. 8 characters)"
            />
          </div>
          <div>
            <button 
              type="submit" 
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
