'use client';

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function QuizViewer({ quizData, onGenerate, generating }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (generating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-white">Generating Quiz Questions...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Formulating multiple-choice comprehension questions and explanations from workspace concepts.
        </p>
      </div>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <HelpCircle className="h-10 w-10 text-blue-400 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Generate AI Comprehension Quiz</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5">
          Constructs interactive multiple-choice questions with answer verification and explanations.
        </p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Quiz
          </button>
        )}
      </div>
    );
  }

  const questions = quizData.questions;

  const handleSelectOption = (questionId, optionIndex) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_option_index) {
        score += 1;
      }
    });
    return score;
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
      {/* Quiz Top Header */}
      <div className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
            <HelpCircle className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-white">
            {quizData.title || 'Document Knowledge Assessment'}
          </h3>
        </div>

        {submitted ? (
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
            </span>
            <button
              onClick={resetQuiz}
              className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            Submit Answers
          </button>
        )}
      </div>

      {/* Questions Scroll List */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {questions.map((q, idx) => {
          const userChoice = selectedAnswers[q.id];
          const isCorrect = userChoice === q.correct_option_index;

          return (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  {q.question}
                </h4>

                {submitted && (
                  <div>
                    {isCorrect ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Incorrect
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userChoice === optIdx;
                  const isAnswer = optIdx === q.correct_option_index;

                  let btnStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';

                  if (submitted) {
                    if (isAnswer) {
                      btnStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-red-500/60 bg-red-500/10 text-red-300';
                    }
                  } else if (isSelected) {
                    btnStyle = 'border-blue-500/80 bg-blue-500/20 text-white font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-xs text-left transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && isAnswer && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal after submission */}
              {submitted && q.explanation && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block mb-0.5">Explanation:</span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
