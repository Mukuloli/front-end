'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, Sparkles, Menu, Plus, AlertCircle, X, LogOut, ChevronDown, MessageSquare } from 'lucide-react';
import MarkdownMessage from '@/components/MarkdownMessage';

// Utility function to format response text
const formatResponseText = (text) => {
  if (!text) return '';
  let formatted = text;

  formatted = formatted.replace(/(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)/g, '$1.$2.$3.$4');
  formatted = formatted.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
  formatted = formatted.replace(/([^\n])(#{1,6}\s+)/g, '$1\n\n$2');
  formatted = formatted.replace(/([^\n])(\s*[-*]\s+)/g, '$1\n$2');
  formatted = formatted.replace(/([^\n])(\s*\d+\.\s+)/g, '$1\n$2');
  formatted = formatted.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');
  formatted = formatted.replace(/([^\n])(#{1,6})([^#\s])/g, '$1\n\n$2 $3');
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  formatted = formatted.replace(/([a-z])([.!?])([A-Z])/g, '$1$2 $3');
  formatted = formatted.replace(/([a-z])([,;])([a-z])/g, '$1$2 $3');

  const techGlue = ['search', 'engines', 'results', 'content', 'online', 'web', 'internet', 'include', 'using', 'based', 'often', 'popular'];
  techGlue.forEach(word => {
    const regex1 = new RegExp(`([a-z]{3,})(${word})`, 'gi');
    formatted = formatted.replace(regex1, '$1 $2');
    const regex2 = new RegExp(`(${word})([a-z]{3,})`, 'gi');
    formatted = formatted.replace(regex2, '$1 $2');
  });

  const commonConnectors = ['the', 'and', 'with', 'from', 'this', 'that'];
  commonConnectors.forEach(word => {
    const regex = new RegExp(`([a-z]{3,})(${word})([a-z]{3,})`, 'gi');
    formatted = formatted.replace(regex, '$1 $2 $3');
  });

  const specificSmashes = [
    [/WorldWide/g, 'World Wide'],
    [/basedon/g, 'based on'],
    [/ofinherent/g, 'of inherent'],
    [/thembased/g, 'them based']
  ];
  specificSmashes.forEach(([regex, replacement]) => {
    formatted = formatted.replace(regex, replacement);
  });

  formatted = formatted.replace(/\*/g, '');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/[ \t]{2,}/g, ' ');

  return formatted.trim();
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recentTopics, setRecentTopics] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = user?.displayName || user?.email || 'User';
  const emailLabel = user?.email || 'Signed out';

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  const updateRecentTopics = (question) => {
    if (!user) return;
    setRecentTopics(prev => {
      const filtered = prev.filter(t => t.question.toLowerCase() !== question.toLowerCase());
      const newTopic = { title: question, icon: "💬", question: question };
      const updated = [newTopic, ...filtered].slice(0, 10);
      return updated;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Simulate word-by-word streaming in the UI
  const simulateStreaming = (fullText) => {
    return new Promise((resolve) => {
      const formatted = formatResponseText(fullText);
      if (!formatted) {
        setMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') last.content = 'No response received.';
          return msgs;
        });
        resolve();
        return;
      }

      // Split into words keeping whitespace/newlines intact
      const words = formatted.match(/\S+|\s+/g) || [];
      let displayed = '';
      let i = 0;

      const tick = () => {
        // Add a few words per tick for a natural pace
        const batch = Math.min(3, words.length - i);
        for (let b = 0; b < batch; b++) {
          displayed += words[i];
          i++;
        }

        setMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') last.content = displayed;
          return msgs;
        });

        if (i < words.length) {
          setTimeout(tick, 25);
        } else {
          resolve();
        }
      };

      tick();
    });
  };

  const processQuestion = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '', sources: [] }
    ]);

    const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL;
    const RAG_NAMESPACE = process.env.NEXT_PUBLIC_RAG_NAMESPACE || 'default';

    try {
      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, namespace: RAG_NAMESPACE, top_k: 5 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errDetail = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errDetail = errorData.detail || errorText;
        } catch { /* ignore */ }
        throw new Error(errDetail || `HTTP error! status: ${response.status}`);
      }

      // Collect the full response first (works for both streaming & non-streaming APIs)
      const reader = response.body?.getReader();
      let fullResponse = '';

      if (!reader) {
        fullResponse = await response.text();
      } else {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          try {
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              const cleanLine = line.replace(/^data:\s*/, '').trim();
              if (!cleanLine || cleanLine === '[DONE]') continue;
              try {
                const parsed = JSON.parse(cleanLine);
                const text = parsed.answer || parsed.response || parsed.content || parsed.message || parsed.delta || '';
                if (text) fullResponse += text;
              } catch {
                fullResponse += cleanLine;
              }
            }
          } catch {
            fullResponse += chunk;
          }
        }
      }

      // Try parsing as JSON (for APIs that return a JSON object)
      try {
        const data = JSON.parse(fullResponse);
        fullResponse = data.answer || data.response || data.content || data.message || fullResponse;
      } catch { /* not JSON, use as-is */ }

      // Stream the response word-by-word in the UI
      await simulateStreaming(fullResponse);
      updateRecentTopics(userMessage);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, an error occurred. Please try again.';
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await processQuestion(userMessage);
  };

  const handleTopicClick = (topic) => {
    setSidebarOpen(false);
    if (!topic.question || isLoading) return;
    setInput(topic.question);
  };

  const SidebarContent = () => (
    <>
      {/* New Chat Button */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => { setMessages([]); setError(null); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)'
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Recent Topics */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => setTopicsOpen(!topicsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors sidebar-item"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="uppercase tracking-wider">Recent Topics</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${topicsOpen ? 'rotate-180' : ''}`} />
        </button>

        {topicsOpen && (
          <div className="space-y-0.5 mt-1">
            {recentTopics.map((item, i) => (
              <button
                key={i}
                onClick={() => handleTopicClick(item)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left sidebar-item"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emailLabel}</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
            title="Logout"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden modal-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="modal-card w-full max-w-md p-6 sm:p-8 animate-fade-in-up">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
              Logout Confirmation
            </h2>
            <p className="text-center mb-6 sm:mb-8" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1 px-4 py-3 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="btn-danger flex-1 px-4 py-3 font-semibold rounded-xl"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar — Desktop */}
      <div className="hidden md:flex w-64 lg:w-72 chat-sidebar flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Sidebar — Mobile */}
      <div
        className={`fixed inset-y-0 left-0 w-72 chat-sidebar mobile-sidebar flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg transition-colors sidebar-item"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="chat-header flex items-center justify-between px-4 lg:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg transition-colors sidebar-item flex-shrink-0"
            >
              <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                DSA & Networking AI
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium rounded-full"
              style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              RAG-Powered
            </span>
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full glass">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>{displayName}</span>
                <span className="text-[11px] truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{emailLabel}</span>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 btn-danger rounded-lg text-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Logout</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 lg:px-6 py-3 flex-shrink-0">
            <div className="error-banner flex items-start sm:items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm flex-1 break-words">{error}</p>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 -mt-1 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pb-24 sm:pb-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-8 max-w-3xl mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-xl"
                style={{ boxShadow: '0 12px 40px rgba(99, 102, 241, 0.3)' }}>
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3 text-center gradient-text">
                DSA & Networking Assistant
              </h2>
              <p className="text-sm sm:text-base text-center mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
                Ask me anything about Data Structures, Algorithms, or Computer Networking
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { q: 'Explain binary search trees', icon: '🌳' },
                  { q: 'How does TCP handshake work?', icon: '🤝' },
                  { q: 'What is dynamic programming?', icon: '⚡' },
                  { q: 'Explain OSI model layers', icon: '📡' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(item.q); }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl text-left text-sm transition-all duration-200 glass"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 lg:py-8 px-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 lg:gap-4 mb-6 lg:mb-8 animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user'
                    ? 'user-bubble px-5 py-3'
                    : 'ai-bubble'
                    }`}
                  >
                    <div className="text-base leading-relaxed break-words">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {message.role === 'assistant' && !message.content && isLoading && (
                        <span className="inline-flex gap-1.5 ml-1 py-1">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </span>
                      )}
                      {message.role === 'assistant' && message.content && isLoading && (
                        <span className="inline-block w-0.5 h-5 ml-0.5 mt-1 rounded-full animate-pulse"
                          style={{ background: 'var(--accent-start)' }} />
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="chat-input-area px-4 py-3 sm:py-4 flex-shrink-0 fixed sm:relative bottom-0 left-0 right-0 z-30">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="chat-input-box relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask anything about DSA or Networking..."
                rows={1}
                className="w-full px-5 py-3.5 pr-14 bg-transparent text-sm focus:outline-none resize-none max-h-32 overflow-y-auto"
                style={{ color: 'var(--text-primary)' }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="send-btn absolute right-3 bottom-3 w-9 h-9 flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-center mt-3 px-2" style={{ color: 'var(--text-muted)' }}>
              AI can make mistakes. Please verify important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
