"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard, FileText, Settings as SettingsIcon, Plus, Folder, MessageSquare, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SettingsModal from "@/components/SettingsModal";

export default function Sidebar({ 
  workspaces, 
  activeWorkspace, 
  onSelectWorkspace, 
  onCreateWorkspace,
  onSelectConversation,
  onNewChat,
  refreshTrigger = 0,
  className = ""
}: any) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [newWsName, setNewWsName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!activeWorkspace || !user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/conversations?workspaceId=${activeWorkspace.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchConversations();
  }, [activeWorkspace, user, refreshTrigger]);

  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeletingChatId(conversationId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/conversations?id=${conversationId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        onNewChat(); // Reset chat view
      } else {
        const d = await res.json();
        alert("Failed to delete chat: " + d.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleCreate = () => {
    if (newWsName.trim()) {
      onCreateWorkspace(newWsName);
      setNewWsName("");
      setIsCreating(false);
    }
  };

  return (
    <div className={`flex flex-col bg-brand-bg/95 border-r border-brand-border backdrop-blur-xl ${className}`}>
      <div className="p-6 pb-2">
        <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border flex items-center justify-center text-brand-text">
            <LayoutDashboard size={18} />
          </div>
          DocuMind
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">Workspaces</span>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="text-brand-muted hover:text-brand-text transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {isCreating && (
          <div className="mb-4 px-2">
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Workspace name..."
              className="w-full bg-brand-card/50 border border-brand-border text-sm text-brand-text rounded-lg px-3 py-2 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all placeholder:text-brand-muted/50"
              autoFocus
            />
          </div>
        )}

        <ul className="space-y-1">
          {workspaces.map((ws: any) => (
            <li key={ws.id} className="space-y-1">
              <button
                onClick={() => onSelectWorkspace(ws)}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                  activeWorkspace?.id === ws.id 
                    ? "bg-brand-card border border-brand-gold/20 text-brand-text shadow-[0_0_15px_rgba(212,175,55,0.03)]" 
                    : "text-brand-muted hover:bg-brand-card/50 hover:text-brand-text border border-transparent"
                }`}
              >
                <Folder size={16} className={`transition-colors duration-200 ${activeWorkspace?.id === ws.id ? "text-brand-gold" : "text-brand-muted group-hover:text-brand-text"}`} />
                <span className="truncate">{ws.name}</span>
              </button>

              {activeWorkspace?.id === ws.id && (
                <div className="pl-6 space-y-1 mt-2 border-l border-brand-border/50 ml-4 pb-3">
                  <button 
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-brand-gold/80 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all"
                  >
                    <PlusCircle size={13} />
                    New Conversation
                  </button>
                  {conversations.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] text-brand-muted/70 uppercase font-semibold tracking-widest px-2 mb-1.5">History</p>
                      {conversations.map(conv => (
                        <div key={conv.id} className="group/conv flex items-center relative pr-1">
                          <button
                            onClick={() => onSelectConversation(conv.id)}
                            className="flex-1 flex items-center gap-2 px-2 py-1.5 text-[12px] text-brand-muted hover:text-brand-text hover:bg-brand-card/40 rounded-lg transition-all text-left truncate"
                          >
                            <MessageSquare size={13} className="shrink-0 opacity-70" />
                            <span className="truncate pr-4">{conv.title}</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            disabled={deletingChatId === conv.id}
                            className={`absolute right-1 opacity-0 group-hover/conv:opacity-100 p-1.5 rounded-md transition-all ${deletingChatId === conv.id ? '!opacity-100 text-red-500' : 'text-brand-muted hover:text-red-400 hover:bg-red-500/10'}`}
                            title="Delete Chat"
                          >
                            {deletingChatId === conv.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          {workspaces.length === 0 && !isCreating && (
             <li className="px-3 py-4 text-xs text-brand-muted/50 text-center border border-dashed border-brand-border rounded-xl">
                No workspaces yet
             </li>
          )}
        </ul>
      </div>

      <div className="p-4 border-t border-brand-border mt-auto bg-brand-bg z-10">
        <div className="group flex items-center gap-3 px-3 py-3 rounded-2xl bg-brand-card/50 border border-brand-border mb-3 transition-colors hover:bg-brand-card">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              className="w-9 h-9 rounded-full border border-brand-border object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-text font-semibold">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-brand-text truncate">{user?.displayName || "User"}</p>
            <p className="text-[11px] text-brand-muted truncate font-mono">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full mt-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-brand-muted hover:text-brand-text hover:bg-brand-card/80 border border-transparent rounded-xl transition-all duration-200"
          >
            <SettingsIcon size={14} />
            Settings
          </button>
          <button
            onClick={signOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-brand-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-xl transition-all duration-200"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          activeWorkspaceId={activeWorkspace?.id} 
          onHistoryCleared={() => onNewChat()}
        />
      )}
    </div>
  );
}
