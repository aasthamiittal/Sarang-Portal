import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BgLogin from '../assets/BgLogin.png';
import SarangLogo from '../assets/Logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    login(email, password);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - 3D Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center p-12">
        <div className="w-full h-full flex items-center justify-center ">
          <img
            src={BgLogin}
            style={{ borderRadius: "1rem" }}
            alt="Supply Chain Illustration"
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image doesn't load
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Side - Login Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Log In</h1>
            <p className="text-gray-500 text-sm">
              {/* Welcome to &nbsp;
              <span
                style={{ color: "#2563eb", fontSize: "1rem", fontWeight: "500" }}>
                SARANG
              </span> */}
              <br/>
              To manage your logistics and shipments seamlessly
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-gray-600 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@sarang.com"
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-gray-600 text-sm mb-2">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3 pr-10 bg-gray-50 border-0 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="h-[2px] absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                I agree to the terms of service
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-200"
            >
              Submit
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <span className="text-gray-400 text-sm">Not a member? </span>
            <a href="#" className="text-blue-600 text-sm hover:underline">
              Sign Up
            </a>

          </div>
          <div className="text-center mt-4">
             <span className="text-gray-300 text-sm">Powered By</span>
            <img
              src={SarangLogo}
              alt="Sarang Logo"
              className="mx-auto"
              style={{ width: '100px' }} // Adjust width to match text length
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default Login;