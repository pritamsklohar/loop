import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SummaryData {
  totalFeedbackCount: number;
  negativePercentage: number;
  newThisWeek: number;
  volumeOverTime: { date: string; count: number }[];
  sentimentBreakdown: { POS: number; NEU: number; NEG: number; UNASSIGNED: number };
  topThemes: { name: string; color: string; count: number }[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [data, setData] = useState<SummaryData | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumRes, feedRes, trendRes] = await Promise.all([
        api.get('/insights/summary'),
        api.get('/feedback?limit=5'),
        api.get('/insights/trends')
      ]);

      setData(sumRes.data);
      setRecentFeedback(feedRes.data.feedback || []);
      setTrends(trendRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const unassignedCount = data?.sentimentBreakdown?.UNASSIGNED || 0;
  
  // Setup Chart Data
  const volumeData = data?.volumeOverTime || [];
  const maxVolume = Math.max(...volumeData.map(d => d.count), 0);
  
  const sentimentTotal = data ? (data.sentimentBreakdown.POS + data.sentimentBreakdown.NEU + data.sentimentBreakdown.NEG) : 0;
  const posPercent = sentimentTotal > 0 ? Math.round((data!.sentimentBreakdown.POS / sentimentTotal) * 100) : 0;
  
  const sentimentChartData = data
    ? [
        { name: 'Positive', value: data.sentimentBreakdown.POS, color: '#10B981' },
        { name: 'Neutral', value: data.sentimentBreakdown.NEU, color: '#A0A0A6' },
        { name: 'Negative', value: data.sentimentBreakdown.NEG, color: '#EF4444' },
      ].filter(item => item.value > 0)
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1400px] mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F2F2F3] tracking-tight">
            Good afternoon, {user?.name?.split(' ')[0] || 'there'} — you have {unassignedCount} items needing review.
          </h1>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] text-[#A0A0A6] text-xs font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last synced: 2 min ago
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[320px] lg:col-span-2" />
            <Skeleton className="h-[320px] lg:col-span-1" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      ) : (
        <>
          {/* BENTO ROW 1: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Volume Chart */}
            <div className="lg:col-span-2 bg-[#1C1C1F] border border-[#2A2A2E] rounded-[20px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#F2F2F3]">Feedback Volume</h3>
                <Link to="/app/trends" className="text-xs font-medium text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors flex items-center">
                  View All <span className="ml-1">›</span>
                </Link>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#A0A0A6" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A0A0A6" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#2A2A2E', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#0E0E10', border: '1px solid #2A2A2E', borderRadius: '8px', color: '#F2F2F3' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {volumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count === maxVolume ? '#FF6B4A' : '#39393F'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="lg:col-span-1 bg-[#1C1C1F] border border-[#2A2A2E] rounded-[20px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#F2F2F3]">Sentiment Breakdown</h3>
                <Link to="/app/inbox" className="text-xs font-medium text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors flex items-center">
                  View All <span className="ml-1">›</span>
                </Link>
              </div>
              
              <div className="flex flex-col items-center justify-center relative mb-6">
                <div className="w-32 h-32 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-[#F2F2F3]">{posPercent}%</span>
                    <span className="text-[9px] font-bold text-[#A0A0A6] uppercase tracking-wider">Positive</span>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 mt-auto">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#F2F2F3]">Positive</span>
                    <span className="text-[#A0A0A6]">{data?.sentimentBreakdown?.POS || 0}</span>
                  </div>
                  <div className="w-full bg-[#0E0E10] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sentimentTotal ? ((data?.sentimentBreakdown?.POS || 0) / sentimentTotal) * 100 : 0}%` }}></div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#F2F2F3]">Neutral</span>
                    <span className="text-[#A0A0A6]">{data?.sentimentBreakdown?.NEU || 0}</span>
                  </div>
                  <div className="w-full bg-[#0E0E10] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#A0A0A6] h-full rounded-full" style={{ width: `${sentimentTotal ? ((data?.sentimentBreakdown?.NEU || 0) / sentimentTotal) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#F2F2F3]">Negative</span>
                    <span className="text-[#A0A0A6]">{data?.sentimentBreakdown?.NEG || 0}</span>
                  </div>
                  <div className="w-full bg-[#0E0E10] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sentimentTotal ? ((data?.sentimentBreakdown?.NEG || 0) / sentimentTotal) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO ROW 2: Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Recent Feedback */}
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-[20px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#F2F2F3]">Recent Feedback</h3>
                <Link to="/app/inbox" className="text-xs font-medium text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors flex items-center">
                  View All <span className="ml-1">›</span>
                </Link>
              </div>
              <div className="space-y-4">
                {recentFeedback.length === 0 ? (
                  <div className="text-sm text-[#A0A0A6]">No recent feedback.</div>
                ) : (
                  recentFeedback.map((fb, idx) => (
                    <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#0E0E10] border border-[#2A2A2E] flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-[#F2F2F3] font-medium">{fb.channel === 'app_store' ? 'App' : fb.channel === 'support_ticket' ? 'Sup' : 'Web'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#F2F2F3] truncate">{fb.content}</div>
                        <div className="text-xs text-[#A0A0A6] truncate mt-0.5">
                          {new Date(fb.createdAt).toLocaleDateString()} {fb.customerLabel ? `• ${fb.customerLabel}` : ''}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-right shrink-0">
                        {fb.sentiment === 'POS' ? (
                          <span className="text-emerald-500">Positive</span>
                        ) : fb.sentiment === 'NEG' ? (
                          <span className="text-rose-500">Negative</span>
                        ) : fb.sentiment === 'NEU' ? (
                          <span className="text-[#A0A0A6]">Neutral</span>
                        ) : (
                          <span className="text-amber-500">Pending</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Theme Activity */}
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-[20px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#F2F2F3]">Theme Activity</h3>
                <Link to="/app/trends" className="text-xs font-medium text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors flex items-center">
                  View All <span className="ml-1">›</span>
                </Link>
              </div>
              <div className="space-y-4">
                {trends.length === 0 ? (
                  <div className="text-sm text-[#A0A0A6]">No active themes detected.</div>
                ) : (
                  trends.slice(0, 5).map((theme, idx) => {
                    const isSpiking = theme.status === 'up' && theme.pctChange > 30;
                    return (
                      <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-[#0E0E10] border border-[#2A2A2E] flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-[#A0A0A6] font-medium">#</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#F2F2F3] truncate capitalize">{theme.name}</div>
                          <div className="text-xs text-[#A0A0A6] truncate mt-0.5">
                            {theme.currentCount} items this period
                          </div>
                        </div>
                        <div className="text-xs font-bold text-right shrink-0">
                          {isSpiking ? (
                            <span className="text-coral-500">+ {Math.round(theme.pctChange)}% Spike</span>
                          ) : theme.status === 'up' ? (
                            <span className="text-[#A0A0A6]">Trending up</span>
                          ) : (
                            <span className="text-[#A0A0A6]">Stable</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
