import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E10] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-coral-500/20 border border-coral-500/25 flex items-center justify-center text-coral-500 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black tracking-tight text-[#F2F2F3]">404: Page Not Found</h1>
      <p className="text-[#A0A0A6] text-sm mt-3 max-w-md">
        The workspace link you followed does not exist, or it has been migrated. Check the address bar and verify the URL parameters.
      </p>
      <div className="mt-8">
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
