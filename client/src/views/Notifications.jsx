import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const Notifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/notifications/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification._id} className="border-b border-gray-200 pb-4 last:border-0">
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notifications available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;