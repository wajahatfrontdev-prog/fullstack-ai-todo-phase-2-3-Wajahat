'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Minimize2, Sparkles } from 'lucide-react';
import { sendChatMessage, ChatResponse } from '../lib/chat';
import { getSession } from '@/lib/auth';
import { usePathname } from 'next/navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Position based on current page
  const isDashboard = pathname === '/dashboard';
  const buttonPosition = isDashboard ? 'fixed bottom-6 right-6' : 'fixed top-[32rem] right-6';
  const windowPosition = isDashboard ? 'fixed bottom-6 right-6' : 'fixed top-[20rem] right-6';

  useEffect(() => {
    checkAuth();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      setIsAuthenticated(!!session?.user);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isAuthenticated) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(userMessage, conversationId || undefined);
      
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Check if any tasks were created and emit event to refresh dashboard
      if (response.tool_calls) {
        const taskCreated = response.tool_calls.some(call => 
          call.tool === 'add_task' && call.result?.success
        );
        if (taskCreated) {
          // Emit custom event to notify dashboard to refresh
          window.dispatchEvent(new CustomEvent('task-created'));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorMsg = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        console.log('Error details:', error.message);
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Backend server is not running. Please start the backend server first.';
        } else if (error.message.includes('authentication') || error.message.includes('401')) {
          errorMsg = 'Please logout and login again to refresh your session.';
        } else {
          errorMsg = `Error: ${error.message}`;
        }
      }
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`${buttonPosition} z-50 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all ${isOpen ? 'hidden' : 'block'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? 60 : 400 
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`${windowPosition} z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-lg`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <div className="flex flex-col h-80">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {!isAuthenticated ? (
                    <div className="text-center p-4">
                      <div className="mb-3">
                        <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      </div>
                      <div className="text-gray-600 text-sm mb-3">Please log in to use AI assistant</div>
                      <a href="/login" className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors">
                        Login
                      </a>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center p-4">
                      <div className="mb-3">
                        <Bot className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      </div>
                      <div className="text-gray-600 text-sm mb-2">AI Task Assistant</div>
                      <div className="text-xs text-gray-500">Try: "Add buy milk" or "Show my tasks"</div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                            message.role === 'user'
                              ? 'bg-green-500 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isAuthenticated && (
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}