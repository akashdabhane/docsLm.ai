'use client';

import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function UploadModal({ notebookId, isOpen, onClose }) {
  const { uploadDocument } = useNotebookStore();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      await uploadDocument(notebookId, selectedFile);
      setUploading(false);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-400" />
          Add Document to Notebook
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Upload PDF, Word (DOCX), TXT, or Markdown files. Content will be indexed for document RAG and AI Studio tools.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              selectedFile
                ? 'border-blue-500/60 bg-blue-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
            }`}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-blue-400 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-white truncate max-w-[260px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-9 w-9 text-slate-500 mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Click to browse or drop file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOCX, TXT, MD (Max 25MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg transition flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading & Queueing...
                </>
              ) : (
                'Upload & Index'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
