import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Gavel,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Destination route after login (defaulting to '/')
  const from = location.state?.from?.pathname || '/';

  // Registration feedback message if navigated from /register
  const registrationNotice = location.state?.message;

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your college email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(trimmedEmail, password);
      // Auth state update in AuthContext triggers navigation via useEffect
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.message || 'Invalid email or password. Please verify your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center py-6 sm:py-12">
      {/* Return to Home Link */}
      <div className="w-full max-w-md mx-auto mb-6 px-4 sm:px-0">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campus Home</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Branding & Welcome Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-200 mb-2 hover:scale-105 transition-transform"
            aria-label="Campus Auction Home"
          >
            <Gavel className="w-6 h-6" />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to Campus Auction
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Sign in with your official college email to browse, bid, and list campus items.
          </p>
        </div>

        {/* Successful Registration Message Banner */}
        {registrationNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{registrationNotice}</p>
          </div>
        )}

        {/* Authentication Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="e.g. student@campus.edu or rollno@college.ac.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Use your registered university email address.
            </p>
          </div>

          {/* Password Input with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="studentPassword"
                className="block text-xs font-bold text-slate-700"
              >
                Password <span className="text-rose-500">*</span>
              </label>

              {/* Forgot password placeholder */}
              <button
                type="button"
                onClick={() =>
                  alert('Password recovery will be connected with university email verification in a future step.')
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="studentPassword"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={isSubmitting}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Primary Sign In Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : LogIn}
              className={`w-full justify-center py-2.5 font-bold shadow-sm ${
                isSubmitting ? 'cursor-wait opacity-80' : ''
              }`}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* Link to Registration */}
        <div className="relative border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Don't have a campus account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Trust Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Restricted to students with verified educational credentials</span>
        </div>
      </div>
    </div>
  );
}
