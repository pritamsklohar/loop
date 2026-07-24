import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface SourceItem {
  feedbackId: string;
  snippet: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: SourceItem[];
}

export const Ask: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Collapsible sources state (maps message ID to boolean open/close)
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/ask/history');
        if (res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleSources = (msgId: string) => {
    setOpenSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const samplePrompts = [
    "What are customers saying about performance and speed?",
    "Why are users complaining about account billing?",
    "Show me feedback requesting dark mode support.",
    "Summarize App Store crash issues."
  ];

  const handleNewChat = async () => {
    try {
      await api.delete('/ask/history');
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    const aiMessageId = `ai-${Date.now()}`;

    try {
      const res = await api.post('/ask', { question: questionText });
      
      const aiMessage: Message = {
        id: aiMessageId,
        sender: 'ai',
        text: res.data.answer,
        sources: res.data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze request');
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "I'm sorry, but I encountered an error communicating with the OpenAI engine. Please make sure your OpenAI API Key is active and correct."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-4 text-[#F2F2F3]">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Ask LOOP</h1>
          <p className="text-[#A0A0A6] mt-1.5 text-sm">Grounded answers built only from your feedback data — with sources.</p>
        </div>
        <button
          onClick={handleNewChat}
          className="bg-[#1C1D29] border border-[#272836] hover:border-coral-500 text-sm font-medium px-4 py-2 rounded-lg text-[#F2F2F3] transition-colors flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>
        
        {/* Chat History */}
        <div className="flex-1 space-y-6 pr-2">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1C1D29] border border-[#272836] flex items-center justify-center text-[#A0A0A6] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-[#A0A0A6] text-sm animate-pulse">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-coral-600/20 border border-coral-500/30 flex items-center justify-center text-coral-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F3] tracking-tight">Ask LOOP Anything</h2>
                <p className="text-[#A0A0A6] text-sm mt-2 max-w-md">
                  Inquire about customer trends, feature requests, or friction points. The AI searches raw feedback using embeddings before answering.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full pt-4">
                {samplePrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(promptText)}
                    className="p-3 bg-[#1C1C1F] border border-[#2A2A2E] hover:border-coral-500 hover:bg-slate-850 text-left text-xs rounded-xl text-[#F2F2F3] hover:text-[#F2F2F3] transition-all cursor-pointer font-medium"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md ${msg.sender === 'user' ? 'bg-coral-500 text-[#F2F2F3] rounded-br-none' : 'bg-[#1C1C1F] border border-[#2A2A2E] text-[#F2F2F3] rounded-bl-none'}`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    
                    {/* Collapsible Sources list */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#2A2A2E]">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-coral-500 hover:text-indigo-300 font-semibold cursor-pointer focus:outline-none"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-3.5 w-3.5 transform transition-transform ${openSources[msg.id] ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          Citations ({msg.sources.length} sources parsed)
                        </button>
                        
                        {openSources[msg.id] && (
                          <div className="mt-2 space-y-2 animate-fade-in pl-1">
                            {msg.sources.map((src, sidx) => (
                              <div key={sidx} className="bg-[#0E0E10]/60 border border-slate-855 rounded-lg p-2.5 text-2xs text-[#A0A0A6] space-y-1">
                                <p className="italic">"...{src.snippet}..."</p>
                                <div className="flex justify-between items-center text-[#A0A0A6] pt-1">
                                  <span>Source ID: {src.feedbackId.substring(src.feedbackId.length - 8)}</span>
                                  <Link
                                    to={`/feedback?search=${src.feedbackId}`}
                                    className="text-coral-500 hover:text-coral-500 font-bold transition-all"
                                  >
                                    Inspect Log →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Typing/Loading indicator */}
          {loading && (
            <div className="flex items-center gap-3 bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-4 max-w-[200px]">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-coral-500 rounded-full animate-bounce"></span>
                <span className="h-2 w-2 bg-coral-500 rounded-full animate-bounce delay-75"></span>
                <span className="h-2 w-2 bg-coral-500 rounded-full animate-bounce delay-150"></span>
              </div>
              <span className="text-xs text-[#A0A0A6] font-medium">LOOP is reading...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-auto border-t border-[#2A2A2E] pt-4">
          {error && (
            <div className="p-3 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              id="ask-input"
              type="text"
              aria-label="Ask a question about user feedback"
              placeholder="Ask a question about user feedback..."
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#1C1C1F] border border-[#2A2A2E] focus:border-coral-500 rounded-xl text-sm placeholder-slate-500 focus:outline-none disabled:opacity-50 text-[#F2F2F3]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="py-3 px-5 bg-coral-600 hover:bg-coral-500 disabled:bg-[#2A2A2E] text-[#F2F2F3] text-sm font-semibold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              Ask
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>

    </div>
  );
};
