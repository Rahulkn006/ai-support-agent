// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "@/context/AuthContext";
import { SendIcon, Bot, User, ShieldAlert, FileText, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  workspaceId: string;
  chatId: string;
  onChatSave?: () => void;
}

export default function ChatInterface({ workspaceId, chatId, onChatSave }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [supportMode, setSupportMode] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(t => setToken(t));
    }
  }, [user]);

  useEffect(() => {
    if (workspaceId) {
      setMessages([]);
      setSuggestions([]);
      fetchSuggestions();
    }
  }, [workspaceId]);

  useEffect(() => {
    const fetchConversationMessages = async () => {
      if (!chatId || !user) return;
      // If it's a new UUID (not from Firestore yet), don't fetch
      if (chatId.length > 30) {
        setMessages([]); // Clear chat state for new conversation
        return; 
      }
      
      try {
        const t = await user.getIdToken();
        const res = await fetch(`/api/conversations?workspaceId=${workspaceId}`, {
          headers: { "Authorization": `Bearer ${t}` }
        });
        if (res.ok) {
          const data = await res.json();
          const currentConv = data.conversations.find((c: any) => c.id === chatId);
          if (currentConv) {
            setMessages(currentConv.messages || []);
          }
        }
      } catch (e) {
        console.error("Failed to fetch conversation messages:", e);
      }
    };
    fetchConversationMessages();
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSuggestions = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/chat/suggestions?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
    }
  };

  const saveConversation = async (currentMessages: ChatMessage[]) => {
    if (!workspaceId || currentMessages.length < 2) return;
    try {
      const t = await user?.getIdToken();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${t}`
        },
        body: JSON.stringify({
          id: chatId,
          workspaceId,
          messages: currentMessages,
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (onChatSave) {
          onChatSave();
        }
      }
    } catch (e) {
      console.error("Failed to save conversation:", e);
    }
  };

  const handleExport = (type: 'md' | 'pdf') => {
    if (messages.length === 0) return;
    
    if (type === 'md') {
      const content = messages.map(m => `### ${m.role.toUpperCase()}\n${m.content}\n`).join("\n---\n\n");
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${workspaceId.slice(0, 5)}.md`;
      a.click();
    } else {
      // Basic PDF export using window.print()
      // We could use a library, but browser print is reliable for layouts
      window.print();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (overrideInput?: string) => {
    const trimmedInput = (overrideInput || input || "").trim();
    const wsId = workspaceId || "";
    if (!wsId || !trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError(null);

    try {
      setIsLoading(true);

      const apiMessages = newMessages
        .filter(m => m.content && m.content.trim() !== "")
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          workspaceId: wsId,
          supportMode: supportMode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      if (!response.body) throw new Error("No response body");

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        resultText += chunk;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: resultText } : m));
      }

      // Auto-save after completion
      await saveConversation([...newMessages, { id: assistantId, role: "assistant", content: resultText }]);

    } catch (err: any) {
      console.error("Chat error:", err);
      if (err.name !== 'AbortError') setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-brand-bg text-brand-muted h-full">
        <Bot size={48} className="mb-4 text-brand-border" />
        <h3 className="text-xl font-medium text-brand-text mb-2">Select a Workspace</h3>
        <p>Choose a workspace from the sidebar to start asking questions about its documents.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg overflow-hidden relative print:bg-white print:border-none print:h-auto print:overflow-visible">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-brand-bg/95 backdrop-blur-xl z-20 sticky top-0 print:hidden border-b border-brand-border">
        <h3 className="font-semibold text-brand-text flex items-center gap-2">
          <Bot size={18} className="text-brand-gold" />
          DocuMind AI <span className="text-xs font-normal text-brand-muted ml-2 tracking-wide font-mono">#{workspaceId.slice(0, 6)}</span>
        </h3>
        
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <div className="relative group">
               <button className="px-4 py-1.5 rounded-full text-xs font-medium bg-brand-card text-brand-muted border border-brand-border hover:text-brand-text transition-all duration-200">
                  Export
               </button>
               <div className="absolute right-0 top-full mt-2 w-32 bg-brand-card border border-brand-border rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto overflow-hidden">
                  <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors">MD File</button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors">Print / PDF</button>
               </div>
            </div>
          )}
          
          <button
            onClick={() => setSupportMode(!supportMode)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              supportMode ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]" : "bg-brand-card text-brand-muted border border-brand-border hover:text-brand-text"
            }`}
          >
            <ShieldAlert size={14} />
            {supportMode ? "Support Mode: ON" : "Support Mode"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar print:p-0 relative">
        <div className="w-full max-w-[750px] mx-auto pb-40 pt-8 flex flex-col min-h-full">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-16">
              <div className="w-16 h-16 bg-brand-card rounded-2xl flex items-center justify-center mb-6 border border-brand-border shadow-lg">
                <FileText size={28} className="text-brand-gold" />
              </div>
              <h2 className="text-2xl font-semibold text-brand-text mb-3 tracking-tight">Ask anything about your documents</h2>
              <p className="text-brand-muted text-[15px] max-w-md leading-relaxed mb-8">
                Our AI analyzes your uploaded PDFs and TXT files to provide precise answers isolated to your specific context.
              </p>
              
              {suggestions.length > 0 && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {suggestions.map((suggestion, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSend(suggestion)}
                      className="p-4 bg-brand-card/50 border border-brand-border rounded-2xl text-left text-sm text-brand-muted hover:bg-brand-card hover:border-brand-gold/30 hover:text-brand-text hover:shadow-lg transition-all group duration-200"
                    >
                      <span className="line-clamp-2 leading-relaxed">{suggestion}</span>
                      <div className="mt-3 text-[11px] text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity font-medium tracking-wide">Ask Assistant &rarr;</div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-5 mb-8 print:block print:border-b print:border-slate-200 print:pb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-card border border-brand-border print:hidden mt-0.5 shadow-sm">
                    <Bot size={16} className="text-brand-gold" />
                  </div>
                )}
                
                <div className={`print:max-w-none print:bg-transparent print:p-0 print:text-black ${
                  message.role === 'user'
                    ? "bg-brand-card border border-brand-border text-brand-text px-5 py-3.5 rounded-[20px] rounded-tr-[4px] shadow-sm max-w-[85%] sm:max-w-[75%]"
                    : "text-brand-text w-full max-w-[calc(100%-3rem)]"
                }`}>
                  {message.role === 'user' ? (
                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                      <span className="hidden print:inline font-bold">User: </span>
                      {message.content}
                    </p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-[15px] leading-loose prose-p:leading-loose prose-pre:bg-brand-card prose-pre:border prose-pre:border-brand-border prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-brand-gold prose-strong:text-brand-text print:prose-black">
                      <span className="hidden print:inline font-bold">DocuMind AI: </span>
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-xl overflow-hidden text-sm my-4"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-brand-card border border-brand-border px-1.5 py-0.5 rounded-md text-brand-gold font-mono text-[0.85em] print:bg-slate-100 print:text-black" {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user' || messages[messages.length - 1]?.content === '') && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-5 mb-8 print:hidden"
            >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-card border border-brand-border mt-0.5 shadow-sm">
                  <Bot size={16} className="text-brand-gold" />
                </div>
                <div className="flex items-center gap-3 pt-1.5 text-brand-muted">
                   <Loader2 size={16} className="animate-spin text-brand-gold" />
                   <span className="text-[15px] font-medium tracking-wide animate-pulse">AI is thinking...</span>
                </div>
            </motion.div>
          )}
          
          {error && (
             <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400/90 text-sm flex gap-3 items-center justify-center print:hidden mt-4 shadow-sm">
               <XCircle size={18} />
               {error}
             </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Sticky Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none print:hidden">
        {/* Soft background gradient for readability over scroll */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-bg via-brand-bg/90 to-transparent pointer-events-none" />
        
        <div className="relative w-full max-w-[750px] mx-auto px-4 pb-6 pointer-events-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }} 
            className="relative flex items-center"
          >
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything..."
              className="w-full bg-brand-card border border-brand-border rounded-[28px] pl-6 pr-14 py-4 text-[15px] text-brand-text placeholder-brand-muted/70 focus:outline-none focus:ring-1 focus:ring-brand-gold/30 focus:border-brand-gold/30 resize-none max-h-32 min-h-[56px] shadow-lg shadow-black/20 transition-shadow transition-colors leading-normal custom-scrollbar"
              rows={1}
              onKeyDown={onKeyDown}
            />
            <button
              type="submit"
              disabled={isLoading || !(input || "").trim()}
              className="absolute right-2 bottom-1.5 p-2.5 rounded-full bg-brand-bg/80 text-brand-muted border border-brand-border hover:bg-brand-gold hover:text-brand-bg hover:border-brand-gold transition-all duration-200 disabled:opacity-40 disabled:hover:bg-brand-bg/80 disabled:hover:text-brand-muted disabled:hover:border-brand-border"
            >
              <SendIcon size={16} className={input.trim() && !isLoading ? "translate-x-[1px] translate-y-[-1px]" : ""} />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[11px] text-brand-muted/60 tracking-wider">
              AI can make mistakes. Consider verifying document sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
