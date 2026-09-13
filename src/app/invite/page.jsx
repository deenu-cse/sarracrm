"use client";
import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { post } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = useMemo(
    () => (searchParams.get('email') || '').trim().toLowerCase(),
    [searchParams]
  );

  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep email in sync if URL query arrives after first paint
  React.useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [emailFromUrl]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your invitation email');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP from your email');
      return;
    }

    // If link had an email, typed email must match it
    if (emailFromUrl && email.trim().toLowerCase() !== emailFromUrl) {
      setError('Email does not match the invitation link. Use the same email that received the invite.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await post('/auth/verify-invite-otp', {
        email: email.trim().toLowerCase(),
        otp
      });
      if (!res?.success) {
        setError(res?.message || 'Invalid or expired OTP');
        return;
      }
      // Lock to the verified invitation email from backend
      setEmail(res.data?.email || email.trim().toLowerCase());
      setInfo(`Welcome ${res.data?.name || ''}. Set a secure password to activate your account.`);
      setStep('password');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await post('/auth/accept-invite', { email, otp, password });
      if (!res?.success) {
        setError(res?.message || 'Failed to set password');
        return;
      }
      setStep('done');
      setTimeout(() => router.replace('/login'), 2200);
    } catch {
      setError('Could not activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] bg-navy flex-col justify-between p-12 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(194,65,12,0.35), transparent 45%)',
          }}
        />
        <div className="relative z-10">
          <p className="text-blue-200 text-xs uppercase tracking-[0.25em] font-semibold mb-4">
            Government of Uttarakhand
          </p>
          <h1 className="text-4xl font-bold tracking-wider mb-2">SARRA</h1>
          <p className="text-blue-100 text-lg">CRM Portal Invitation</p>
          <blockquote className="mt-12 border-l-4 border-saffron pl-4 text-xl italic text-white/90">
            &quot;पानी की रक्षा, भविष्य की सुरक्षा&quot;
          </blockquote>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-blue-100 text-sm">
          <Shield className="w-5 h-5 text-saffron" />
          Secure onboarding · OTP expires in 5 hours
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {step === 'otp' && 'Verify Invitation'}
              {step === 'password' && 'Create Password'}
              {step === 'done' && "You're All Set"}
            </h2>
            <p className="text-slate-500">
              {step === 'otp' && 'Enter the OTP from your invite email to continue.'}
              {step === 'password' && 'Choose a strong password for your SARRA account.'}
              {step === 'done' && 'Redirecting you to login…'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {info && !error && step !== 'done' && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-navy rounded-r-md">
              <p className="text-sm text-slate-700">{info}</p>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="relative">
                <input
                  type="email"
                  id="invite-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                  placeholder="Email"
                  required
                />
                <label
                  htmlFor="invite-email"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Email Address
                </label>
              </div>
              <p className="text-xs text-slate-500 -mt-3">
                Must be the same email that received the invitation.
              </p>

              <div className="relative">
                <input
                  type="text"
                  id="invite-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 text-center tracking-[0.4em] text-xl font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                  placeholder="000000"
                  required
                />
                <label
                  htmlFor="invite-otp"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  6-Digit OTP
                </label>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="h-12">
                Verify OTP
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy pr-12"
                  placeholder="Password"
                  required
                />
                <label
                  htmlFor="new-password"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                  placeholder="Confirm Password"
                  required
                />
                <label
                  htmlFor="confirm-password"
                  className="absolute left-4 top-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Confirm Password
                </label>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="h-12">
                Set Password &amp; Activate
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-600">
                Your account is active. A welcome email is on its way. Taking you to login…
              </p>
              <Button type="button" variant="primary" fullWidth onClick={() => router.replace('/login')}>
                Go to Login now
              </Button>
            </div>
          )}

          <div className="mt-10 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Already activated?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-navy font-medium hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-navy">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
