import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false,
};

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, login, register, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const updateField = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
      // Clear field error on change
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      if (error) clearError();
    },
    [error, clearError]
  );

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setFieldErrors({});
    setTouched({});
    setForm(INITIAL_FORM);
    clearError();
  }, [clearError]);

  // ── Client-side validation ──────────────────────────────────

  const validate = useCallback(
    (modeOverride?: AuthMode): FieldErrors => {
      const m = modeOverride ?? mode;
      const errors: FieldErrors = {};

      if (m === 'signup') {
        const trimmedName = form.name.trim();
        if (!trimmedName) {
          errors.name = 'Name is required';
        } else if (trimmedName.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }
      }

      const trimmedEmail = form.email.trim();
      if (!trimmedEmail) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!form.password) {
        errors.password = 'Password is required';
      } else if (form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (m === 'signup') {
        if (!form.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (form.password !== form.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }

      return errors;
    },
    [mode, form]
  );

  const handleBlur = useCallback(
    (field: keyof FieldErrors) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      // Validate individual field on blur
      const errors = validate();
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errors[field],
      }));
    },
    [validate]
  );

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all as touched
      setTouched({ name: true, email: true, password: true, confirmPassword: true });

      const errors = validate();
      setFieldErrors(errors);

      if (Object.keys(errors).length > 0) return;

      if (mode === 'signin') {
        const result = await login(form.email, form.password);
        if (result.success) {
          navigate('/', { replace: true });
        }
      } else {
        const result = await register(form.name, form.email, form.password);
        if (result.success) {
          navigate('/', { replace: true });
        }
      }
    },
    [mode, form, validate, login, register, navigate]
  );

  // ── Password strength ────────────────────────────────────────

  const passwordStrength = getPasswordStrength(form.password);

  // ── Demo credentials ─────────────────────────────────────────

  const fillDemo = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      email: 'demo@secondbrain.com',
      password: 'password123',
      confirmPassword: mode === 'signup' ? 'password123' : prev.confirmPassword,
    }));
    setTouched({ email: true, password: true });
    setFieldErrors({});
    clearError();
  }, [mode, clearError]);

  // ── Render ───────────────────────────────────────────────────

  const isSignIn = mode === 'signin';
  const hasFieldError = Object.keys(fieldErrors).length > 0;
  const submitDisabled = isLoading;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative flex flex-col justify-center px-16 xl:px-20 w-full">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3 tracking-tight">
              Second Brain
            </h1>
            <p className="text-lg text-brand-100 max-w-md leading-relaxed">
              Your personal knowledge management system. Capture ideas, organize tasks,
              and build your digital memory.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Organize', 'Capture', 'Process', 'Archive'].map((word) => (
              <span
                key={word}
                className="px-3 py-1 text-sm font-medium bg-white/15 text-white rounded-full border border-white/10"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo — visible on small screens only */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Second Brain
            </h2>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {isSignIn ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            {isSignIn
              ? 'Sign in to access your second brain'
              : 'Start building your second brain today'}
          </p>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 mb-6 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="flex-1">{error}</span>
              <button
                onClick={clearError}
                className="shrink-0 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name — sign up only */}
            {!isSignIn && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="auth-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    disabled={isLoading}
                    autoComplete="name"
                    placeholder="John Doe"
                    className={clsx(
                      'w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2 text-sm',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      'transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      touched.name && fieldErrors.name
                        ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500'
                    )}
                  />
                </div>
                {touched.name && fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.name}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading}
                  autoComplete={isSignIn ? 'email' : 'email'}
                  placeholder="you@example.com"
                  className={clsx(
                    'w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-3 py-2 text-sm',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    touched.email && fieldErrors.email
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500'
                  )}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  disabled={isLoading}
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  placeholder={isSignIn ? 'Enter your password' : 'Create a password'}
                  className={clsx(
                    'w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-10 py-2 text-sm',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    touched.password && fieldErrors.password
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.password}</p>
              )}
              {/* Password strength indicator — sign up only */}
              {!isSignIn && form.password.length > 0 && (
                <div className="mt-2">
                  <StrengthBar strength={passwordStrength} />
                </div>
              )}
            </div>

            {/* Confirm password — sign up only */}
            {!isSignIn && (
              <div>
                <label
                  htmlFor="auth-confirm"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    id="auth-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={isLoading}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    className={clsx(
                      'w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-10 pr-10 py-2 text-sm',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      'transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      touched.confirmPassword && fieldErrors.confirmPassword
                        ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    tabIndex={-1}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.confirmPassword && fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Remember me + Forgot password — sign in only */}
            {isSignIn && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e) => updateField('rememberMe', e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.alert('Password reset is coming soon!');
                    }
                  }}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitDisabled}
              className={clsx(
                'w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg',
                'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
                'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                'shadow-sm active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isSignIn ? 'Signing in...' : 'Creating account...'}
                </>
              ) : isSignIn ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              disabled={isLoading}
              className="font-medium text-brand-600 dark:text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1 py-0.5 disabled:opacity-50"
            >
              {isSignIn ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Demo hint card */}
          <div className="mt-6 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                  Demo credentials
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Any email address with a password of at least 6 characters will work.
                </p>
                <button
                  type="button"
                  onClick={fillDemo}
                  disabled={isLoading}
                  className="mt-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded disabled:opacity-50"
                >
                  Fill demo credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Password strength ──────────────────────────────────────────

type Strength = 'none' | 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): Strength {
  if (password.length === 0) return 'none';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const variety = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length < 8 || (password.length >= 8 && variety <= 1)) return 'weak';
  if (password.length >= 12 && variety >= 3) return 'strong';
  return 'medium';
}

const strengthConfig: Record<Strength, { label: string; color: string; width: string }> = {
  none: { label: '', color: '', width: '0%' },
  weak: { label: 'Weak', color: 'bg-red-500', width: '25%' },
  medium: { label: 'Medium', color: 'bg-amber-500', width: '60%' },
  strong: { label: 'Strong', color: 'bg-emerald-500', width: '100%' },
};

function StrengthBar({ strength }: { strength: Strength }) {
  const config = strengthConfig[strength];

  if (strength === 'none') return null;

  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', config.color)}
          style={{ width: config.width }}
        />
      </div>
      <p className={clsx('text-xs', config.color.replace('bg-', 'text-'), 'dark:text-inherit')}>
        {config.label}
      </p>
    </div>
  );
}
