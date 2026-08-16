'use client';

import React, { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import DocumentList from '@/components/document/DocumentList';
import UploadModal from '@/components/document/UploadModal';
import DocumentViewer from '@/components/document/DocumentViewer';
import ChatWindow from '@/components/chat/ChatWindow';
import MindMapViewer from '@/components/studio/MindMapViewer';
import PodcastPlayer from '@/components/studio/PodcastPlayer';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotebookStore } from '@/stores/useNotebookStore';
import {
  MessageSquare,
  Network,
  Headphones,
  FileText,
  Sparkles,
  Loader2,
  Plus
} from 'lucide-react';

export default function NotebookPage({ params }) {
  const resolvedParams = use(params);
  const notebookId = resolvedParams.id;

  const { fetchMe } = useAuthStore();
  const {
    currentNotebook,
    fetchNotebookDetails,
    documents,
    activeDocumentView,
    studioOutputs,
    generateMindMap,
    generatePodcast,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'mindmap' | 'podcast'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [generatingMindMap, setGeneratingMindMap] = useState(false);
  const [generatingPodcast, setGeneratingPodcast] = useState(false);

  useEffect(() => {
    fetchMe();
    if (notebookId) {
      fetchNotebookDetails(notebookId);
    }
  }, [notebookId]);

  const latestMindMap = studioOutputs.find((s) => s.type === 'MIND_MAP');
  const latestPodcast = studioOutputs.find((s) => s.type === 'PODCAST');

  const handleGenerateMindMap = async () => {
    setGeneratingMindMap(true);
    try {
      await generateMindMap(notebookId);
      setGeneratingMindMap(false);
    } catch (err) {
      setGeneratingMindMap(false);
    }
  };

  const handleGeneratePodcast = async () => {
    setGeneratingPodcast(true);
    try {
      await generatePodcast(notebookId, 'Host A (Technical Lead)', 'Host B (Curious Inquirer)');
      setGeneratingPodcast(false);
    } catch (err) {
      setGeneratingPodcast(false);
    }
  };

  return (
    <div className="h-screen bg-[#0b0f19] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Knowledge Base / Documents */}
        <aside className="w-80 border-r border-slate-800 p-4 shrink-0 hidden md:block">
          <DocumentList onOpenUploadModal={() => setIsUploadOpen(true)} />
        </aside>

        {/* Center Panel: Workspace Tabs & Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40 border-r border-slate-800/60 p-4 space-y-4 overflow-hidden">
          {/* Studio Navigation Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shrink-0">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                RAG Chat
              </button>

              <button
                onClick={() => setActiveTab('mindmap')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'mindmap'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                Studio Mind Map
              </button>

              <button
                onClick={() => setActiveTab('podcast')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'podcast'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Headphones className="h-3.5 w-3.5" />
                Audio Overview Podcast
              </button>
            </div>

            {/* Tab Action Buttons */}
            {activeTab === 'mindmap' && (
              <button
                onClick={handleGenerateMindMap}
                disabled={generatingMindMap}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                {generatingMindMap ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate Mind Map
              </button>
            )}

            {activeTab === 'podcast' && (
              <button
                onClick={handleGeneratePodcast}
                disabled={generatingPodcast}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                {generatingPodcast ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate Audio Overview
              </button>
            )}
          </div>

          {/* Active Tab View */}
          <div className="flex-1 min-h-0">
            {activeTab === 'chat' && <ChatWindow notebookId={notebookId} />}

            {activeTab === 'mindmap' && (
              <div className="h-full flex flex-col">
                <MindMapViewer mindMapData={latestMindMap?.output} />
              </div>
            )}

            {activeTab === 'podcast' && (
              <div className="h-full overflow-y-auto">
                {latestPodcast ? (
                  <PodcastPlayer studioOutput={latestPodcast} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    <Headphones className="h-10 w-10 text-purple-400 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Generate AI Audio Overview</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-5">
                      Creates an engaging two-speaker podcast conversation synthesizing key research ideas from your documents.
                    </p>
                    <button
                      onClick={handleGeneratePodcast}
                      disabled={generatingPodcast}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                    >
                      {generatingPodcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Podcast Audio
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Side-by-Side Document Viewer */}
        {activeDocumentView && (
          <aside className="w-96 shrink-0 h-full">
            <DocumentViewer />
          </aside>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        notebookId={notebookId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
