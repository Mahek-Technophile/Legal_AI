import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Activity, Settings, Shield, Bell, Download } from 'lucide-react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { authService } from '../lib/firebase';

interface DashboardPageProps {
  onBack: () => void;
}

export function DashboardPage({ onBack }: DashboardPageProps) {
  const { user, profile, updateProfile, signOut } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activity' | 'settings'>('overview');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [user, activeTab]);

  const loadActivityLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const logs = await authService.getUserActivityLogs(user.uid);
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Main</span>
              </button>
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500">Manage your account and preferences</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    {user?.displayName || 'User'}
                  </h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">Account Overview</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-900">Account Security</h3>
                          <p className="text-sm text-blue-700">
                            {user?.emailVerified ? 'Email verified' : 'Email not verified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-medium text-green-900">Login Count</h3>
                          <p className="text-sm text-green-700">
                            {profile?.loginCount || 0} total logins
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Account Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-2 text-slate-900">{user?.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Display Name:</span>
                        <span className="ml-2 text-slate-900">{user?.displayName || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Account Created:</span>
                        <span className="ml-2 text-slate-900">
                          {profile?.createdAt?.toLocaleDateString() || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Login:</span>
                        <span className="ml-2 text-slate-900">
                          {profile?.lastLoginAt?.toLocaleDateString() || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">Profile Settings</h2>
                  <p className="text-slate-600">
                    Profile management features would be implemented here.
                  </p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Activity Log</h2>
                    <button
                      onClick={loadActivityLogs}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Loading activity...</p>
                    </div>
                  ) : activityLogs.length > 0 ? (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900">{log.description}</h4>
                              <p className="text-sm text-slate-500">Type: {log.type}</p>
                            </div>
                            <div className="text-sm text-slate-500">
                              {log.timestamp?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No activity logs found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <h4 className="font-medium text-slate-900">Notification Preferences</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">Email notifications</span>
                          <input
                            type="checkbox"
                            checked={profile?.preferences?.notifications ?? true}
                            className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">Marketing emails</span>
                          <input
                            type="checkbox"
                            checked={profile?.preferences?.marketing ?? false}
                            className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="h-5 w-5 text-slate-600" />
                        <h4 className="font-medium text-slate-900">Security Settings</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Email verification</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user?.emailVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user?.emailVerified ? 'Verified' : 'Not verified'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">Two-factor authentication</span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            Not configured
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}