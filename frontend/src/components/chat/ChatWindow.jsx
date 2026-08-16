'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquarePlus, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNotebookStore } from '@/stores/useNotebookStore';
import { streamChatResponse } from '@/lib/sse';
import CitationBadge from './CitationBadge';

export default function ChatWindow({ notebookId }) {
  const {
    messages,
    loadingMessages,
    activeConversationId,
    conversations,
    fetchConversations,
    fetchMessages,
    openCitation
  } = useNotebookStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingCitations, setStreamingCitations] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;

    const userText = inputPrompt;
    setInputPrompt('');

    // Temporary optimistic user message
    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingCitations([]);

    await streamChatResponse({
      notebookId,
      content: userText,
      conversationId: activeConversationId,
      onToken: (token) => {
        setStreamingMessage((prev) => prev + token);
      },
      onCitations: (citations) => {
        setStreamingCitations(citations);
      },
      onComplete: ({ metadata }) => {
        setIsStreaming(false);
        setStreamingMessage('');
        setStreamingCitations([]);
        if (metadata?.conversation_id) {
          fetchMessages(metadata.conversation_id);
          fetchConversations(notebookId);
        } else if (activeConversationId) {
          fetchMessages(activeConversationId);
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error('Chat error:', err);
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4 text-blue-400">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Grounded Document Knowledge Chat</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Ask questions about your uploaded documents. Answers are strictly grounded in your files with page citations.
            </p>

            <div className="grid grid-cols-2 gap-2 max-w-md mt-6 text-left">
              {[
                "Summarize the key findings of the uploaded papers",
                "What methodology is described in document section 2?",
                "Compare the approaches in document A and B",
                "What are the main conclusions?"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInputPrompt(suggestion)}
                  className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition hover:border-slate-700"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>

                  {/* Citations List */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mr-1">
                        Sources:
                      </span>
                      {msg.citations.map((c, idx) => (
                        <CitationBadge key={idx} citation={c} />
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Message Token Box */}
            {isStreaming && (
              <div className="flex gap-3 text-xs leading-relaxed justify-start">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="max-w-2xl p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingMessage || 'Thinking...'}</ReactMarkdown>
                  
                  {streamingCitations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mr-1">
                        Sources:
                      </span>
                      {streamingCitations.map((c, idx) => (
                        <CitationBadge key={idx} citation={c} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isStreaming}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-md shrink-0"
        >
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
