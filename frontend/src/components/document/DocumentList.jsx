'use client';

import React from 'react';
import { FileText, Loader2, CheckCircle2, AlertCircle, Trash2, Eye, FilePlus } from 'lucide-react';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function DocumentList({ onOpenUploadModal }) {
  const { documents, deleteDocument, setActiveDocumentView, activeDocumentView } = useNotebookStore();

  const getStatusBadge = (status, error) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            Indexing...
          </span>
        );
      case 'PROCESSED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Indexed
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-0.5 rounded-full" title={error}>
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Knowledge Base ({documents.length})
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Documents form the ground truth for AI chat & studio</p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          <FilePlus className="h-3.5 w-3.5" />
          Add Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <FileText className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">No documents added yet</p>
          <p className="text-xs text-slate-500 max-w-[220px] mt-1 mb-4">
            Upload PDF or Word files to index knowledge into this notebook workspace.
          </p>
          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
          {documents.map((doc) => {
            const isSelected = activeDocumentView?.id === doc.id;
            return (
              <div
                key={doc.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between group ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-blue-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[170px]" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(doc.status, doc.processing_error)}
                      {doc.page_count > 0 && (
                        <span className="text-[10px] text-slate-500">{doc.page_count} pg</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setActiveDocumentView(doc)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                    title="View Document"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete Document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
