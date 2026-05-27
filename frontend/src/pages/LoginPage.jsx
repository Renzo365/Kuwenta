import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

// Validation Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

function LoginPage() {
  const { login, isLoading, error: authError, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setGeneralError(null);
    clearError();
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setGeneralError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Brand logo/name */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="font-extrabold text-lg text-white">K</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">Kuwenta</span>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-extrabold text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-slate-400 mb-6">Enter your credentials to access your financial dashboard.</p>

        {(generalError || authError) && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {generalError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@university.edu"
            error={errors.email}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password}
              {...register('password')}
            />
            <div className="text-right">
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline" onClick={clearError}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
