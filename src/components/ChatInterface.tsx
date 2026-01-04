'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { sendChatMessage, ChatResponse } from '../lib/chat';

/**
 * Message types for the chat interface
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tool_calls?: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    result?: Record<string, unknown>;
  }>;
}

/**
 * ChatInterface Component
 *
 * A beautiful, animated chat interface for the AI-powered task manager.
 * Features:
 * - Smooth animations for messages
 * - Typing indicator
 * - Tool call display
 * - Auto-scroll to latest message
 * - Responsive design
 */
export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    // Add user message to UI
    const tempUserId = `temp-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: tempUserId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Send to API
      const response: ChatResponse = await sendChatMessage(userMessage, conversationId || undefined);

      // Update conversation ID if this is the first message
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }



      // Replace temp user message with real one and add assistant response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserId);
        const assistantMessage: ChatMessage = {
          id: response.conversation_id,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          tool_calls: response.tool_calls,
        };
        
        return [...withoutTemp, newUserMessage, assistantMessage];
      });

      // Trigger INSTANT dashboard refresh for any task operation
      if (response.tool_calls && response.tool_calls.length > 0) {
        const taskTools = ['add_task', 'create_task', 'update_task', 'delete_task', 'complete_task'];
        const hasTaskOperation = response.tool_calls.some(tc => taskTools.includes(tc.tool));
        
        if (hasTaskOperation) {
          // Dispatch custom event to refresh dashboard IMMEDIATELY
          window.dispatchEvent(new CustomEvent('task-created', { detail: { refresh: true } }));
          
          // Also trigger after 500ms to ensure it catches
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('task-created', { detail: { refresh: true } }));
          }, 500);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Remove the temp user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserId));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle key press (Enter to send)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Format tool call for display
   */
  const formatToolCall = (toolCall: { tool: string; arguments: Record<string, unknown> }) => {
    const args = JSON.stringify(toolCall.arguments, null, 2);
    return `${toolCall.tool}(${args})`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-b from-green-50/50 to-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center gap-3 shadow-lg"
      >
        <div className="p-2 bg-white/20 rounded-full">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">AI Task Assistant</h2>
          <p className="text-green-100 text-sm">Ask me to manage your tasks</p>
        </div>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-4"
          >
            <div className="p-4 bg-green-100 rounded-full">
              <Bot className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Welcome to your AI Task Assistant!</h3>
              <p className="text-gray-500 max-w-md">
                I can help you create, list, update, and complete tasks using natural language.
                Try saying something like "Add buy milk to my list" or "Show my pending tasks"!
              </p>
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {/* Role indicator */}
                <div className={`flex items-center gap-2 mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-green-200" />
                  ) : (
                    <Bot className="w-4 h-4 text-green-600" />
                  )}
                  <span className={`text-xs font-medium ${message.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>

                {/* Message content */}
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {/* Tool calls display */}
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Tools used:</p>
                    <div className="space-y-1">
                      {message.tool_calls.map((tc, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-gray-50 rounded px-2 py-1 font-mono text-gray-600"
                        >
                          {formatToolCall(tc)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-green-200' : 'text-gray-300'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                <span className="text-gray-500 text-sm">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to manage your tasks..."
              disabled={isLoading}
              className="w-full px-5 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {inputValue.length > 0 && (
                <span className="text-xs">{inputValue.length}</span>
              )}
            </div>
          </div>
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-full shadow-lg transition-all ${
              !inputValue.trim() || isLoading
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl'
            }`}
          >
            <Send className={`w-5 h-5 ${!inputValue.trim() || isLoading ? 'text-gray-400' : 'text-white'}`} />
          </motion.button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {['Add buy milk', 'Show my tasks', 'Mark task as complete'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
