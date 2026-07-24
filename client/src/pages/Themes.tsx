import React, { useEffect, useState } from 'react';

import { Skeleton } from '../components/Skeleton';
import api from '../lib/api';

interface TrendItem {
  _id: string;
  name: string;
  color: string;
  description: string;
  currentCount: number;
  previousCount: number;
  allTimeCount: number;
  pctChange: number;
  status: 'spiking' | 'up' | 'down' | 'stable';
}

interface FeedbackLog {
  _id: string;
  content: string;
  channel: string;
  customerLabel?: string;
  status: string;
  createdAt: string;
}

export const Themes: React.FC = () => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown states
  const [selectedTheme, setSelectedTheme] = useState<TrendItem | null>(null);
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsPage, setLogsPage] = useState<number>(1);
  const [logsTotalPages, setLogsTotalPages] = useState<number>(1);
  const [logsTotalItems, setLogsTotalItems] = useState<number>(0);
  const logsLimit = 5;

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/insights/trends');
      setTrends(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeFeedback = async (themeId: string, pageNum: number) => {
    try {
      setLogsLoading(true);
      const res = await api.get(`/themes/${themeId}/feedback?page=${pageNum}&limit=${logsLimit}`);
      setLogs(res.data.feedback);
      setLogsTotalPages(res.data.pages);
      setLogsTotalItems(res.data.total);
    } catch (err) {
      console.error('Failed to load theme feedback logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      fetchThemeFeedback(selectedTheme._id, logsPage);
    }
  }, [selectedTheme, logsPage]);

  const selectTheme = (theme: TrendItem) => {
    setSelectedTheme(theme);
    setLogsPage(1); // Reset page on new theme selection
  };

  const getTrendBadge = (status: TrendItem['status'], change: number) => {
    switch (status) {
      case 'spiking':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-455 border border-rose-500/30 animate-pulse">
            🔥 Spiking (+{change}%)
          </span>
        );
      case 'up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            ↑ +{change}%
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            ↓ {change}%
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2A2A2E] text-[#A0A0A6] border border-slate-700">
            Stable (0%)
          </span>
        );
    }
  };

  const formatChannelName = (channel: string) => {
    return channel.replace('_', ' ');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 text-[#F2F2F3]">
      <div>
        <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Trends</h1>
        <p className="text-[#A0A0A6] mt-1.5 text-sm">Detected themes across channels, ranked by momentum and volume.</p>
      </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl py-20 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-semibold text-[#F2F2F3] text-xl">No Themes Found</h3>
            <p className="text-[#A0A0A6] text-sm mt-2 max-w-md">
              There are no category themes populated in your workspace. Build or classify feedback entries to initialize themes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trends.map(theme => (
              <div
                key={theme._id}
                onClick={() => selectTheme(theme)}
                style={{ borderColor: selectedTheme?._id === theme._id ? theme.color : '' }}
                className={`bg-[#1C1C1F] border cursor-pointer rounded-xl p-6 shadow-xl transition-all hover:scale-[1.01] hover:bg-slate-850/50 flex flex-col justify-between min-h-[180px] ${selectedTheme?._id === theme._id ? 'ring-1 ring-offset-2 ring-offset-slate-955 shadow-indigo-500/5' : 'border-[#2A2A2E]'}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: theme.color }}></span>
                      <h3 className="font-bold text-[#F2F2F3] text-lg truncate max-w-[160px]">{theme.name}</h3>
                    </div>
                    {getTrendBadge(theme.status, theme.pctChange)}
                  </div>
                  <p className="text-[#A0A0A6] text-xs mt-3 line-clamp-2">{theme.description}</p>
                </div>
                <div className="flex items-end justify-between pt-4 mt-4 border-t border-[#2A2A2E]">
                  <div className="text-xs text-[#A0A0A6] flex flex-col gap-1">
                    <div>Prev week: <span className="font-semibold text-[#A0A0A6]">{theme.previousCount}</span></div>
                    <div>All-time: <span className="font-semibold text-indigo-400">{theme.allTimeCount}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xs font-bold text-slate-550 uppercase tracking-wide">Current Volume</div>
                    <div className="text-2xl font-black text-[#F2F2F3]">{theme.currentCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drill-down logs table */}
        {selectedTheme && (
          <div id="drilldown-panel" className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl shadow-xl overflow-hidden pt-6">
            <div className="px-6 flex items-center justify-between border-b border-[#2A2A2E] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTheme.color }}></span>
                <h3 className="font-bold text-[#F2F2F3] text-lg">Drilldown Logs: {selectedTheme.name}</h3>
                <span className="text-xs text-[#A0A0A6]">({logsTotalItems} matches)</span>
              </div>
              <button
                onClick={() => setSelectedTheme(null)}
                className="text-xs text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors font-bold cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>

            {logsLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coral-500"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-[#A0A0A6] text-sm">No feedback logs found under this theme.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#2A2A2E] text-[#A0A0A6] font-semibold bg-[#0E0E10]/40">
                        <th className="py-3 px-6">Content</th>
                        <th className="py-3 px-6">Channel</th>
                        <th className="py-3 px-6">Customer</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-850/20 transition-colors text-[#F2F2F3]">
                          <td className="py-3.5 px-6 max-w-md">
                            <p className="line-clamp-2 text-[#F2F2F3] text-sm">{log.content}</p>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-[#2A2A2E] border border-slate-700 text-[#F2F2F3] capitalize">
                              {formatChannelName(log.channel)}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-sm">{log.customerLabel || 'Anonymous'}</td>
                          <td className="py-3.5 px-6 text-center text-xs">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-2xs bg-coral-500/10 text-coral-500 border border-coral-500/20">
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-sm text-[#A0A0A6]">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-[#2A2A2E] px-6 py-4 flex items-center justify-between bg-[#0E0E10]/20">
                  <div className="text-xs text-[#A0A0A6]">
                    Page <span className="text-[#F2F2F3] font-medium">{logsPage}</span> of{' '}
                    <span className="text-[#F2F2F3] font-medium">{logsTotalPages || 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      className="px-2.5 py-1 bg-slate-805 hover:bg-slate-700 disabled:opacity-40 text-[#F2F2F3] rounded text-xs transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                      disabled={logsPage === logsTotalPages || logsTotalPages === 0}
                      className="px-2.5 py-1 bg-slate-855 hover:bg-slate-700 disabled:opacity-40 text-[#F2F2F3] rounded text-xs transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
    </div>
  );
};
