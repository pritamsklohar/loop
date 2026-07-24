import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface FailedRow {
  row: number;
  error: string;
  data: any;
}

interface UploadResult {
  imported: number;
  failed: number;
  errors: FailedRow[];
}

export const BulkUpload: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const isViewer = user?.role === 'VIEWER';

  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  const handleSimulate = async (channel: 'app_store' | 'support' | 'social') => {
    if (isViewer) return;
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setSimulationToast(null);
      const res = await api.post(`/feedback/simulate/${channel}`);
      setSimulationToast(res.data.message);
      setTimeout(() => setSimulationToast(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to simulate feedback channel');
    } finally {
      setLoading(false);
    }
  };

  // Generate CSV template for download
  const handleTemplateDownload = () => {
    const csvContent = 
      "content,channel,customer_label,created_at\n" +
      '"The database latency is extremely low. Love it!","app_store","Acme Corp","2026-07-01"\n' +
      '"Getting a 500 error when export button is clicked.","support_ticket","John Doe","2026-07-02"\n' +
      '"Product is fine but pricing is slightly high.","nps_survey","Beta LLC","2026-07-03"';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "loop_feedback_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isViewer) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await api.post('/feedback/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
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
          <span className="font-bold text-xl tracking-wider text-[#F2F2F3]">LOOP / Bulk Ingestion</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">CSV Bulk Ingestion</h1>
          <p className="text-[#A0A0A6] mt-2">Upload multiple feedback entries at once using our CSV format.</p>
        </div>

        {isViewer && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>You have read-only access (Viewer). You are not permitted to run bulk data ingestion.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Instructions and Template */}
          <div className="space-y-6">
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 h-fit space-y-6">
              <div>
                <h3 className="font-bold text-[#F2F2F3] text-lg">Instructions</h3>
                <p className="text-[#A0A0A6] text-xs mt-1">Make sure your file matches these specifications:</p>
              </div>
              
              <ul className="space-y-3 text-[#F2F2F3] text-xs list-disc pl-4">
                <li>Expected columns: <code className="text-coral-500 font-mono">content</code>, <code className="text-coral-500 font-mono">channel</code>, <code className="text-coral-500 font-mono">customer_label</code>, <code className="text-coral-500 font-mono">created_at</code></li>
                <li><code className="text-coral-500 font-mono">channel</code> values must be: <code className="text-[#F2F2F3]">support_ticket</code>, <code className="text-[#F2F2F3]">app_store</code>, <code className="text-[#F2F2F3]">nps_survey</code>, <code className="text-[#F2F2F3]">sales_call</code>, or <code className="text-[#F2F2F3]">community_post</code></li>
                <li>Other fields (like sentiment, themeIds, embedding) will automatically be initialized as null.</li>
              </ul>

              <button
                onClick={handleTemplateDownload}
                className="w-full py-2.5 px-4 bg-slate-850 hover:bg-[#39393F] text-coral-500 hover:text-indigo-350 font-semibold border border-slate-750 hover:border-slate-700 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sample CSV
              </button>
            </div>

            {/* Simulation Card */}
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 h-fit space-y-6">
              <div>
                <h3 className="font-bold text-[#F2F2F3] text-lg">Simulate Channels</h3>
                <p className="text-[#A0A0A6] text-xs mt-1">Mock live integration pipelines by pulling pre-written feedback logs.</p>
              </div>

              {simulationToast && (
                <div className="p-3 rounded-lg bg-coral-500/10 border border-coral-500/20 text-coral-500 text-xs font-medium animate-pulse text-center">
                  {simulationToast}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={loading || isViewer}
                  onClick={() => handleSimulate('app_store')}
                  className="w-full py-2.5 px-4 bg-slate-850 hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] border border-slate-750 hover:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pull App Store Reviews
                </button>
                <button
                  type="button"
                  disabled={loading || isViewer}
                  onClick={() => handleSimulate('support')}
                  className="w-full py-2.5 px-4 bg-slate-850 hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] border border-slate-750 hover:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sync Support Tickets
                </button>
                <button
                  type="button"
                  disabled={loading || isViewer}
                  onClick={() => handleSimulate('social')}
                  className="w-full py-2.5 px-4 bg-slate-850 hover:bg-[#39393F] text-[#F2F2F3] hover:text-[#F2F2F3] border border-slate-750 hover:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Social Mentions
                </button>
              </div>
            </div>
          </div>

          {/* Upload Drag and Drop Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-8 shadow-xl">
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#F2F2F3] mb-2">Upload CSV File</label>
                  
                  <div className="relative border-2 border-dashed border-[#2A2A2E] hover:border-coral-500/50 rounded-xl p-8 flex flex-col items-center justify-center transition-all bg-[#0E0E10]/20 group">
                    <input
                      type="file"
                      accept=".csv"
                      disabled={isViewer || loading}
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#A0A0A6] group-hover:text-coral-500 mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>

                    {file ? (
                      <div className="text-center">
                        <span className="text-coral-500 font-medium text-sm break-all">{file.name}</span>
                        <p className="text-[#A0A0A6] text-xs mt-1">{(file.size / 1024).toFixed(2)} KB • Click or drag to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[#F2F2F3] font-medium text-sm">Click to upload or drag & drop</span>
                        <p className="text-[#A0A0A6] text-xs mt-1">CSV files only up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || loading || isViewer}
                  className="w-full py-3 px-4 rounded-lg bg-coral-600 hover:bg-coral-500 text-[#F2F2F3] font-semibold shadow-lg hover:shadow-indigo-500/20 active:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Ingesting batch data...</span>
                    </div>
                  ) : (
                    'Ingest CSV Data'
                  )}
                </button>
              </form>
            </div>

            {/* Results display */}
            {result && (
              <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 shadow-xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#F2F2F3] text-lg">Ingestion Result</h3>
                  <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {result.imported} Imported
                    </span>
                    <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                      {result.failed} Failed
                    </span>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[#F2F2F3] font-semibold text-sm">Failed Rows Details</h4>
                    <div className="overflow-x-auto max-h-64 border border-[#2A2A2E] rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#2A2A2E] bg-[#0E0E10] text-[#A0A0A6] font-semibold">
                            <th className="py-2.5 px-4 w-16">Row</th>
                            <th className="py-2.5 px-4 w-48">Validation Error</th>
                            <th className="py-2.5 px-4">Raw Content Sample</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {result.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-slate-850/20 text-[#F2F2F3]">
                              <td className="py-2.5 px-4 font-semibold text-coral-500">{err.row}</td>
                              <td className="py-2.5 px-4 text-rose-400">{err.error}</td>
                              <td className="py-2.5 px-4 truncate max-w-xs">{err.data?.content || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
