import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Shield
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ROLE STATE
  const [selectedRole, setSelectedRole] = useState('employee');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  // ✅ ROLE OPTIONS
  const roles = [
    {
      id: 'employee',
      title: 'Office Employee',
      description: 'Order food and track deliveries',
      icon: User,
    },
    {
      id: 'delivery',
      title: 'Delivery Staff',
      description: 'Manage deliveries and update order status',
      icon: Building2,
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage menu, orders and users',
      icon: Shield,
    },
  ];

  // ✅ SUBMIT FUNCTION
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: selectedRole, // ✅ IMPORTANT FIX
      });

      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">

        <h2 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ================= ROLE SELECTION ================= */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Role
            </label>

            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-2 border rounded text-sm
                    ${
                      selectedRole === role.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300'
                    }
                  `}
                >
                  <role.icon className="w-4 h-4 mx-auto mb-1" />
                  {role.title}
                </button>
              ))}
            </div>
          </div>

          {/* ================= NAME ================= */}
          <div>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-2 rounded"
              {...register('name', {
                required: 'Name is required',
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* ================= EMAIL ================= */}
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              {...register('email', {
                required: 'Email is required',
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* ================= PHONE ================= */}
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full border p-2 rounded"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Enter valid 10-digit phone number',
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* ================= PASSWORD ================= */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full border p-2 rounded"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Minimum 6 characters',
                },
              })}
            />
            <span
              className="absolute right-3 top-2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </span>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* ================= CONFIRM PASSWORD ================= */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              className="w-full border p-2 rounded"
              {...register('confirmPassword', {
                required: 'Confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />
            <span
              className="absolute right-3 top-2 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </span>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* ================= SUBMIT ================= */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {isLoading ? <LoadingSpinner /> : 'Register'}
          </button>

          <p className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;