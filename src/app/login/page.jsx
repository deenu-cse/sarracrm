"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { post } from '@/lib/api';
import { Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getDashboardRoute } from '@/lib/routes';

export default function LoginPage() {
  const [view, setView] = useState('login'); // login | forgot | otp | reset | success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [isAuthenticated, user, isLoading, router]);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const goTo = (nextView) => {
    resetMessages();
    setView(nextView);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.restricted) return;
        setError(result.message || 'Invalid email or password');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await post('/auth/forgot-password', { email });
      if (result?.success === false) {
        setError(result.message || 'Failed to send OTP');
        return;
      }
      setOtp('');
      setView('otp');
      setError('');
      setInfo(result?.message || 'OTP sent. Check your email or the backend terminal.');
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await post('/auth/verify-reset-otp', { email, otp });
      if (!result?.success) {
        setError(result?.message || 'Invalid or expired OTP');
        return;
      }
      goTo('reset');
    } catch {
      setError('OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await post('/auth/reset-password', { email, otp, newPassword });
      if (!result?.success) {
        setError(result?.message || 'Failed to reset password');
        return;
      }
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      goTo('success');
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const titles = {
    login: { heading: 'Officer Login', sub: 'Enter your credentials to access your dashboard' },
    forgot: { heading: 'Forgot Password', sub: 'Enter your registered email to receive an OTP' },
    otp: { heading: 'Verify OTP', sub: `Enter the 6-digit code sent to ${email}` },
    reset: { heading: 'Set New Password', sub: 'Choose a strong password for your account' },
    success: { heading: 'Password Updated', sub: 'You can now sign in with your new password' },
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,50 Q25,25 50,50 T100,50 V100 H0 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <h1 className="text-3xl font-bold tracking-wider">SARRA</h1>
              <p className="text-blue-200 uppercase tracking-widest text-sm">CRM Portal</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Spring & River <br />
            <span className="text-saffron">Rejuvenation Authority</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-md">
            Government of Uttarakhand
          </p>

          <blockquote className="border-l-4 border-saffron pl-4 italic text-2xl font-medium text-white/90 my-12">
            &quot;पानी की रक्षा, भविष्य की सुरक्षा&quot;
          </blockquote>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-3xl font-bold text-white mb-1">13</p>
            <p className="text-blue-200 text-sm">Districts</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-3xl font-bold text-white mb-1">1200+</p>
            <p className="text-blue-200 text-sm">Springs</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-3xl font-bold text-white mb-1">86</p>
            <p className="text-blue-200 text-sm">Projects</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-navy rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-navy">SARRA Portal</h1>
            <p className="text-slate-500">Government of Uttarakhand</p>
          </div>

          <div className="text-center lg:text-left mb-10">
            {view !== 'login' && view !== 'success' && (
              <button
                type="button"
                onClick={() => goTo(view === 'forgot' ? 'login' : view === 'otp' ? 'forgot' : 'otp')}
                className="inline-flex items-center gap-1 text-sm text-navy hover:underline mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{titles[view].heading}</h2>
            <p className="text-slate-500">{titles[view].sub}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {info && !error && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-navy rounded-r-md">
              <p className="text-sm text-slate-700">{info}</p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Email Address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:text-xs peer-focus:top-2 peer-focus:uppercase peer-focus:text-navy cursor-text"
                >
                  Email Address
                </label>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white pr-12"
                    placeholder="Password"
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:text-xs peer-focus:top-2 peer-focus:uppercase peer-focus:text-navy cursor-text"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => goTo('forgot')}
                    className="text-sm font-medium text-navy hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="mt-8 text-base h-12 shadow-md shadow-blue-900/20"
              >
                Log in to Portal
              </Button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  id="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Email Address"
                  required
                />
                <label
                  htmlFor="forgot-email"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:text-xs peer-focus:top-2 peer-focus:uppercase peer-focus:text-navy cursor-text"
                >
                  Email Address
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="text-base h-12 shadow-md shadow-blue-900/20"
              >
                Send OTP
              </Button>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 text-center tracking-[0.4em] text-xl font-semibold placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white"
                  placeholder="000000"
                  required
                />
                <label
                  htmlFor="otp"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  6-Digit OTP
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="text-base h-12 shadow-md shadow-blue-900/20"
              >
                Verify OTP
              </Button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleForgotPassword}
                className="w-full text-sm text-navy hover:underline"
              >
                Resend OTP
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white pr-12"
                  placeholder="New Password"
                  required
                />
                <label
                  htmlFor="new-password"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:text-xs peer-focus:top-2 peer-focus:uppercase peer-focus:text-navy cursor-text"
                >
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 placeholder-transparent focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Confirm Password"
                  required
                />
                <label
                  htmlFor="confirm-password"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:normal-case peer-focus:text-xs peer-focus:top-2 peer-focus:uppercase peer-focus:text-navy cursor-text"
                >
                  Confirm Password
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="text-base h-12 shadow-md shadow-blue-900/20"
              >
                Reset Password
              </Button>
            </form>
          )}

          {view === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-600">Your password has been reset successfully.</p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                className="text-base h-12 shadow-md shadow-blue-900/20"
                onClick={() => goTo('login')}
              >
                Back to Login
              </Button>
            </div>
          )}

          <div className="mt-12 text-center text-sm text-slate-500 border-t border-slate-100 pt-8">
            <p>© {new Date().getFullYear()} SARRA. All rights reserved.</p>
            <p className="mt-1">For support, contact support@sarra.uk.gov.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
