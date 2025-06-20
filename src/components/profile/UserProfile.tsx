import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Settings, Activity, Save, X, Camera, Bell, Shield, Eye } from 'lucide-react';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { useScrollPosition, useScrollLock } from '../../hooks/useScrollPosition';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, profile, updateProfile } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Scroll management for modal
  const { lockScroll, unlockScroll } = useScrollLock();
  const { scrollPosition, elementRef: tabContentRef } = useScrollPosition({
    key: `profile-tab-${activeTab}`,
    restoreOnMount: true,
    saveOnUnmount: true
  });

  const [profileData, setProfileData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    profile: {
      firstName: profile?.profile?.firstName || '',
      lastName: profile?.profile?.lastName || '',
      company: profile?.profile?.company || '',
      jobTitle: profile?.profile?.jobTitle || '',
      address: {
        street: profile?.profile?.address?.street || '',
        city: profile?.profile?.address?.city || '',
        state: profile?.profile?.address?.state || '',
        zipCode: profile?.profile?.address?.zipCode || '',
        country: profile?.profile?.address?.country || '',
      }
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notifications: profile?.preferences?.notifications ?? true,
    marketing: profile?.preferences?.marketing ?? false,
  });

  // Handle modal open/close with scroll lock
  React.useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
  }, [isOpen, lockScroll, unlockScroll]);

  // Handle tab switching with scroll position preservation
  const handleTabSwitch = (newTab: 'profile' | 'settings' | 'activity') => {
    setActiveTab(newTab);
    // Small delay to ensure content is rendered before restoring scroll
    setTimeout(() => {
      if (tabContentRef.current) {
        tabContentRef.current.scrollTop = 0;
      }
    }, 50);
  };

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateProfile(user?.uid || '', {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        profile: profileData.profile
      });

      if (error) {
        setError(error);
      } else {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateProfile(user?.uid || '', {
        preferences: notificationSettings
      });

      if (error) {
        setError(error);
      } else {
        setSuccess('Settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Account</h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <nav className="p-4">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSwitch(tab.id as any)}
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

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div 
              ref={tabContentRef}
              className="flex-1 overflow-y-auto modal-scrollbar"
            >
              <div className="p-6">
                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    {success}
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Profile Information</h3>
                      
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                            {user?.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-8 w-8 text-slate-400" />
                            )}
                          </div>
                          <button className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors">
                            <Camera className="h-3 w-3" />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{profile?.displayName || 'No name set'}</h4>
                          <p className="text-slate-500 text-sm">{user?.email}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={profileData.displayName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={profileData.profile.company}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              profile: { ...prev.profile, company: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Account Settings</h3>
                      
                      {/* Notification Settings */}
                      <div className="bg-slate-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <Bell className="h-5 w-5 text-slate-600" />
                          <h4 className="font-medium text-slate-900">Notification Preferences</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-slate-700">Email notifications</span>
                            <input
                              type="checkbox"
                              checked={notificationSettings.notifications}
                              onChange={(e) => setNotificationSettings(prev => ({
                                ...prev,
                                notifications: e.target.checked
                              }))}
                              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-slate-700">Marketing emails</span>
                            <input
                              type="checkbox"
                              checked={notificationSettings.marketing}
                              onChange={(e) => setNotificationSettings(prev => ({
                                ...prev,
                                marketing: e.target.checked
                              }))}
                              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                            />
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Account Activity</h3>
                      
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-600 text-center py-8">
                          Activity logs will appear here once you start using the platform.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}