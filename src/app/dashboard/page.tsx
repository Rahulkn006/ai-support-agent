"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import UploadZone from "@/components/UploadZone";
import ChatInterface from "@/components/ChatInterface";
import DocumentList from "@/components/DocumentList";
import { Loader2, FolderOpen, Menu, X, FileText } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatId, setChatId] = useState("");
  const [refreshDocs, setRefreshDocs] = useState(0);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [mobileView, setMobileView] = useState<'docs' | 'chat'>('chat');

  const fetchWorkspaces = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/workspaces", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
      if (data.workspaces?.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data.workspaces[0]);
        setChatId(uuidv4());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const handleCreateWorkspace = async (name: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaces([data.workspace, ...workspaces]);
        setActiveWorkspace(data.workspace);
        setChatId(uuidv4());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectWorkspace = (ws: any) => {
    setActiveWorkspace(ws);
    setChatId(uuidv4()); 
    setMobileMenuOpen(false);
    setMobileView('docs'); 
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-brand-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden" suppressHydrationWarning>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-brand-muted p-1 hover:text-brand-text transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
            DocuMind AI
          </h2>
        </div>
        
        {activeWorkspace && (
          <div className="flex bg-brand-card p-1 rounded-full border border-brand-border">
            <button 
              onClick={() => setMobileView('docs')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${mobileView === 'docs' ? "bg-brand-border text-brand-gold" : "text-brand-muted hover:text-brand-text"}`}
            >
              Docs
            </button>
            <button 
              onClick={() => setMobileView('chat')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${mobileView === 'chat' ? "bg-brand-border text-brand-gold" : "text-brand-muted hover:text-brand-text"}`}
            >
              Chat
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-[280px] h-full z-[70]"
            >
              <Sidebar 
                className="w-full h-full"
                workspaces={workspaces} 
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={handleSelectWorkspace}
                onCreateWorkspace={handleCreateWorkspace}
                onSelectConversation={(id: string) => {
                  setChatId(id);
                  setMobileMenuOpen(false);
                  setMobileView('chat');
                }}
                onNewChat={() => {
                  setChatId(uuidv4());
                  setMobileMenuOpen(false);
                  setMobileView('chat');
                }}
                refreshTrigger={refreshHistory}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <Sidebar 
        className="w-64 h-screen hidden md:flex"
        workspaces={workspaces} 
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onSelectConversation={(id: string) => setChatId(id)}
        onNewChat={() => setChatId(uuidv4())}
        refreshTrigger={refreshHistory}
      />

      {/* Main Content Area (Center Chat + Right Docs) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0 bg-brand-bg">
        {!activeWorkspace ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-brand-muted">
            <FolderOpen size={48} className="mb-4 opacity-50 text-brand-muted" />
            <h2 className="text-2xl font-semibold text-brand-text mb-2">No Workspace Selected</h2>
            <p className="max-w-md text-center">Create or select a workspace from the sidebar to start uploading documents and asking questions.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Center Chat Area */}
            <div className={`flex-1 h-full w-full ${mobileView === 'docs' ? 'hidden lg:flex' : 'flex'}`}>
              <ChatInterface 
                workspaceId={activeWorkspace.id} 
                chatId={chatId} 
                onChatSave={() => setRefreshHistory(prev => prev + 1)}
              />
            </div>

            {/* Right Document Panel */}
            <div className={`w-full lg:w-80 2xl:w-96 flex-col h-full overflow-hidden bg-brand-bg md:bg-brand-card/30 border-l border-brand-border ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex-shrink-0">
                  <h2 className="text-lg font-semibold text-brand-text mb-1 truncate">{activeWorkspace.name}</h2>
                  <p className="text-xs text-brand-muted mb-6 flex-shrink-0">Workspace Data Sources</p>
                  
                  <UploadZone 
                    workspaceId={activeWorkspace.id} 
                    onUploadSuccess={() => setRefreshDocs(prev => prev + 1)} 
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar h-full min-h-0 pt-4">
                  <DocumentList 
                    workspaceId={activeWorkspace.id} 
                    refreshTrigger={refreshDocs} 
                  />
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>

  );
}
