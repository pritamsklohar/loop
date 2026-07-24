import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/Skeleton';
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

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);

  // Active view state
  const [activeReport, setActiveReport] = useState<ReportDoc | null>(null);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const handleShare = (reportId: string) => {
    const shareUrl = `${window.location.origin}/reports/${reportId}/public`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link to clipboard:', err);
    });
  };

  const fetchReports = async (selectFirst = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/reports');
      setReports(res.data);
      if (selectFirst && res.data.length > 0) {
        setActiveReport(res.data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load insights reports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    try {
      setGenerating(true);
      setError(null);
      const res = await api.post('/reports/generate', {
        periodStart: startDate,
        periodEnd: endDate
      });
      
      // Re-fetch list and select the newly generated report
      await fetchReports(false);
      setActiveReport(res.data);
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate insight report');
    } finally {
      setGenerating(false);
    }
  };

  const getShiftColor = (shift: number) => {
    if (shift > 0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (shift < 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-[#A0A0A6] bg-slate-500/10 border-slate-500/20';
  };

  const getShiftArrow = (shift: number) => {
    if (shift > 0) return '↑ +' + shift + ' (Sentiment Improved)';
    if (shift < 0) return '↓ ' + shift + ' (Sentiment Dropped)';
    return '→ 0.00 (No Change)';
  };

  const isViewer = user?.role === 'VIEWER';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full space-y-4 text-[#F2F2F3]">
      <div className="shrink-0 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Reports</h1>
          <p className="text-[#A0A0A6] mt-1 text-sm">Grounded executive summaries and recommended action items derived by Claude.</p>
        </div>
      </div>
      
      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Creation Panel & Saved Digests List */}
        <div className="lg:col-span-1 space-y-6 shrink-0">
          
          {/* Report Generator Box */}
          <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-5 shadow-xl space-y-4">
            <h2 className="font-bold text-[#F2F2F3] text-lg">Generate VoC Digest</h2>
            <p className="text-[#A0A0A6] text-xs leading-relaxed">
              Compile customer comments and sentiment shifts for a targeted date range. Requires ADMIN or ANALYST privileges.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4 pt-2">
              <div>
                <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  disabled={generating || isViewer}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">End Date</label>
                <input
                  type="date"
                  required
                  disabled={generating || isViewer}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !startDate || !endDate || isViewer}
                className="w-full py-2 bg-coral-600 hover:bg-coral-500 disabled:bg-[#2A2A2E] text-[#F2F2F3] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
              >
                {generating ? 'Assembling Metrics...' : 'Generate Insights Report'}
              </button>
              
              {isViewer && (
                <div className="text-center text-slate-550 text-2xs italic pt-1">
                  * Read-only VIEWER roles cannot generate reports.
                </div>
              )}
            </form>
          </div>

          {/* Saved Digests Index */}
          <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-[#F2F2F3] text-md">Saved Insights Digests</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center text-slate-550 text-xs py-6">No reports generated yet.</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {reports.map((report) => (
                  <button
                    key={report._id}
                    onClick={() => setActiveReport(report)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${activeReport?._id === report._id ? 'bg-coral-500/10 border-coral-500/35 text-[#F2F2F3]' : 'bg-[#0E0E10]/45 border-[#2A2A2E] text-[#F2F2F3] hover:bg-[#1C1C1F]'}`}
                  >
                    <div className="font-bold truncate text-[#F2F2F3]">{report.title}</div>
                    <div className="flex items-center justify-between text-[#A0A0A6] text-2xs mt-1.5">
                      <span>Shift: {report.contentJson.stats.sentimentShift.shift > 0 ? '+' : ''}{report.contentJson.stats.sentimentShift.shift}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Digest Detail View */}
        <div className="lg:col-span-2">
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!activeReport ? (
            <div className="h-full bg-[#1C1C1F]/40 border border-dashed border-[#2A2A2E] rounded-xl flex flex-col items-center justify-center text-center p-10 min-h-[400px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-semibold text-[#A0A0A6] text-lg">No Digest Selected</h3>
              <p className="text-slate-550 text-sm mt-1 max-w-sm">
                Select an existing digest from the list, or choose a date range to compile a new executive report.
              </p>
            </div>
          ) : (
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 md:p-8 shadow-2xl space-y-8 animate-fade-in text-[#F2F2F3]">
              
              {/* Digest Title Block */}
              <div className="border-b border-[#2A2A2E] pb-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <span className="text-2xs font-bold uppercase tracking-widest text-coral-500 bg-coral-500/10 px-2.5 py-1 rounded-md">Voice of Customer Digest</span>
                    <h1 className="text-2xl md:text-3xl font-black text-[#F2F2F3] tracking-tight mt-3">{activeReport.title}</h1>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0">
                    <button
                      onClick={() => handleShare(activeReport._id)}
                      className="py-1.5 px-3 bg-[#2A2A2E] hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      {shareSuccess ? 'Copied!' : 'Share Link'}
                    </button>
                    <a
                      href={`/reports/${activeReport._id}/public`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-coral-500 hover:bg-coral-500 text-[#F2F2F3] text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center inline-block"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
                <div className="text-[#A0A0A6] text-xs mt-2 flex flex-wrap items-center gap-4">
                  <span>Period: {new Date(activeReport.periodStart).toLocaleDateString()} to {new Date(activeReport.periodEnd).toLocaleDateString()}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span>Generated: {new Date(activeReport.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sentiment Shift Card */}
                <div className="bg-[#0E0E10]/50 border border-[#2A2A2E] rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-[#F2F2F3] text-xs uppercase tracking-wider text-[#A0A0A6]">Sentiment shift index</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-black ${getShiftColor(activeReport.contentJson.stats.sentimentShift.shift)}`}>
                    {getShiftArrow(activeReport.contentJson.stats.sentimentShift.shift)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-2xs text-[#A0A0A6] pt-2 border-t border-slate-900">
                    <div>This Period: <span className="font-bold text-[#F2F2F3]">{activeReport.contentJson.stats.sentimentShift.current}</span></div>
                    <div>Previous Period: <span className="font-bold text-[#F2F2F3]">{activeReport.contentJson.stats.sentimentShift.previous}</span></div>
                  </div>
                </div>

                {/* Top Ingestion Themes List */}
                <div className="bg-[#0E0E10]/50 border border-[#2A2A2E] rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-[#F2F2F3] text-xs uppercase tracking-wider text-[#A0A0A6]">Feedback Volume by Theme</h4>
                  <div className="divide-y divide-slate-900">
                    {activeReport.contentJson.stats.topThemes.length === 0 ? (
                      <div className="text-2xs text-[#A0A0A6] pt-2">No category themes identified.</div>
                    ) : (
                      activeReport.contentJson.stats.topThemes.map((t, idx) => (
                        <div key={idx} className="flex justify-between py-1.5 text-xs">
                          <span className="text-[#F2F2F3]">{t.name}</span>
                          <span className="font-bold text-[#F2F2F3]">{t.count} logs</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Narrative Summary section */}
              <div className="space-y-3">
                <h3 className="font-black text-[#F2F2F3] text-lg tracking-tight">Executive Summary</h3>
                <div className="bg-[#0E0E10]/20 border border-[#2A2A2E] rounded-xl p-5 leading-relaxed text-sm">
                  {activeReport.contentJson.narrative.summary}
                </div>
              </div>

              {/* Customer Verbatim Voices (quotes) */}
              <div className="space-y-4">
                <h3 className="font-black text-[#F2F2F3] text-lg tracking-tight">Verbatim Voices</h3>
                <div className="grid grid-cols-1 gap-3">
                  {activeReport.contentJson.stats.verbatimQuotes.length === 0 ? (
                    <div className="text-xs text-[#A0A0A6] italic">No feedback verbatim comments linked to this period.</div>
                  ) : (
                    activeReport.contentJson.stats.verbatimQuotes.map((quote, idx) => (
                      <div key={idx} className="bg-[#0E0E10]/45 border border-[#2A2A2E] rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute top-2 left-2 text-slate-800 text-3xl font-serif leading-none select-none">“</div>
                        <p className="text-sm italic pl-4 text-[#F2F2F3] relative z-10 leading-relaxed">
                          {quote}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Plan section */}
              <div className="space-y-4">
                <h3 className="font-black text-[#F2F2F3] text-lg tracking-tight">Recommended Action Plan</h3>
                <div className="space-y-2">
                  {activeReport.contentJson.narrative.recommendedActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-coral-500/5 border border-coral-500/10 rounded-xl p-4">
                      <span className="w-5 h-5 bg-coral-600/25 border border-coral-500/30 text-coral-500 rounded-md shrink-0 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-[#F2F2F3] leading-relaxed pt-0.5">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
