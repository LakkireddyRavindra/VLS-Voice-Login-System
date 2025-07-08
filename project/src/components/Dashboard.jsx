import React, { useEffect, useState } from 'react';
import { User, LogOut, Mic, Mail, Shield } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [userDetails, setUserDetails] = useState(user || {});

  useEffect(() => {
    fetch('http://localhost:3000/api/user/dashboard', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          setUserDetails(prev => ({
            ...prev,
            ...data // includes name, email, etc.
          }));
        }
      });
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back!</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-500">Your account details</p>
              </div>
            </div>

            <div className="space-y-3">
              {userDetails.name && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{userDetails.name}</span>
                </div>
              )}

              {userDetails.email && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{userDetails.email}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Login Method:</span>
                <div className="flex items-center space-x-2">
                  {userDetails.loginMethod === 'email' ? (
                    <>
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">Email</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Voice</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                <p className="text-sm text-gray-500">Account security status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Account Secured</span>
                </div>
                <Shield className="h-4 w-4 text-green-600" />
              </div>

              <div className="text-sm text-gray-600">
                <p>Your account is protected with modern authentication methods.</p>
                {userDetails.voiceEnrolled && (
                  <p className="mt-2 text-green-600">✓ Voice authentication enrolled</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to your Dashboard!</h2>
          <p className="text-blue-100">
            You have successfully logged in using{' '}
            {userDetails.loginMethod === 'email' ? 'email and password' : 'voice authentication'}.
            Your account is secure and ready to use.
          </p>
        </div>
      </div>
    </div>
  );
}
