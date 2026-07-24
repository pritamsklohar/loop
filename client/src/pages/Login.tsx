import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setSubmitError(null);
      await login(data);
      navigate('/');
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E10] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-coral-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#1C1C1F]/60 backdrop-blur-xl border border-[#2A2A2E] p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-coral-600/20 text-coral-500 mb-4 border border-coral-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#F2F2F3]">Welcome to LOOP</h2>
          <p className="text-[#A0A0A6] mt-2 text-sm">Sign in to your analytical workspace</p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#F2F2F3] mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-coral-500/50 transition-all ${
                errors.email ? 'border-rose-500/50' : 'border-[#2A2A2E] focus:border-coral-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-[#F2F2F3]" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-coral-500/50 transition-all ${
                errors.password ? 'border-rose-500/50' : 'border-[#2A2A2E] focus:border-coral-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-lg bg-coral-600 hover:bg-coral-500 text-[#F2F2F3] font-semibold shadow-lg hover:shadow-indigo-500/20 active:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#A0A0A6]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-coral-500 hover:text-indigo-300 font-semibold transition-colors">
            Create workspace
          </Link>
        </p>
      </div>
    </div>
  );
};
