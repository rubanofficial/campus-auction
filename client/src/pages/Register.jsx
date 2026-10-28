import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gavel,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurable API base URL with fallback to local development port
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side pre-validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid college email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: trimmedName,
          email: trimmedEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.message || data.error || 'Registration failed. Please check your details and try again.');
        setIsSubmitting(false);
        return;
      }

      // Successful registration: redirect to /login with feedback message
      navigate('/login', {
        state: {
          registered: true,
          email: trimmedEmail,
          message: data.message || 'Account registered successfully! You can now sign in with your credentials.',
        },
      });
    } catch (networkError) {
      setErrorMessage('Unable to connect to the campus server. Please ensure the backend is running and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center py-6 sm:py-12">
      {/* Return to Login Link */}
      <div className="w-full max-w-md mx-auto mb-6 px-4 sm:px-0">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-200 mb-2 hover:scale-105 transition-transform"
            aria-label="Campus Auction Home"
          >
            <Gavel className="w-6 h-6" />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Join your university marketplace to trade textbooks, bicycles, and electronics safely.
          </p>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label
              htmlFor="studentName"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="studentName"
                type="text"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera or Rohan Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* College Email Input */}
          <div>
            <label
              htmlFor="collegeEmail"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              College Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="collegeEmail"
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@campus.edu or rollno@college.ac.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must be your official university-issued email ID.
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Password (min. 6 characters) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                disabled={isSubmitting}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Primary Create Account Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : UserPlus}
              className={`w-full justify-center py-2.5 font-bold shadow-sm ${
                isSubmitting ? 'cursor-wait opacity-80' : ''
              }`}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* Link back to Login */}
        <div className="relative border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have a campus account?{' '}
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Safe campus community · Verified student transactions</span>
        </div>
      </div>
    </div>
  );
}
