import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      fetchUserProfile(token);
    } catch (error) {
      console.error('Invalid token:', error);
      setUser(null);
    }
  };

  // Add axios interceptor for token expiry
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          logout();
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      decodeToken(storedToken);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthenticated(false);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const updateSettings = async (settingsData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/settings', settingsData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, settings: response.data.settings }));
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Settings update failed:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authenticated, updateProfile, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};