'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Presentation, FileText, Sparkles, BookOpen } from 'lucide-react';

export default function SlideDeckViewer({ slideDeckData }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  if (!slideDeckData || !slideDeckData.slides || slideDeckData.slides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <Presentation className="h-10 w-10 text-blue-400 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Generate AI Presentation Slide Deck</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Creates structured presentation slides with executive summaries and speaker notes derived from your workspace documents.
        </p>
      </div>
    );
  }

  const slides = slideDeckData.slides;
  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
      {/* Slide Deck Top Header */}
      <div className="h-14 px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <div className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
            <Presentation className="h-4 w-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-white truncate max-w-[280px]">
              {slideDeckData.title || 'Presentation Slide Deck'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {slideDeckData.subtitle || `Slide ${currentSlideIndex + 1} of ${slides.length}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              showNotes
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Speaker Notes
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Canvas */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#070a13] relative overflow-hidden">
        <div className="w-full max-w-3xl aspect-[16/9] bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Header */}
          <div>
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-2">
              <span className="uppercase tracking-wider">Slide {currentSlideIndex + 1}</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {currentSlide.title}
            </h2>
          </div>

          {/* Bullet Points */}
          <div className="my-6 space-y-3">
            {currentSlide.content && currentSlide.content.map((point, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs md:text-sm text-slate-200">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <p className="leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          {/* Slide Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>DocsLM AI Slide Deck</span>
            <span>{currentSlideIndex + 1} / {slides.length}</span>
          </div>
        </div>

        {/* Speaker Notes Popover Drawer */}
        {showNotes && currentSlide.speaker_notes && (
          <div className="w-full max-w-3xl mt-4 bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 text-xs text-slate-300 shadow-xl">
            <span className="font-semibold text-blue-400 block mb-1 text-[11px]">
              Presenter Speaker Notes:
            </span>
            <p className="italic leading-relaxed">{currentSlide.speaker_notes}</p>
          </div>
        )}
      </div>

      {/* Navigation Controls Bar */}
      <div className="h-14 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        {/* Thumbnail Dots */}
        <div className="flex items-center space-x-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlideIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                currentSlideIndex === i ? 'bg-blue-500 w-6' : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
