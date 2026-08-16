'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Headphones, Volume2, Mic, UserCheck, Sparkles } from 'lucide-react';

export default function PodcastPlayer({ studioOutput }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  if (!studioOutput) return null;

  const { output, storage_url, status } = studioOutput;
  const script = output?.script || [];
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const audioSrc = storage_url ? `${API_BASE_URL}${storage_url}` : null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Audio Overview Podcast
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </h3>
            <p className="text-xs text-slate-400">Two-speaker conversational summary derived from uploaded documents</p>
          </div>
        </div>

        {audioSrc && (
          <div className="flex items-center space-x-2">
            {[1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                  playbackSpeed === speed
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audio Controls */}
      {audioSrc ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <audio
            ref={audioRef}
            src={audioSrc}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition shrink-0"
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-200">AI Speaker Dialogue Track</span>
              <span className="text-[11px] text-purple-400">Merged MP3</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className={`h-full bg-purple-500 transition-all ${isPlaying ? 'w-3/4 animate-pulse' : 'w-0'}`} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-amber-400">
          Audio processing in background... Click refresh to load generated podcast MP3.
        </div>
      )}

      {/* Dialogue Transcript */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Podcast Dialogue Transcript ({script.length} turns)
        </h4>

        {script.map((turn, i) => {
          const isHostA = turn.speaker.includes('A') || turn.speaker.includes('Alex') || i % 2 === 0;
          return (
            <div
              key={i}
              className={`p-3 rounded-xl border text-xs leading-relaxed flex gap-3 ${
                isHostA
                  ? 'bg-slate-950/60 border-slate-800 text-slate-200'
                  : 'bg-purple-950/20 border-purple-900/40 text-purple-100'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                  isHostA
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                    : 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className={`font-semibold text-[11px] block mb-0.5 ${isHostA ? 'text-blue-400' : 'text-purple-300'}`}>
                  {turn.speaker}
                </span>
                <p>{turn.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
