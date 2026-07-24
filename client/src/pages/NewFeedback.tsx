import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const feedbackSchema = z.object({
  content: z.string().min(5, 'Feedback content must be at least 5 characters long'),
  channel: z.enum(['support_ticket', 'app_store', 'nps_survey', 'sales_call', 'community_post']),
  customerLabel: z.string().optional(),
  sourceRef: z.string().optional()
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export const NewFeedback: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Role validation
  // NOTE: Hiding or disabling options for VIEWERS is UX only. Server validates with requireRole.
  const isViewer = user?.role === 'VIEWER';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      channel: 'support_ticket'
    }
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    if (isViewer) return;
    try {
      setSubmitError(null);
      await api.post('/feedback', data);
      navigate('/feedback');
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2A2A2E] bg-[#1C1C1F]/50 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/feedback" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-coral-600/20 text-coral-500 border border-coral-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="font-bold text-xl tracking-wider text-[#F2F2F3]">LOOP / Add Feedback Log</span>
        </div>
      </header>

      {/* Form Container */}
      <main className="flex-1 p-6 md:p-10 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Add Feedback Log</h1>
          <p className="text-[#A0A0A6] mt-2">Log a new piece of qualitative customer text for parsing</p>
        </div>

        {isViewer && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>You have read-only access (Viewer). You are not permitted to submit new feedback.</span>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Feedback Content */}
            <div>
              <label className="block text-sm font-semibold text-[#F2F2F3] mb-2" htmlFor="content">
                Feedback Content
              </label>
              <textarea
                id="content"
                rows={5}
                disabled={isViewer}
                placeholder="Paste customer message, support transcript, or survey response here..."
                {...register('content')}
                className={`w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 transition-all ${
                  errors.content ? 'border-rose-500/50' : 'border-[#2A2A2E] focus:border-coral-500'
                }`}
              />
              {errors.content && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.content.message}</p>
              )}
            </div>

            {/* Grid for channel and customerLabel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Channel */}
              <div>
                <label className="block text-sm font-semibold text-[#F2F2F3] mb-2" htmlFor="channel">
                  Source Channel
                </label>
                <select
                  id="channel"
                  disabled={isViewer}
                  {...register('channel')}
                  className="w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border border-[#2A2A2E] text-[#F2F2F3] text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:border-coral-500"
                >
                  <option value="support_ticket">Support Ticket</option>
                  <option value="app_store">App Store Review</option>
                  <option value="nps_survey">NPS Survey</option>
                  <option value="sales_call">Sales Call</option>
                  <option value="community_post">Community Post</option>
                </select>
              </div>

              {/* Customer Label */}
              <div>
                <label className="block text-sm font-semibold text-[#F2F2F3] mb-2" htmlFor="customerLabel">
                  Customer Label / Company Name (Optional)
                </label>
                <input
                  id="customerLabel"
                  type="text"
                  disabled={isViewer}
                  placeholder="e.g. Acme Corp"
                  {...register('customerLabel')}
                  className="w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border border-[#2A2A2E] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:border-coral-500"
                />
              </div>

            </div>

            {/* Source Reference */}
            <div>
              <label className="block text-sm font-semibold text-[#F2F2F3] mb-2" htmlFor="sourceRef">
                Source Reference / ID (Optional)
              </label>
              <input
                id="sourceRef"
                type="text"
                disabled={isViewer}
                placeholder="e.g. ticket-1052"
                {...register('sourceRef')}
                className="w-full px-4 py-3 rounded-lg bg-[#0E0E10]/80 border border-[#2A2A2E] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:border-coral-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isViewer}
              className="w-full py-3 px-4 rounded-lg bg-coral-600 hover:bg-coral-500 text-[#F2F2F3] font-semibold shadow-lg hover:shadow-indigo-500/20 active:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Submit Feedback Log'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
