'use client';

import React, { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import DocumentList from '@/components/document/DocumentList';
import UploadModal from '@/components/document/UploadModal';
import DocumentViewer from '@/components/document/DocumentViewer';
import ChatWindow from '@/components/chat/ChatWindow';
import MindMapViewer from '@/components/studio/MindMapViewer';
import SlideDeckViewer from '@/components/studio/SlideDeckViewer';
import QuizViewer from '@/components/studio/QuizViewer';
import FlashcardViewer from '@/components/studio/FlashcardViewer';
import PodcastPlayer from '@/components/studio/PodcastPlayer';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotebookStore } from '@/stores/useNotebookStore';
import {
  MessageSquare,
  Network,
  Presentation,
  HelpCircle,
  Layers,
  Headphones,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function NotebookPage({ params }) {
  const resolvedParams = use(params);
  const notebookId = resolvedParams.id;

  const { fetchMe } = useAuthStore();
  const {
    currentNotebook,
    fetchNotebookDetails,
    resetNotebookState,
    documents,
    activeDocumentView,
    studioOutputs,
    generateMindMap,
    generateSlides,
    generateQuiz,
    generateFlashcards,
    generatePodcast,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'mindmap' | 'slides' | 'quiz' | 'flashcards' | 'podcast'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMe();
    if (notebookId) {
      fetchNotebookDetails(notebookId);
    }
    return () => {
      resetNotebookState();
    };
  }, [notebookId]);

  const latestMindMap = studioOutputs.find((s) => s.type === 'MIND_MAP');
  const latestSlides = studioOutputs.find((s) => s.type === 'SLIDE_DECK');
  const latestQuiz = studioOutputs.find((s) => s.type === 'QUIZ');
  const latestFlashcards = studioOutputs.find((s) => s.type === 'FLASHCARDS');
  const latestPodcast = studioOutputs.find((s) => s.type === 'PODCAST');

  const handleGenerate = async (type) => {
    setGenerating(true);
    try {
      if (type === 'mindmap') await generateMindMap(notebookId);
      if (type === 'slides') await generateSlides(notebookId);
      if (type === 'quiz') await generateQuiz(notebookId);
      if (type === 'flashcards') await generateFlashcards(notebookId);
      if (type === 'podcast') await generatePodcast(notebookId, 'Host A (Technical Lead)', 'Host B (Curious Inquirer)');
      setGenerating(false);
    } catch (err) {
      setGenerating(false);
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
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === 'mindmap'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                Mind Map
              </button>

              <button
                onClick={() => setActiveTab('slides')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === 'slides'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Presentation className="h-3.5 w-3.5" />
                Slide Deck
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === 'quiz'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Quiz
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === 'flashcards'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Flashcards
              </button>

              <button
                onClick={() => setActiveTab('podcast')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === 'podcast'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Headphones className="h-3.5 w-3.5" />
                Podcast
              </button>
            </div>

            {/* Dynamic Action Button for current active tab */}
            {activeTab !== 'chat' && (
              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={generating}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow shrink-0 ml-2"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate {activeTab === 'mindmap' ? 'Mind Map' : activeTab === 'slides' ? 'Slide Deck' : activeTab === 'quiz' ? 'Quiz' : activeTab === 'flashcards' ? 'Flashcards' : 'Podcast'}
              </button>
            )}
          </div>

          {/* Active Tab View Container */}
          <div className="flex-1 min-h-0">
            {activeTab === 'chat' && <ChatWindow notebookId={notebookId} />}

            {activeTab === 'mindmap' && (
              <div className="h-full flex flex-col">
                <MindMapViewer
                  mindMapData={latestMindMap?.output}
                  onGenerate={() => handleGenerate('mindmap')}
                  generating={generating && activeTab === 'mindmap'}
                />
              </div>
            )}

            {activeTab === 'slides' && (
              <div className="h-full flex flex-col">
                <SlideDeckViewer
                  slideDeckData={latestSlides?.output}
                  onGenerate={() => handleGenerate('slides')}
                  generating={generating && activeTab === 'slides'}
                />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="h-full flex flex-col">
                <QuizViewer
                  quizData={latestQuiz?.output}
                  onGenerate={() => handleGenerate('quiz')}
                  generating={generating && activeTab === 'quiz'}
                />
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="h-full flex flex-col">
                <FlashcardViewer
                  flashcardsData={latestFlashcards?.output}
                  onGenerate={() => handleGenerate('flashcards')}
                  generating={generating && activeTab === 'flashcards'}
                />
              </div>
            )}

            {activeTab === 'podcast' && (
              <div className="h-full overflow-y-auto">
                {generating && activeTab === 'podcast' ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                    <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl text-purple-400">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                    </div>
                    <h3 className="text-base font-bold text-white">Generating Audio Podcast...</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Synthesizing document concepts into an engaging two-speaker podcast dialogue and generating audio.
                    </p>
                  </div>
                ) : latestPodcast ? (
                  <PodcastPlayer studioOutput={latestPodcast} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    <Headphones className="h-10 w-10 text-purple-400 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Generate AI Audio Overview</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-5">
                      Creates an engaging two-speaker podcast conversation synthesizing key research ideas from your documents.
                    </p>
                    <button
                      onClick={() => handleGenerate('podcast')}
                      disabled={generating}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
