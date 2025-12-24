'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, Sparkles, Menu, Plus, AlertCircle, X } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email || 'User';
  const emailLabel = user?.email || 'Signed out';

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

      const raw = await response.text();

      if (!response.ok) {
        // Try to parse error json; otherwise use raw text
        let errDetail = raw;
        try {
          const errorData = JSON.parse(raw);
          errDetail = errorData.detail || raw;
        } catch {
          /* ignore parse error */
        }
        throw new Error(errDetail || `HTTP error! status: ${response.status}`);
      }

      // Try JSON, otherwise treat as plain text response
      let data;
      let reply = '';
      try {
        data = JSON.parse(raw);
      } catch {
        reply = raw?.trim() || '';
      }

      if (data && typeof data === 'object') {
        reply =
          data.answer ||
          data.response ||
          data.content ||
          data.message ||
          data.choices?.[0]?.message?.content ||
          '';
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

      const raw = await response.text();

      if (!response.ok) {
        let errDetail = raw;
        try {
          const errorData = JSON.parse(raw);
          errDetail = errorData.detail || raw;
        } catch {
          /* ignore parse error */
        }
        throw new Error(errDetail || `HTTP error! status: ${response.status}`);
      }

      let data;
      let reply = '';
      try {
        data = JSON.parse(raw);
      } catch {
        reply = raw?.trim() || '';
      }

      if (data && typeof data === 'object') {
        reply =
          data.answer ||
          data.response ||
          data.content ||
          data.message ||
          data.choices?.[0]?.message?.content ||
          '';
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
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Topics
        </div>
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

      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{emailLabel}</p>
          </div>
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

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 lg:w-72 bg-gray-50 border-r border-gray-200 flex-col">
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 sm:w-72 bg-gray-50 border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
          <div className="flex items-center gap-3 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto bg-white">
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
                  className={`flex gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg'
                        : 'bg-transparent text-gray-800'
                    }`}
                  >
                    <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
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
        <div className="border-t border-gray-200 bg-white px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
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
                className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-32 overflow-y-auto"
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
