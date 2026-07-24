import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/Skeleton';
import api from '../lib/api';

interface FeedbackItem {
  _id: string;
  content: string;
  channel: string;
  sourceRef?: string;
  customerLabel?: string;
  status: 'NEW' | 'REVIEWED' | 'ACTIONED';
  sentiment?: 'POS' | 'NEU' | 'NEG' | null;
  themeIds: { themeId: string; confidence: number }[];
  createdAt: string;
}

interface ThemeItem {
  _id: string;
  name: string;
  color: string;
}

export const FeedbackList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Read query parameters directly from the URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const status = searchParams.get('status') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const theme = searchParams.get('theme') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const limit = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Search input local state
  const [searchInput, setSearchInput] = useState<string>(search);

  // Sync search input if query changes (e.g. Back button / Clear All)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounced search logic updating url
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateFilter('search', searchInput);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch themes for selection dropdowns
  const fetchThemes = async () => {
    try {
      const res = await api.get('/workspace/themes');
      setThemes(res.data);
    } catch (err) {
      console.error('Failed to load themes', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());
      if (search) queryParams.set('search', search);
      if (channel) queryParams.set('channel', channel);
      if (status) queryParams.set('status', status);
      if (sentiment) queryParams.set('sentiment', sentiment);
      if (theme) queryParams.set('theme', theme);
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);

      const res = await api.get(`/feedback?${queryParams.toString()}`);
      setFeedback(res.data.feedback);
      setTotalPages(res.data.pages);
      setTotalItems(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch feedback list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [page, search, channel, status, sentiment, theme, startDate, endDate]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter change
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const removeFilterKey = (key: string) => {
    updateFilter(key, '');
    if (key === 'search') setSearchInput('');
  };

  const isViewer = user?.role === 'VIEWER';

  // Optimistic UI Update for status changes
  const handleStatusChange = async (id: string, newStatus: 'NEW' | 'REVIEWED' | 'ACTIONED') => {
    const backupFeedback = [...feedback];

    setFeedback(prev => 
      prev.map(item => item._id === id ? { ...item, status: newStatus } : item)
    );

    try {
      await api.patch(`/feedback/${id}/status`, { status: newStatus });
    } catch (err: any) {
      setFeedback(backupFeedback);
      alert(err.response?.data?.error || 'Failed to update feedback status');
    }
  };

  const getChannelBadgeClass = (channel: string) => {
    switch (channel) {
      case 'support_ticket':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'app_store':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'nps_survey':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'sales_call':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'community_post':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      default:
        return 'bg-slate-500/10 text-[#A0A0A6] border border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-coral-500/10 text-coral-500 border border-coral-500/20';
      case 'REVIEWED':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'ACTIONED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-[#A0A0A6] border border-slate-500/20';
    }
  };

  const getSentimentBadgeClass = (sentiment?: string | null) => {
    switch (sentiment) {
      case 'POS':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'NEU':
        return 'bg-slate-500/10 text-[#A0A0A6] border border-slate-500/20';
      case 'NEG':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-[#2A2A2E] text-[#A0A0A6] border border-[#2A2A2E]/40';
    }
  };

  const formatChannelName = (channel: string) => {
    return channel.replace('_', ' ');
  };

  // Determine active filters counts to show active chips
  const activeFilters = [
    { key: 'search', label: 'Search', value: search },
    { key: 'channel', label: 'Channel', value: channel ? formatChannelName(channel) : '' },
    { key: 'status', label: 'Status', value: status },
    { key: 'sentiment', label: 'Sentiment', value: sentiment === 'null' ? 'Unassigned' : sentiment },
    { key: 'theme', label: 'Theme', value: themes.find(t => t._id === theme)?.name || '' },
    { key: 'startDate', label: 'From', value: startDate },
    { key: 'endDate', label: 'To', value: endDate }
  ].filter(f => f.value);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 text-[#F2F2F3]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Inbox</h1>
          <p className="text-[#A0A0A6] mt-1 text-sm">Every piece of feedback that reached your workspace, classified and searchable.</p>
        </div>
      </div>

        {/* Filter Center Card */}
        <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Search Content</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A0A0A6]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Type to filter content..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
                />
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Channel</label>
              <select
                value={channel}
                onChange={(e) => updateFilter('channel', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              >
                <option value="">All Channels</option>
                <option value="support_ticket">Support Ticket</option>
                <option value="app_store">App Store</option>
                <option value="nps_survey">NPS Survey</option>
                <option value="sales_call">Sales Call</option>
                <option value="community_post">Community Post</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ACTIONED">Actioned</option>
              </select>
            </div>

            {/* Sentiment */}
            <div>
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Sentiment</label>
              <select
                value={sentiment}
                onChange={(e) => updateFilter('sentiment', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              >
                <option value="">All Sentiments</option>
                <option value="POS">Positive</option>
                <option value="NEU">Neutral</option>
                <option value="NEG">Negative</option>
                <option value="null">Unassigned</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Theme</label>
              <select
                value={theme}
                onChange={(e) => updateFilter('theme', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              >
                <option value="">All Themes</option>
                {themes.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            {/* Date Range - Start */}
            <div className="sm:col-span-1">
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-slate-855 text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              />
            </div>

            {/* Date Range - End */}
            <div className="sm:col-span-1">
              <label className="block text-[#A0A0A6] text-xs font-semibold mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0E0E10] border border-slate-855 text-[#F2F2F3] text-xs focus:outline-none focus:ring-1 focus:ring-coral-500"
              />
            </div>

          </div>

          {/* Active Chips Banner */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2A2A2E]/80">
              <span className="text-[#A0A0A6] text-2xs font-bold uppercase tracking-wider mr-1">Active:</span>
              {activeFilters.map(filter => (
                <div
                  key={filter.key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-coral-500/10 border border-coral-500/20 text-coral-500 text-xs"
                >
                  <span className="font-semibold">{filter.label}:</span>
                  <span className="text-[#F2F2F3]">{filter.value}</span>
                  <button
                    onClick={() => removeFilterKey(filter.key)}
                    className="hover:text-rose-400 text-coral-500 transition-colors font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer ml-auto pl-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* Feedback Logs Table */}
        <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-800">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 md:px-6 md:py-4 flex gap-4 items-center w-full">
                  <Skeleton className="h-6 w-1/4 md:w-2/5" />
                  <Skeleton className="h-6 w-24 hidden md:block" />
                  <Skeleton className="h-6 w-24 hidden md:block" />
                  <Skeleton className="h-6 w-20 hidden md:block" />
                  <Skeleton className="h-6 w-24 ml-auto md:ml-0" />
                </div>
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="font-semibold text-[#F2F2F3] text-lg">No Results Found</h3>
              <p className="text-[#A0A0A6] text-sm mt-1 max-w-md">
                Try refining or clearing your filters to display workspace results.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop/Tablet Table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2A2E] text-[#A0A0A6] font-semibold bg-[#0E0E10]/40">
                      <th className="py-4 px-6">Content</th>
                      <th className="py-4 px-6">Channel</th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6 text-center">Sentiment</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {feedback.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-850/30 transition-colors text-[#F2F2F3]">
                        <td className="py-4 px-6 max-w-md">
                          <p className="line-clamp-2 text-[#F2F2F3] text-sm">{item.content}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${getChannelBadgeClass(item.channel)}`}>
                            {formatChannelName(item.channel)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">{item.customerLabel || 'Anonymous'}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${getSentimentBadgeClass(item.sentiment)}`}>
                            {item.sentiment || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {/* NOTE: Disabling this select for viewers is UX only. Server requireRole('ADMIN', 'ANALYST') enforces boundary. */}
                          <select
                            value={item.status}
                            disabled={isViewer}
                            onChange={(e) => handleStatusChange(item._id, e.target.value as any)}
                            className={`bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-coral-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors ${getStatusBadgeClass(item.status)}`}
                          >
                            <option value="NEW" className="bg-[#1C1C1F] text-coral-500">New</option>
                            <option value="REVIEWED" className="bg-[#1C1C1F] text-sky-400">Reviewed</option>
                            <option value="ACTIONED" className="bg-[#1C1C1F] text-emerald-400">Actioned</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#A0A0A6]">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="divide-y divide-slate-800 md:hidden">
                {feedback.map((item) => (
                  <div key={item._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${getChannelBadgeClass(item.channel)}`}>
                        {formatChannelName(item.channel)}
                      </span>
                      <span className="text-xs text-[#A0A0A6]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-[#F2F2F3] text-sm">{item.content}</p>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-[#A0A0A6]">Sentiment:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${getSentimentBadgeClass(item.sentiment)}`}>
                        {item.sentiment || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[#A0A0A6] pt-1">
                      <div>Customer: <span className="font-semibold text-[#F2F2F3]">{item.customerLabel}</span></div>
                      
                      {/* Mobile Status dropdown */}
                      <select
                        value={item.status}
                        disabled={isViewer}
                        onChange={(e) => handleStatusChange(item._id, e.target.value as any)}
                        className={`bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral-500 disabled:opacity-50 font-medium ${getStatusBadgeClass(item.status)}`}
                      >
                        <option value="NEW" className="bg-[#1C1C1F] text-coral-500">New</option>
                        <option value="REVIEWED" className="bg-[#1C1C1F] text-sky-400">Reviewed</option>
                        <option value="ACTIONED" className="bg-[#1C1C1F] text-emerald-400">Actioned</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-[#2A2A2E] px-6 py-4 flex items-center justify-between bg-[#0E0E10]/20">
                <div className="text-sm text-[#A0A0A6]">
                  Showing <span className="text-[#F2F2F3] font-medium">{feedback.length}</span> of{' '}
                  <span className="text-[#F2F2F3] font-medium">{totalItems}</span> feedback logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateFilter('page', Math.max(1, page - 1).toString())}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-[#2A2A2E] hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] rounded-lg text-sm transition-colors border border-slate-750 font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#A0A0A6] px-2">
                    Page <span className="text-[#F2F2F3] font-medium">{page}</span> of{' '}
                    <span className="text-[#F2F2F3] font-medium">{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={() => updateFilter('page', Math.min(totalPages, page + 1).toString())}
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1.5 bg-[#2A2A2E] hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] rounded-lg text-sm transition-colors border border-slate-750 font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
};
