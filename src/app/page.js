'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, Sparkles, Menu, Plus, AlertCircle, X, LogOut, ChevronDown } from 'lucide-react';

// Utility function to format response text
const formatResponseText = (text) => {
  if (!text) return '';

  // Step 1: Add spaces between concatenated words
  // This regex finds lowercase letter followed by uppercase letter and adds space
  let formatted = text.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Step 2: Fix common concatenations
  formatted = formatted.replace(/([a-z])(\d)/g, '$1 $2'); // letter followed by number
  formatted = formatted.replace(/(\d)([a-z])/gi, '$1 $2'); // number followed by letter

  // Step 3: Format numbered lists - ensure they start on new lines
  formatted = formatted.replace(/(\d+)\.\s*/g, '\n\n$1. ');

  // Step 4: Clean up multiple consecutive spaces
  formatted = formatted.replace(/ {2,}/g, ' ');

  // Step 5: Clean up excessive line breaks (max 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Step 6: Ensure proper spacing after periods
  formatted = formatted.replace(/\.([A-Z])/g, '. $1');

  // Step 7: Remove spaces before punctuation
  formatted = formatted.replace(/\s+([.,;:!?])/g, '$1');

  // Step 8: Trim leading/trailing whitespace
  formatted = formatted.trim();

  return formatted;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add placeholder assistant message (non-streaming)
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

    const RAG_API_URL =
      process.env.NEXT_PUBLIC_RAG_API_URL;

    try {
      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          namespace: 'default',
          top_k: 5
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errDetail = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errDetail = errorData.detail || errorText;
        } catch {
          /* ignore parse error */
        }
        throw new Error(errDetail || `HTTP error! status: ${response.status}`);
      }

      // Check if response supports streaming
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to non-streaming
        const raw = await response.text();
        let data, reply = '';
        try {
          data = JSON.parse(raw);
          reply = data.answer || data.response || data.content || data.message || '';
        } catch {
          reply = raw?.trim() || '';
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = reply || 'No response received.';
            lastMessage.sources = (data && data.sources) || [];
          }
          return newMessages;
        });
        return;
      }

      // Streaming implementation
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Try to parse as JSON (for structured streaming)
        try {
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            // Handle SSE format
            const cleanLine = line.replace(/^data:\s*/, '').trim();
            if (!cleanLine || cleanLine === '[DONE]') continue;

            try {
              const parsed = JSON.parse(cleanLine);
              const text = parsed.answer || parsed.response || parsed.content || parsed.message || parsed.delta || '';

              if (text) {
                accumulatedText += text;
              }

              if (parsed.sources) {
                sources = parsed.sources;
              }
            } catch {
              // Not JSON, treat as plain text
              accumulatedText += cleanLine;
            }
          }
        } catch {
          // Plain text streaming
          accumulatedText += chunk;
        }

        // Update message with accumulated text
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedText;
            lastMessage.sources = sources;
          }
          return newMessages;
        });
      }

      // Final update to ensure everything is set
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = accumulatedText || 'No response received.';
          lastMessage.sources = sources;
        }
        return newMessages;
      });

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

  const recentTopics = [
    { title: "Binary Trees", icon: "📊", question: "Explain Binary Trees with examples" },
    { title: "Network Protocols", icon: "🌐", question: "What are Network Protocols? Explain with examples" },
    { title: "Sorting Algorithms", icon: "⚡", question: "Explain Sorting Algorithms with examples" }
  ];

  const handleTopicClick = async (topic) => {
    setSidebarOpen(false);
    if (!topic.question || isLoading) return;

    const userMessage = topic.question;
    setInput('');
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add placeholder assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

    try {
      const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL;
      const RAG_NAMESPACE = process.env.NEXT_PUBLIC_RAG_NAMESPACE || 'default';

      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          namespace: RAG_NAMESPACE,
          top_k: 5
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errDetail = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errDetail = errorData.detail || errorText;
        } catch {
          /* ignore parse error */
        }
        throw new Error(errDetail || `HTTP error! status: ${response.status}`);
      }

      // Check if response supports streaming
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to non-streaming
        const raw = await response.text();
        let data, reply = '';
        try {
          data = JSON.parse(raw);
          reply = data.answer || data.response || data.content || data.message || '';
        } catch {
          reply = raw?.trim() || '';
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = reply || 'No response received.';
            lastMessage.sources = (data && data.sources) || [];
          }
          return newMessages;
        });
        return;
      }

      // Streaming implementation
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Try to parse as JSON (for structured streaming)
        try {
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            // Handle SSE format
            const cleanLine = line.replace(/^data:\s*/, '').trim();
            if (!cleanLine || cleanLine === '[DONE]') continue;

            try {
              const parsed = JSON.parse(cleanLine);
              const text = parsed.answer || parsed.response || parsed.content || parsed.message || parsed.delta || '';

              if (text) {
                accumulatedText += text;
              }

              if (parsed.sources) {
                sources = parsed.sources;
              }
            } catch {
              // Not JSON, treat as plain text
              accumulatedText += cleanLine;
            }
          }
        } catch {
          // Plain text streaming
          accumulatedText += chunk;
        }

        // Update message with accumulated text
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedText;
            lastMessage.sources = sources;
          }
          return newMessages;
        });
      }

      // Final update to ensure everything is set
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = accumulatedText || 'No response received.';
          lastMessage.sources = sources;
        }
        return newMessages;
      });

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

  const SidebarContent = () => (
    <>
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <button
          onClick={() => {
            setMessages([]);
            setError(null);
            setSidebarOpen(false);
          }}
          className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
          <span className="font-medium text-gray-700">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
        <button
          onClick={() => setTopicsOpen(!topicsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="uppercase tracking-wider">Recent Topics</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${topicsOpen ? 'rotate-180' : ''}`} />
        </button>

        {topicsOpen && (
          <div className="space-y-1 mt-1">
            {recentTopics.map((item, i) => (
              <button
                key={i}
                onClick={() => handleTopicClick(item)}
                disabled={isLoading}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
              >
                <span className="text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                <span className="text-sm text-gray-700 truncate">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{emailLabel}</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-lg transition-all shadow-sm hover:shadow-md"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
              Logout Confirmation
            </h2>
            <p className="text-gray-600 text-center mb-6 sm:mb-8">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 lg:w-72 bg-gray-50 border-r border-gray-200 flex-col">
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={`fixed inset-y-0 left-0 w-64 sm:w-72 bg-gray-50 border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">DSA & Networking AI</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="hidden sm:inline-block px-2 sm:px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full whitespace-nowrap">
              RAG-Powered
            </span>
            <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 border border-gray-200 rounded-full bg-white">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-gray-900 truncate max-w-[160px]">{displayName}</span>
                <span className="text-[11px] text-gray-500 truncate max-w-[160px]">{emailLabel}</span>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-lg transition-all shadow-md hover:shadow-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span className="hidden sm:inline text-sm font-semibold text-white">Logout</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-3 sm:px-4 lg:px-6 py-3 flex-shrink-0">
            <div className="flex items-start sm:items-center gap-2 text-red-800 max-w-3xl mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm flex-1 break-words">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-xl font-bold flex-shrink-0 -mt-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-white pb-24 sm:pb-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-8 max-w-3xl mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">DSA & Networking Assistant</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center px-4">Ask anything about DSA or Networking</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user'
                      ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg'
                      : 'bg-transparent text-gray-800'
                      }`}
                  >
                    <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                      {message.role === 'assistant' ? formatResponseText(message.content) : message.content}
                      {message.role === 'assistant' && !message.content && isLoading && (
                        <span className="inline-flex gap-1 ml-1">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      )}
                      {message.role === 'assistant' && message.content && isLoading && (
                        <span className="inline-block w-1 h-4 bg-gray-600 animate-pulse ml-0.5"></span>
                      )}
                    </p>

                    {/* Show sources if available */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {source.namespace}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0 fixed sm:relative bottom-0 left-0 right-0 z-30">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative bg-white border border-gray-300 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:border-gray-400 focus-within:shadow-md">
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
                className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 w-8 h-8 sm:w-9 sm:h-9 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all shadow-sm disabled:shadow-none"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3 px-2">
              AI can make mistakes. Please verify important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
