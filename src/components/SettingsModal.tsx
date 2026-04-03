import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Settings as SettingsIcon, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { useTheme } from "@/context/ThemeContext";

interface SettingsModalProps {
  onClose: () => void;
  activeWorkspaceId?: string;
  onHistoryCleared?: () => void;
}

export default function SettingsModal({ onClose, activeWorkspaceId, onHistoryCleared }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'danger'>('profile');
  const [mounted, setMounted] = useState(false);
  
  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Danger Region State
  const [clearingHistory, setClearingHistory] = useState(false);
  const [dangerSuccess, setDangerSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await updateProfile(auth.currentUser, { displayName });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleClearHistory = async () => {
    if (!activeWorkspaceId || !user) return;
    const confirm = window.confirm("Are you exactly sure you want to delete all chat history in this workspace? This cannot be undone.");
    if (!confirm) return;

    setClearingHistory(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/conversations?workspaceId=${activeWorkspaceId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDangerSuccess(true);
        if (onHistoryCleared) onHistoryCleared();
        setTimeout(() => setDangerSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClearingHistory(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-brand-bg border border-brand-border rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] min-h-[400px]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-48 bg-brand-card/30 border-b md:border-b-0 md:border-r border-brand-border p-4 flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <h3 className="text-sm font-bold text-brand-text mb-1 md:mb-4 px-2 pt-1 md:pt-2 hidden md:block">Settings</h3>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${activeTab === 'profile' ? "bg-brand-card text-brand-gold border border-brand-border shadow-sm" : "text-brand-muted hover:text-brand-text hover:bg-brand-card/50"}`}
          >
            <User size={16} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${activeTab === 'preferences' ? "bg-brand-card text-brand-gold border border-brand-border shadow-sm" : "text-brand-muted hover:text-brand-text hover:bg-brand-card/50"}`}
          >
            <SettingsIcon size={16} /> Preferences
          </button>
          <button 
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${activeTab === 'danger' ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm" : "text-brand-muted hover:text-red-400 hover:bg-red-500/5"}`}
          >
            <AlertTriangle size={16} /> Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 relative overflow-y-auto custom-scrollbar">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-text bg-brand-card/80 hover:bg-brand-card rounded-full transition-colors border border-transparent hover:border-brand-border z-10">
            <X size={16} />
          </button>

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative z-0">
              <h2 className="text-xl font-semibold text-brand-text mb-6">User Profile</h2>
              
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="text" 
                    value={user?.email || ""} 
                    disabled 
                    className="w-full bg-brand-card/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name" 
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all"
                  />
                </div>
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile || displayName === user?.displayName}
                  className="mt-4 px-6 py-2.5 bg-brand-card border border-brand-border hover:border-brand-gold text-brand-text hover:text-brand-gold rounded-full text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
                
                {profileSuccess && (
                  <p className="text-xs text-brand-gold flex items-center gap-1 mt-2 animate-in fade-in"><CheckCircle2 size={14}/> Profile updated successfully.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative z-0">
              <h2 className="text-xl font-semibold text-brand-text mb-6">Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-brand-card rounded-xl border border-brand-border gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-brand-text">Application Theme</h4>
                    <p className="text-xs text-brand-muted mt-1">Switch between Dark and Light aesthetics.</p>
                  </div>
                  <div className="flex bg-brand-bg border border-brand-border rounded-lg p-1 shrink-0">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark' ? 'bg-brand-card text-brand-gold border border-brand-border shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light' ? 'bg-brand-card text-brand-gold border border-brand-border shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                    >
                      Light
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-brand-card rounded-xl border border-brand-border gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-brand-text">RAG Context Size</h4>
                    <p className="text-xs text-brand-muted mt-1">Document chunks injected into AI prompts.</p>
                  </div>
                  <select className="bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-gold shrink-0">
                    <option value="standard">Standard (Efficient)</option>
                    <option value="max">Maximum (Details)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative z-0">
              <h2 className="text-xl font-semibold text-red-500 flex items-center gap-2 mb-6">
                Danger Zone
              </h2>
              
              <div className="space-y-4">
                <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-2xl">
                  <h4 className="text-sm font-semibold text-brand-text mb-1">Clear Workspace Chat History</h4>
                  <p className="text-xs text-brand-muted mb-4 leading-relaxed max-w-md">
                    Permanently delete all conversation history within the <strong className="text-brand-text">current active workspace</strong>. This action cannot be undone and deletes data immediately from the cloud.
                  </p>
                  <button 
                    onClick={handleClearHistory}
                    disabled={clearingHistory || !activeWorkspaceId}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {clearingHistory ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />} 
                    Delete All History
                  </button>
                  {dangerSuccess && (
                     <p className="text-xs text-red-400 mt-3 animate-in fade-in text-center sm:text-left">History cleared successfully.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
