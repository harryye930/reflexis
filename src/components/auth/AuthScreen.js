import React, { useState } from 'react';

const getErrorMessage = (error) => {
  const code = error?.code || '';
  if (code.includes('email-already-in-use')) return 'That email already has an account.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('weak-password')) return 'Use a password with at least 6 characters.';
  if (code.includes('operation-not-allowed')) {
    return 'Email/password sign-in is not enabled for this Firebase project yet.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Email or password is incorrect.';
  return error?.message || 'Something went wrong. Please try again.';
};

const validateAuthForm = ({ mode, email, password }) => {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (!password) return 'Password is required.';
  if (mode === 'signup' && password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return '';
};

const AuthScreen = ({ onSignIn, onSignUp }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const validationError = validateAuthForm({ mode, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await onSignUp(email.trim(), password)
        : await onSignIn(email.trim(), password);

      if (!result.success) {
        setError(getErrorMessage(result.error));
      }
    } catch (unexpectedError) {
      setError(getErrorMessage(unexpectedError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Reflexis</h1>
          <p className="text-sm text-slate-600 mt-2">
            Sign in to access your research projects.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-md mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`px-3 py-2 text-sm font-medium rounded ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`px-3 py-2 text-sm font-medium rounded ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Working...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AuthScreen;
