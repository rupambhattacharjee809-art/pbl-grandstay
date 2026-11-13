import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest, setAuthToken } from '../utils/api.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login' ? { email, password } : { name, email, phone, password };
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode('login');
    setEmail('aarav@grandstay.com');
    setPassword('GrandStay@2026');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#07111e]/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a8811b]">
              GrandStay Membership
            </p>
            <h2 id="auth-modal-title" className="font-display text-2xl font-semibold text-[#0c1a2e] mt-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#0c1a2e] shadow-sm'
                : 'text-slate-600 hover:text-[#0c1a2e]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#0c1a2e] shadow-sm'
                : 'text-slate-600 hover:text-[#0c1a2e]'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
              />
              <input
                type="tel"
                placeholder="Mobile number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
              />
            </>
          )}

          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
          />

          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors cursor-pointer"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Demo member: aarav@grandstay.com</span>
            <button
              type="button"
              onClick={fillDemo}
              className="font-semibold text-[#1d3557] hover:underline cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
