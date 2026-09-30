import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  structuredData?: any;
  suggestedActions?: string[];
  latencyMs?: number;
  timestamp: string;
}

export const NovaCopilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load capabilities once on mount
  useEffect(() => {
    let isMounted = true;
    api.getAgentCapabilities()
      .then((data) => {
        if (isMounted) setCapabilities(data);
      })
      .catch((err) => {
        console.warn('Could not load agent capabilities:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### 🤖 APEX SpendGuard Nova AI Copilot
Hello! I am your real-time spend intelligence and budget enforcement agent, powered by **Aczen Nova's live financial books**.

I can evaluate pre-clearance spending proposals, audit live overruns, explain governance policies, and simulate year-end horizon stress tests.

What would you like to inspect or simulate?`,
          suggestedActions: [
            'Which department is spending most?',
            'Who are our top vendors?',
            'Can I spend $75,000 on Cloud Servers?',
            'Show Aczen Nova live book overruns',
            'What is our Engineering budget headroom?',
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.chatWithAgent({
        message: text,
        conversationHistory: history,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        intent: res.intent,
        structuredData: res.structuredData,
        suggestedActions: res.suggestedActions,
        latencyMs: res.latencyMs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setErrorMsg(err.message || 'Failed to reach Nova AI Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-semibold text-slate-900 text-sm mt-1 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.replace(/^[\*\-]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 leading-relaxed text-xs">
            {formatBold(itemText)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-slate-700 text-xs leading-relaxed">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-white shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all duration-200 border border-slate-700/60 group hover:scale-[1.02] cursor-pointer"
          aria-label="Open Aczen Nova AI Copilot"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-amber-400 group-hover:rotate-12 transition-transform" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
              Nova AI Copilot
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Aczen
              </span>
            </span>
            <span className="text-[10px] text-slate-300 font-normal">
              SpendGuard & Ledger Intel
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[95vw] md:w-[480px] h-[640px] max-h-[90vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                <span className="material-symbols-outlined text-lg" data-icon="smart_toy">
                  smart_toy
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">
                    APEX SpendGuard Nova AI
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    Aczen
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>
                    {capabilities?.liveNovaConnected
                      ? 'Live Books Connected (372 Envelopes)'
                      : 'Aczen Nova API Ready'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isMinimized ? 'unfold_more' : 'minimize'}
                </span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-mono font-medium text-slate-400">
                          {isUser ? 'You' : 'Nova Copilot'}
                        </span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[9px] font-mono text-slate-400">{m.timestamp}</span>
                        {m.latencyMs && (
                          <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                            {m.latencyMs}ms
                          </span>
                        )}
                        {m.intent && (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">
                            {m.intent}
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs max-w-[92%] leading-relaxed ${
                          isUser
                            ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs space-y-2'
                        }`}
                      >
                        {isUser ? (
                          <p>{m.content}</p>
                        ) : (
                          <div className="space-y-1.5">{renderFormattedContent(m.content)}</div>
                        )}

                        {/* Structured Data Badges if available */}
                        {m.structuredData && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                            {m.structuredData.decision && (
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-slate-400 text-[9px] block">DAG DECISION</span>
                                <span
                                  className={`font-bold ${
                                    m.structuredData.decision === 'CLEARED'
                                      ? 'text-emerald-600'
                                      : m.structuredData.decision === 'BLOCKED'
                                      ? 'text-rose-600'
                                      : 'text-amber-600'
                                  }`}
                                >
                                  {m.structuredData.decision}
                                </span>
                              </div>
                            )}
                            {m.structuredData.total_deficit && (
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-slate-400 text-[9px] block">LIVE DEFICIT</span>
                                <span className="font-bold text-rose-600">
                                  {m.structuredData.total_deficit}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Suggested Action Chips */}
                      {m.suggestedActions && m.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
                          {m.suggestedActions.map((action, aidx) => (
                            <button
                              key={aidx}
                              onClick={() => handleSend(action)}
                              className="text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs transition-colors cursor-pointer text-left flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[13px] text-amber-500">
                                bolt
                              </span>
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200/80 max-w-[200px] text-slate-500 shadow-2xs">
                    <span className="material-symbols-outlined text-amber-500 animate-spin text-base" data-icon="refresh">
                      refresh
                    </span>
                    <span className="text-xs font-mono">Querying Aczen Nova...</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-base shrink-0">
                      warning
                    </span>
                    <div>
                      <span className="font-semibold block">Nova Execution Error:</span>
                      <span>{errorMsg}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200/80 flex flex-col gap-2 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Nova (e.g. 'Can I spend $50k on GCP?')..."
                    disabled={isLoading}
                    className="flex-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                    title="Send message"
                  >
                    <span className="material-symbols-outlined text-base" data-icon="send">
                      send
                    </span>
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                  <span>Engine: Aczen Nova API</span>
                  <span>Zero-Trust Pre-Clearance</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
