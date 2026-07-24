import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

interface ReportDoc {
  _id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  contentJson: {
    stats: {
      topThemes: { name: string; count: number }[];
      sentimentShift: { current: number; previous: number; shift: number };
      verbatimQuotes: string[];
    };
    narrative: {
      summary: string;
      recommendedActions: string[];
    };
  };
  createdAt: string;
}

export const PublicReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/reports/${id}/public`);
        setReport(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load public insights digest');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPublicReport();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E10] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl max-w-md">
          {error || 'The requested insights report was not found or has been deleted.'}
        </div>
      </div>
    );
  }

  const { stats, narrative } = report.contentJson;

  return (
    <div className="min-h-screen bg-[#0E0E10] text-slate-100 print:bg-white print:text-black flex flex-col">
      
      {/* Floating Control Bar for Browser Only */}
      <div className="bg-[#1C1C1F]/80 border-b border-[#2A2A2E] backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between print:hidden">
        <span className="text-xs text-[#A0A0A6]">Public shareable view. Press print to save as PDF.</span>
        <button
          onClick={handlePrint}
          className="py-1.5 px-4 bg-coral-500 hover:bg-coral-500 text-[#F2F2F3] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Export PDF
        </button>
      </div>

      {/* Main Print Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 print:p-0 space-y-8 bg-[#0E0E10] print:bg-white">
        
        {/* Title Block */}
        <div className="border-b border-[#2A2A2E] print:border-slate-300 pb-6">
          <span className="text-2xs font-extrabold uppercase tracking-widest text-coral-500 print:text-indigo-600 bg-coral-500/10 print:bg-indigo-50 px-2 py-0.5 rounded">Voice of Customer Digest</span>
          <h1 className="text-3xl font-black text-[#F2F2F3] print:text-black tracking-tight mt-3">{report.title}</h1>
          <div className="text-[#A0A0A6] print:text-[#A0A0A6] text-xs mt-2 flex items-center gap-4">
            <span>Period: {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 print:bg-slate-300"></span>
            <span>Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Headline Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:gap-4 print:break-inside-avoid">
          
          {/* Sentiment Shift */}
          <div className="bg-[#1C1C1F]/50 print:bg-slate-50 border border-[#2A2A2E] print:border-slate-200 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-[#A0A0A6] print:text-[#A0A0A6] text-2xs uppercase tracking-wider">Sentiment Index Shift</h4>
            <div className={`inline-flex items-center px-3 py-1 rounded text-xs font-black ${
              stats.sentimentShift.shift > 0 
                ? 'text-emerald-400 print:text-emerald-700 bg-emerald-500/10 print:bg-emerald-50' 
                : stats.sentimentShift.shift < 0 
                ? 'text-rose-400 print:text-rose-700 bg-rose-500/10 print:bg-rose-50' 
                : 'text-[#A0A0A6] print:text-[#A0A0A6] bg-slate-500/10 print:bg-slate-50'
            }`}>
              {stats.sentimentShift.shift > 0 ? '↑' : stats.sentimentShift.shift < 0 ? '↓' : '→'} {stats.sentimentShift.shift > 0 ? '+' : ''}{stats.sentimentShift.shift} Index
            </div>
            <div className="grid grid-cols-2 gap-2 text-2xs text-[#A0A0A6] pt-2 border-t border-slate-900 print:border-slate-200">
              <div>This Period: <span className="font-bold text-[#F2F2F3] print:text-slate-700">{stats.sentimentShift.current}</span></div>
              <div>Prev Period: <span className="font-bold text-[#F2F2F3] print:text-slate-700">{stats.sentimentShift.previous}</span></div>
            </div>
          </div>

          {/* Top Ingestion Themes */}
          <div className="bg-[#1C1C1F]/50 print:bg-slate-50 border border-[#2A2A2E] print:border-slate-200 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-[#A0A0A6] print:text-[#A0A0A6] text-2xs uppercase tracking-wider">Top Topics</h4>
            <div className="divide-y divide-slate-905 print:divide-slate-200">
              {stats.topThemes.map((t, idx) => (
                <div key={idx} className="flex justify-between py-1 text-xs">
                  <span className="text-[#F2F2F3] print:text-[#A0A0A6]">{t.name}</span>
                  <span className="font-bold text-[#F2F2F3] print:text-black">{t.count} reviews</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Narrative Summary */}
        <div className="space-y-3 print:break-inside-avoid">
          <h3 className="font-black text-[#F2F2F3] print:text-black text-lg tracking-tight">Executive Summary</h3>
          <div className="bg-[#1C1C1F]/30 print:bg-slate-50 border border-[#2A2A2E] print:border-slate-200 rounded-xl p-5 leading-relaxed text-sm print:text-xs">
            {narrative.summary}
          </div>
        </div>

        {/* Customer Verbatim Voices */}
        <div className="space-y-4 print:break-inside-avoid">
          <h3 className="font-black text-[#F2F2F3] print:text-black text-lg tracking-tight">Verbatim Voices</h3>
          <div className="grid grid-cols-1 gap-3">
            {stats.verbatimQuotes.map((quote, idx) => (
              <div key={idx} className="bg-[#1C1C1F]/40 print:bg-slate-50 border border-[#2A2A2E] print:border-slate-200 rounded-xl p-4 relative overflow-hidden">
                <p className="text-sm print:text-xs italic text-[#F2F2F3] print:text-slate-700 leading-relaxed">
                  "{quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action Plan */}
        <div className="space-y-4 print:break-inside-avoid">
          <h3 className="font-black text-[#F2F2F3] print:text-black text-lg tracking-tight">Recommended Action Plan</h3>
          <div className="space-y-2">
            {narrative.recommendedActions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-coral-500/5 print:bg-slate-50 border border-coral-500/10 print:border-slate-200 rounded-xl p-4">
                <span className="w-5 h-5 bg-coral-600/25 print:bg-indigo-50 border border-coral-500/30 print:border-indigo-200 text-coral-500 print:text-indigo-600 rounded-md shrink-0 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm print:text-xs text-[#F2F2F3] print:text-slate-700 leading-relaxed pt-0.5">{action}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
