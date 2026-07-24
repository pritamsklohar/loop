import React from 'react';
import { Link } from 'react-router-dom';

export const Forbidden: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E10] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black tracking-tight text-[#F2F2F3]">403: Forbidden Access</h1>
      <p className="text-[#A0A0A6] text-sm mt-3 max-w-md">
        You do not have the required role privileges to access this portal page. Please verify your administrative workspace roles or return to the dashboard.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/"
          className="py-2 px-5 bg-coral-600 hover:bg-coral-500 text-[#F2F2F3] text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
