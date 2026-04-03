"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FileText, Trash2, Clock, Loader2, FileCheck } from "lucide-react";

interface Document {
  id: string;
  name: string;
  size: number;
  createdAt: string;
}

interface DocumentListProps {
  workspaceId: string;
  refreshTrigger: number;
}

export default function DocumentList({ workspaceId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!workspaceId || !user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [workspaceId, refreshTrigger]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d} ${h}:${min}`;
    } catch (e) {
      return dateStr;
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeletingId(documentId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/documents?documentId=${documentId}&workspaceId=${workspaceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Failed to delete document");
      
      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error: any) {
      console.error("Error deleting document:", error);
      alert("Error: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-brand-muted">
        <Loader2 className="w-5 h-5 animate-spin mb-3 text-brand-gold" />
        <p className="text-xs font-medium tracking-wide text-brand-muted/70 uppercase">Loading Data</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 border border-dashed border-brand-border rounded-[20px] flex flex-col items-center justify-center bg-brand-bg text-brand-muted text-center">
        <FileText size={24} className="mb-3 opacity-30" />
        <p className="text-[13px] font-medium text-brand-text mb-1">No documents yet</p>
        <p className="text-[11px] max-w-[180px]">Upload a source file above to analyze its contents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-brand-muted/70 uppercase tracking-widest px-1 mb-3 flex items-center gap-2">
        <FileCheck size={12} /> Stored Sources ({documents.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            className="group p-3 bg-brand-card border border-brand-border rounded-2xl hover:bg-brand-card/80 hover:border-brand-gold/30 hover:shadow-[0_0_12px_rgba(212,175,55,0.04)] transition-all duration-200 cursor-default"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0 border border-brand-border transition-colors">
                <FileText size={16} className="text-brand-gold" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-[13px] font-medium text-brand-text truncate mb-1">
                  {doc.name}
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-brand-muted">
                  <span className="flex items-center gap-1 font-mono tracking-tight">
                    {formatSize(doc.size)}
                  </span>
                  <span className="flex items-center gap-1 opacity-70">
                    <Clock size={10} />
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => handleDelete(doc.id, e)}
                disabled={deletingId === doc.id}
                className={`opacity-0 group-hover:opacity-100 p-2 transition-all rounded-xl ${deletingId === doc.id ? '!opacity-100 text-red-500' : 'text-brand-muted hover:text-red-400 hover:bg-red-500/10'}`}
              >
                {deletingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
