"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UploadZone({ workspaceId, onUploadSuccess }: { workspaceId: string, onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(20); // Simulate initial progress

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);

    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      setProgress(80);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setProgress(100);
      onUploadSuccess();
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setUploading(false);
      setProgress(0);
    }
  }, [workspaceId, user, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"]
    },
    maxFiles: 1,
    disabled: uploading || !workspaceId
  });

  if (!workspaceId) {
    return (
      <div className="p-8 border border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center bg-brand-bg text-brand-muted">
        <UploadCloud size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Select a workspace to upload documents</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div 
        {...getRootProps()} 
        className={`p-6 border border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300
          ${isDragActive ? "border-brand-gold bg-brand-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]" : "border-brand-border bg-brand-bg hover:border-brand-gold/30 hover:bg-brand-card/50"}
          ${uploading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center w-full max-w-xs">
            <div className="w-10 h-10 border-[3px] border-brand-card border-t-brand-gold rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-brand-text text-sm font-medium mb-2 tracking-wide">Processing Document...</p>
            <div className="w-full bg-brand-card rounded-full h-1 overflow-hidden border border-brand-border">
              <div 
                className="bg-brand-gold h-1 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(212,175,55,0.8)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-4 text-brand-gold shadow-sm transition-transform duration-300 group-hover:scale-105">
              <UploadCloud size={24} />
            </div>
            <h3 className="text-[15px] font-medium text-brand-text mb-1 tracking-tight">
              Drag & Drop document
            </h3>
            <p className="text-[12px] text-brand-muted mb-4">Supports PDF or TXT up to 50MB</p>
            <div className="px-5 py-2 rounded-full bg-brand-card border border-brand-border text-xs font-medium text-brand-text hover:text-brand-gold hover:border-brand-gold/30 transition-all duration-200">
              Browse Files
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs shadow-sm">
          <XCircle size={14} />
          {error}
        </div>
      )}
      
      {progress === 100 && !error && (
        <div className="mt-4 p-3 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-2 text-green-400 text-xs shadow-sm">
          <CheckCircle2 size={14} />
          Document stored successfully!
        </div>
      )}
    </div>
  );
}
