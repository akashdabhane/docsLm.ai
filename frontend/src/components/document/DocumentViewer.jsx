'use client';

import React from 'react';
import { X, FileText, Bookmark, ExternalLink } from 'lucide-react';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function DocumentViewer() {
  const { activeDocumentView, activeCitation, closeDocumentView } = useNotebookStore();

  if (!activeDocumentView) return null;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const fileUrl = activeDocumentView.storage_url
    ? `${API_BASE_URL}${activeDocumentView.storage_url}`
    : null;

  return (
    <div className="h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl relative">
      {/* Viewer Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center space-x-2 truncate">
          <FileText className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate max-w-[240px]">
            {activeDocumentView.filename}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Open Original File"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={closeDocumentView}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Citation Highlight Banner if navigated via Citation Click */}
      {activeCitation && (
        <div className="p-3 bg-blue-500/10 border-b border-blue-500/30 flex items-start space-x-2 text-xs">
          <Bookmark className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-300">
              Citation {activeCitation.citation_id}: {activeCitation.filename} (Page {activeCitation.page_number})
            </span>
            <p className="text-slate-300 text-[11px] mt-1 bg-slate-950/60 p-2 rounded border border-blue-500/20 italic">
              "{activeCitation.text_snippet}..."
            </p>
          </div>
        </div>
      )}

      {/* PDF / Document Renderer */}
      <div className="flex-1 bg-slate-950 p-4 overflow-y-auto flex flex-col items-center">
        {(activeDocumentView.file_type === 'pdf' || activeDocumentView.filename?.endsWith('.pdf')) && fileUrl ? (
          <iframe
            key={
              activeCitation
                ? `pdf-${activeDocumentView.id || 'doc'}-pg${activeCitation.page_number || 1}-cit${activeCitation.citation_id || ''}-${activeCitation.timestamp || ''}`
                : `pdf-${activeDocumentView.id || 'doc'}`
            }
            src={`${fileUrl}#page=${activeCitation?.page_number || 1}`}
            className="w-full h-full min-h-[500px] border-0 rounded-xl shadow-lg"
            title="Document Viewer"
          />
        ) : (
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300 text-xs shadow-md">
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2 mb-3">
              Document Preview: {activeDocumentView.filename}
            </h4>

            {activeCitation ? (
              <div className="space-y-3">
                <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl">
                  <span className="font-semibold text-amber-300 text-[11px] block mb-1">
                    Cited Section: Page {activeCitation.page_number} ({activeCitation.section || 'General'})
                  </span>
                  <p className="text-amber-100 font-mono text-[11px] leading-relaxed">
                    {activeCitation.text_snippet}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">
                Structured document contents indexed and vectorized for AI RAG search. Click citations in chat messages to jump directly to referenced sections.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
