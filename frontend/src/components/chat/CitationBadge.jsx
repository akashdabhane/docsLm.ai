'use client';

import React from 'react';
import { Bookmark, FileText } from 'lucide-react';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function CitationBadge({ citation }) {
  const { openCitation } = useNotebookStore();

  return (
    <button
      onClick={() => openCitation(citation)}
      className="inline-flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer mx-1 my-0.5"
      title={`Click to view page ${citation.page_number} in ${citation.filename}`}
    >
      <Bookmark className="h-3 w-3 text-blue-400" />
      <span>{citation.citation_id} {citation.filename} (Pg {citation.page_number})</span>
    </button>
  );
}
