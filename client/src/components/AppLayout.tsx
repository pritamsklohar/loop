import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaceName, setWorkspaceName] = useState<string>('LOOP Workspace');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  
  // Dropdown States
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  
  // Modal State
  const [addFeedbackOpen, setAddFeedbackOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'manual' | 'csv' | 'simulate'>('manual');
  
  // Manual Ingestion Form
  const [manualContent, setManualContent] = useState<string>('');
  const [manualChannel, setManualChannel] = useState<string>('app_store');
  const [manualCustomer, setManualCustomer] = useState<string>('');
  const [manualRef, setManualRef] = useState<string>('');
  const [submittingManual, setSubmittingManual] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // CSV Import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  // Simulation Ingestion
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await api.get('/workspace');
        setWorkspaceName(res.data.name);
      } catch (err) {
        console.error('Failed to load workspace name:', err);
      }
    };
    if (user?.workspaceId) {
      fetchWorkspace();
    }
  }, [user?.workspaceId]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+K search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) return;
    try {
      setSubmittingManual(true);
      setManualError(null);
      await api.post('/feedback', {
        content: manualContent,
        channel: manualChannel,
        customerLabel: manualCustomer || undefined,
        sourceRef: manualRef || undefined
      });
      setManualContent('');
      setManualCustomer('');
      setManualRef('');
      setAddFeedbackOpen(false);
      
      // Refresh the page data if we are on feedback view
      if (location.pathname === '/app/inbox') {
        window.location.reload();
      } else {
        navigate('/app/inbox');
      }
    } catch (err: any) {
      setManualError(err.response?.data?.error || 'Failed to submit feedback log.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      setUploadingCsv(true);
      setCsvError(null);
      setCsvSuccess(null);
      const res = await api.post('/feedback/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvSuccess(`Successfully ingested ${res.data.count} feedback items.`);
      setCsvFile(null);
      setTimeout(() => {
        setAddFeedbackOpen(false);
        setCsvSuccess(null);
        if (location.pathname === '/app/inbox') {
          window.location.reload();
        } else {
          navigate('/app/inbox');
        }
      }, 1500);
    } catch (err: any) {
      setCsvError(err.response?.data?.error || 'CSV parsing error. Check headings.');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleSimulate = async (channel: 'app_store' | 'support' | 'social') => {
    try {
      setSimulating(true);
      setSimSuccess(null);
      const res = await api.post(`/feedback/simulate/${channel}`);
      setSimSuccess(`Simulated feedback synced! Added ${res.data.count} logs.`);
      setTimeout(() => {
        setAddFeedbackOpen(false);
        setSimSuccess(null);
        if (location.pathname === '/app/inbox') {
          window.location.reload();
        } else {
          navigate('/app/inbox');
        }
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert('Failed to simulate channel logs');
    } finally {
      setSimulating(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen bg-[#0E0E10] text-[#F2F2F3] flex overflow-hidden">
      
      {/* Sidebar Layout */}
      <aside className={`bg-[#0E0E10] border-r border-[#2A2A2E] flex flex-col transition-all duration-300 z-40 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Workspace Brand / Header */}
        <div className="p-4 flex items-center gap-3 border-b border-[#2A2A2E]">
          <div className="w-8 h-8 rounded-lg bg-coral-500 flex items-center justify-center text-[#0E0E10] font-black shrink-0">
            L
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-[#F2F2F3] leading-tight">LOOP</span>
            </div>
          )}
        </div>

        {/* Compact Search Field */}
        {!collapsed && (
          <div className="px-4 pt-4 shrink-0">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A0A0A6] absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="global-search"
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full bg-[#1C1C1F] border rounded-lg pl-8 pr-10 py-2 text-xs text-[#F2F2F3] placeholder-[#A0A0A6] focus:outline-none transition-all ${searchFocused ? 'border-coral-500' : 'border-[#2A2A2E]'}`}
              />
              <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded bg-[#0E0E10] border border-[#2A2A2E] text-[#A0A0A6] font-mono text-[9px] select-none pointer-events-none">
                ⌘ K
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => setAddFeedbackOpen(true)}
            aria-label="Add feedback"
            className={`w-full py-2 bg-coral-500 hover:bg-coral-600 text-[#0E0E10] rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${collapsed ? 'px-0' : 'px-4'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {!collapsed && <span>Add feedback</span>}
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 flex flex-col">
          
          <Link
            to="/app"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/app/inbox"
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app/inbox')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
              </svg>
              {!collapsed && <span>Inbox</span>}
            </div>
            {!collapsed && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive('/app/inbox') ? 'bg-[#0E0E10]/20 text-[#0E0E10]' : 'bg-[#1C1C1F] text-[#F2F2F3]'}`}>138</span>
            )}
          </Link>

          <Link
            to="/app/trends"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app/trends')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {!collapsed && <span>Trends</span>}
          </Link>

          <Link
            to="/app/ask"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app/ask')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!collapsed && <span>Ask LOOP</span>}
          </Link>

          <Link
            to="/app/reports"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app/reports')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!collapsed && <span>Reports</span>}
          </Link>

          <Link
            to="/app/members"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer ${
              isActive('/app/members')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13.604 9.604a3.5 3.5 0 11-5.208 0" />
            </svg>
            {!collapsed && <span>Members</span>}
          </Link>

          <Link
            to="/app/settings"
            className={`flex items-center gap-3.5 px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer mt-auto ${
              isActive('/app/settings')
                ? 'bg-coral-500 text-[#0E0E10]'
                : 'text-[#A0A0A6] hover:bg-[#1C1C1F] hover:text-[#F2F2F3]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!collapsed && <span>Settings</span>}
          </Link>

        </nav>

        {/* Collapsible toggle bar */}
        <div className="p-3 border-t border-slate-800/60 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-350 hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4.5 w-4.5 transform transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

      </aside>

      {/* Primary Context Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        
        {/* Top Header Row */}
        <header className="h-14 border-b border-[#2A2A2E] px-6 flex items-center justify-between shrink-0 bg-[#0E0E10]">
          
          {/* Workspace Switcher */}
          <div ref={workspaceRef} className="relative z-30">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] text-[#F2F2F3] hover:border-coral-500 text-xs font-medium transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 rounded bg-coral-500/20 text-coral-500 text-[10px] font-black flex items-center justify-center">AP</span>
              <span>{workspaceName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#A0A0A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {workspaceDropdownOpen && (
              <div className="absolute top-10 left-0 w-52 bg-[#1C1C1F] border border-[#2A2A2E] rounded-lg p-1.5 shadow-xl animate-fade-in">
                <div className="text-[10px] font-extrabold text-[#A0A0A6] uppercase tracking-widest px-2.5 py-1.5">Workspace list</div>
                <button
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#2A2A2E] text-xs font-medium text-[#F2F2F3] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{workspaceName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Empty spacer so right icons align to right */}
          <div className="flex-1"></div>

          {/* Notifications / Avatar profile */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => alert("No new notifications")}
              aria-label="View notifications"
              className="text-[#A0A0A6] hover:text-[#F2F2F3] transition-colors cursor-pointer relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="w-1.5 h-1.5 rounded-full bg-coral-500 absolute top-0.5 right-0.5 border border-[#0E0E10]"></span>
            </button>

            {/* Avatar Dropdown */}
            <div ref={userRef} className="relative z-30">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User menu"
                className="w-8 h-8 rounded-full bg-[#1C1C1F] border border-[#2A2A2E] flex items-center justify-center text-[#F2F2F3] text-xs font-black hover:border-coral-500 transition-colors cursor-pointer select-none"
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </button>
              {userDropdownOpen && (
                <div className="absolute top-10 right-0 w-64 bg-[#1C1C1F] border border-[#2A2A2E] rounded-lg p-2.5 shadow-2xl animate-fade-in">
                  <div className="border-b border-[#2A2A2E] pb-2.5 mb-2 px-1">
                    <div className="font-bold text-xs text-[#F2F2F3]">{user?.name}</div>
                    <div className="text-[10px] text-[#A0A0A6] truncate mt-0.5">{user?.email}</div>
                    <div className="text-[9px] text-coral-500 bg-coral-500/10 px-1.5 py-0.5 rounded border border-coral-500/20 inline-block font-bold mt-2 uppercase tracking-wider">{user?.role}</div>
                  </div>
                  
                  <Link
                    to="/app/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-[#2A2A2E] text-xs font-medium text-[#F2F2F3] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A0A0A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile settings
                  </Link>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-rose-500/10 text-xs font-medium text-rose-400 transition-colors cursor-pointer flex items-center gap-2 mt-1 border-t border-[#2A2A2E] pt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Content Outlet Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
          <Outlet />
        </main>

      </div>

      {/* Global Ingestion Modal */}
      {addFeedbackOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2A2A2E] flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[#F2F2F3] text-lg tracking-tight">Add Customer Feedback</h3>
                <p className="text-[#A0A0A6] text-2xs mt-1">Log individual feedback, load batches of CSV reviews, or trigger mock channel integrations.</p>
              </div>
              <button
                onClick={() => setAddFeedbackOpen(false)}
                className="text-[#A0A0A6] hover:text-[#F2F2F3] rounded bg-[#2A2A2E]/40 p-1 hover:bg-[#2A2A2E] transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Ingestion Tabs */}
            <div className="flex border-b border-[#2A2A2E] bg-[#0E0E10]">
              <button
                onClick={() => setModalTab('manual')}
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'manual' ? 'border-coral-500 text-[#F2F2F3] bg-[#1C1C1F]' : 'border-transparent text-[#A0A0A6] hover:text-[#F2F2F3]'
                }`}
              >
                Manual Ingestion
              </button>
              <button
                onClick={() => setModalTab('csv')}
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'csv' ? 'border-coral-500 text-[#F2F2F3] bg-[#1C1C1F]' : 'border-transparent text-[#A0A0A6] hover:text-[#F2F2F3]'
                }`}
              >
                Import CSV File
              </button>
              <button
                onClick={() => setModalTab('simulate')}
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'simulate' ? 'border-coral-500 text-[#F2F2F3] bg-[#1C1C1F]' : 'border-transparent text-[#A0A0A6] hover:text-[#F2F2F3]'
                }`}
              >
                Simulate Channels
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              
              {/* TAB 1: MANUAL FORM */}
              {modalTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {manualError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded text-xs">
                      {manualError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[#A0A0A6] text-2xs font-bold uppercase tracking-wider mb-1">Feedback Content</label>
                    <textarea
                      required
                      rows={4}
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      placeholder="Paste customer review text, support conversations, or transcript log here..."
                      className="w-full bg-[#0E0E10] border border-[#2A2A2E] focus:border-coral-500 rounded-lg p-3 text-xs text-[#F2F2F3] placeholder-[#A0A0A6] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#A0A0A6] text-2xs font-bold uppercase tracking-wider mb-1">Channel Source</label>
                      <select
                        value={manualChannel}
                        onChange={(e) => setManualChannel(e.target.value)}
                        className="w-full bg-[#0E0E10] border border-[#2A2A2E] focus:border-coral-500 rounded-lg p-2.5 text-xs text-[#F2F2F3] focus:outline-none"
                      >
                        <option value="app_store">App Store Review</option>
                        <option value="support_ticket">Support Ticket</option>
                        <option value="nps_survey">NPS Survey</option>
                        <option value="sales_call">Sales Call Log</option>
                        <option value="community_post">Community Post</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#A0A0A6] text-2xs font-bold uppercase tracking-wider mb-1">Customer Label (Optional)</label>
                      <input
                        type="text"
                        value={manualCustomer}
                        onChange={(e) => setManualCustomer(e.target.value)}
                        placeholder="e.g. Pro User, Tech Lead"
                        className="w-full bg-[#0E0E10] border border-[#2A2A2E] focus:border-coral-500 rounded-lg p-2.5 text-xs text-[#F2F2F3] placeholder-[#A0A0A6] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#A0A0A6] text-2xs font-bold uppercase tracking-wider mb-1">Reference ID (Optional)</label>
                    <input
                      type="text"
                      value={manualRef}
                      onChange={(e) => setManualRef(e.target.value)}
                      placeholder="e.g. ticket-9051"
                      className="w-full bg-[#0E0E10] border border-[#2A2A2E] focus:border-coral-500 rounded-lg p-2.5 text-xs text-[#F2F2F3] placeholder-[#A0A0A6] focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-[#2A2A2E] pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setAddFeedbackOpen(false)}
                      className="py-2 px-4 rounded-lg bg-[#2A2A2E] hover:bg-[#39393F] text-[#A0A0A6] hover:text-[#F2F2F3] text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingManual || !manualContent.trim()}
                      className="py-2 px-5 bg-coral-500 hover:bg-coral-600 text-[#0E0E10] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      {submittingManual ? 'Processing classification...' : 'Ingest Feedback'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CSV BATCH UPLOAD */}
              {modalTab === 'csv' && (
                <form onSubmit={handleCsvUpload} className="space-y-4">
                  {csvError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded text-xs">
                      {csvError}
                    </div>
                  )}
                  {csvSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded text-xs">
                      {csvSuccess}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-[#2A2A2E] hover:border-coral-500 rounded-xl p-8 text-center bg-[#0E0E10] transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      required
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#A0A0A6] group-hover:text-coral-500 mx-auto mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="block text-xs text-[#A0A0A6] font-bold group-hover:text-[#F2F2F3]">
                      {csvFile ? csvFile.name : 'Select or drag customer feedback CSV file here'}
                    </span>
                    <span className="block text-[10px] text-[#A0A0A6] mt-1.5">
                      CSV must contain a 'content' column (channel, customerLabel are optional)
                    </span>
                  </div>

                  <div className="border-t border-[#2A2A2E] pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setCsvFile(null); setAddFeedbackOpen(false); }}
                      className="py-2 px-4 rounded-lg bg-[#2A2A2E] hover:bg-[#39393F] text-[#A0A0A6] hover:text-[#F2F2F3] text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingCsv || !csvFile}
                      className="py-2 px-5 bg-coral-500 hover:bg-coral-600 text-[#0E0E10] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      {uploadingCsv ? 'Ingesting Batch logs...' : 'Start CSV Ingestion'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: SIMULATE CHANNELS */}
              {modalTab === 'simulate' && (
                <div className="space-y-6">
                  <p className="text-[#A0A0A6] text-xs leading-relaxed">
                    Inject 10-20 pre-written simulated logs from feedback fixtures. This populates live records instantly:
                  </p>

                  {simSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded text-xs animate-fade-in">
                      {simSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSimulate('app_store')}
                      disabled={simulating}
                      className="p-4 bg-[#0E0E10] hover:bg-[#2A2A2E] border border-[#2A2A2E] rounded-xl transition-colors cursor-pointer text-center text-xs space-y-2 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-coral-500 mx-auto group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="block font-bold text-[#F2F2F3]">App Store</span>
                      <span className="block text-[10px] text-[#A0A0A6]">Sync app reviews</span>
                    </button>

                    <button
                      onClick={() => handleSimulate('support')}
                      disabled={simulating}
                      className="p-4 bg-[#0E0E10] hover:bg-[#2A2A2E] border border-[#2A2A2E] rounded-xl transition-colors cursor-pointer text-center text-xs space-y-2 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                      </svg>
                      <span className="block font-bold text-[#F2F2F3]">Support Tickets</span>
                      <span className="block text-[10px] text-[#A0A0A6]">Import Zendesk logs</span>
                    </button>

                    <button
                      onClick={() => handleSimulate('social')}
                      disabled={simulating}
                      className="p-4 bg-[#0E0E10] hover:bg-[#2A2A2E] border border-[#2A2A2E] rounded-xl transition-colors cursor-pointer text-center text-xs space-y-2 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400 mx-auto group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="block font-bold text-[#F2F2F3]">Social Mentions</span>
                      <span className="block text-[10px] text-[#A0A0A6]">Sync Twitter/X feed</span>
                    </button>
                  </div>

                  <div className="border-t border-[#2A2A2E] pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAddFeedbackOpen(false)}
                      className="py-2 px-4 rounded-lg bg-[#2A2A2E] hover:bg-[#39393F] text-[#A0A0A6] hover:text-[#F2F2F3] text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
