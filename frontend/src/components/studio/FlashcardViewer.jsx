'use client';

import React, { useState } from 'react';
import { Layers, RotateCw, ChevronLeft, ChevronRight, Check, RefreshCw, Shuffle } from 'lucide-react';

export default function FlashcardViewer({ flashcardsData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState([]);

  if (!flashcardsData || !flashcardsData.cards || flashcardsData.cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <Layers className="h-10 w-10 text-purple-400 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Generate 3D Study Flashcards</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Creates interactive double-sided flashcards for mastering key terminology and definitions.
        </p>
      </div>
    );
  }

  const cards = flashcardsData.cards;
  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleMastered = (id) => {
    if (masteredIds.includes(id)) {
      setMasteredIds(masteredIds.filter((item) => item !== id));
    } else {
      setMasteredIds([...masteredIds, id]);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const isCurrentMastered = masteredIds.includes(currentCard.id);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
      {/* Flashcard Header */}
      <div className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-white">
            {flashcardsData.title || 'Study Flashcard Deck'}
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-medium">
            Mastered: <strong className="text-emerald-400">{masteredIds.length}</strong> / {cards.length}
          </span>
        </div>
      </div>

      {/* 3D Flip Card Canvas */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#070a13] relative">
        <div
          onClick={handleFlip}
          className="w-full max-w-lg aspect-[3/2] bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-8 shadow-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:scale-[1.02] relative"
        >
          {/* Card Category Tag */}
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
            <span className="bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              {currentCard.category || 'General'}
            </span>
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <RotateCw className="h-3 w-3" /> Click to Flip ({isFlipped ? 'Back' : 'Front'})
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto text-center p-4">
            {!isFlipped ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">
                  Question / Concept
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
                  {currentCard.front}
                </h3>
              </div>
            ) : (
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest block mb-2">
                  Answer / Explanation
                </span>
                <p className="text-xs md:text-sm text-purple-100 font-medium leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span className="text-[11px] text-slate-500">
              Card {currentIndex + 1} of {cards.length}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(currentCard.id);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isCurrentMastered
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              {isCurrentMastered ? 'Mastered' : 'Mark Mastered'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer Bar */}
      <div className="h-14 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={prevCard}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <button
          onClick={handleFlip}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
        >
          <RotateCw className="h-4 w-4" /> Flip Card
        </button>

        <button
          onClick={nextCard}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
