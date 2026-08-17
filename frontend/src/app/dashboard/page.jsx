'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderPlus,
  Search,
  BookOpen,
  FileText,
  Trash2,
  ArrowUpRight,
  Sparkles,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, fetchMe, loading: authLoading } = useAuthStore();
  const { notebooks, fetchNotebooks, createNotebook, deleteNotebook, loadingNotebooks, resetNotebookState } = useNotebookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    resetNotebookState();
    fetchMe();
    fetchNotebooks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const created = await createNotebook(newTitle, newDesc);
      setNewTitle('');
      setNewDesc('');
      setIsModalOpen(false);
      setCreating(false);
      router.push(`/notebook/${created.id}`);
    } catch (err) {
      setCreating(false);
    }
  };

  const filteredNotebooks = notebooks.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Notebook Workspaces
              <Sparkles className="h-5 w-5 text-blue-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select or create a workspace to manage documents, run RAG queries, and generate studio audio podcasts.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 md:w-64 transition"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              Create Notebook
            </button>
          </div>
        </div>

        {/* Notebooks Grid */}
        {loadingNotebooks ? (
          <div className="flex justify-center p-16">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
            <BookOpen className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Notebook Workspaces Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Create your first notebook to organize PDF and Word documents into an AI knowledge base.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Create New Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((nb) => (
              <div
                key={nb.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 relative"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:scale-105 transition">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotebook(nb.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Notebook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition truncate mb-1">
                    {nb.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {nb.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    {nb.document_count || 0} Documents
                  </span>

                  <Link
                    href={`/notebook/${nb.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                  >
                    Open Workspace <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Notebook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-400" />
              New Notebook Workspace
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Workspaces isolate document vectors and knowledge bases.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Workspace Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning Research"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of documents in this workspace..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || creating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
