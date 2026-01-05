import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Building2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email verification, 2: password reset
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm();

  const password = watch('newPassword');

  // Step 1: Email verification
  const onEmailSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: data.email
      });

      if (response.data.success) {
        setVerifiedEmail(data.email);
        setStep(2);
        reset(); // Reset form to clear any auto-filled values
        toast.success('Email verified successfully! Please enter your new password.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify email';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Password reset
  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email: verifiedEmail,
        newPassword: data.newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully! You can now login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep(1);
    setVerifiedEmail('');
    reset();
    // Clear any potential browser autocomplete
    setTimeout(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        input.value = '';
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center py-8 sm:py-12 lg:py-16">
        <div className="container-mobile">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p className="mt-2 text-center text-sm sm:text-base text-gray-600">
              {step === 1 
                ? 'Enter your email address to reset your password'
                : `Setting new password for ${verifiedEmail}`
              }
            </p>
          </div>

          <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="card py-6 sm:py-8 px-4 sm:px-8 lg:px-10">
              {step === 1 ? (
                // Step 1: Email verification
                <form key="email-verification-form" className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onEmailSubmit)}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={`input pl-10 text-sm sm:text-base ${errors.email ? 'border-error-500' : ''}`}
                        placeholder="Enter your email address"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Verifying email...</span>
                        </div>
                      ) : (
                        <span className="text-base font-medium">Verify Email</span>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm text-primary-600 hover:text-primary-500 flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to login
                    </Link>
                  </div>
                </form>
              ) : (
                // Step 2: Password reset
                <form key="password-reset-form" className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onPasswordSubmit)}>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        required
                        className={`input pl-10 pr-10 text-sm sm:text-base ${errors.newPassword ? 'border-error-500' : ''}`}
                        placeholder="Enter your new password"
                        {...register('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                          },
                        })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        required
                        className={`input pl-10 pr-10 text-sm sm:text-base ${errors.confirmPassword ? 'border-error-500' : ''}`}
                        placeholder="Confirm your new password"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === password || 'Passwords do not match',
                        })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs sm:text-sm text-error-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Resetting password...</span>
                        </div>
                      ) : (
                        <span className="text-base font-medium">Reset Password</span>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={goBackToEmail}
                      className="text-sm text-primary-600 hover:text-primary-500 flex items-center justify-center mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to email verification
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 
