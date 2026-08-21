import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardCarouselProps {
  flashcards: Flashcard[];
}

export default function FlashcardCarousel({ flashcards }: FlashcardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <div className="p-4 text-center text-[#603620]">No flashcards available.</div>;
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-6">
      <div 
        className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className="w-full h-full duration-500 preserve-3d"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.6s' }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 border-2 border-[#e8ded1] dark:border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center shadow-lg text-center gap-4">
            <span className="text-xs font-bold text-[#b56b37] uppercase tracking-wider mb-2">Question {currentIndex + 1} of {flashcards.length}</span>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#231f20] dark:text-white leading-tight">
              {currentCard.question}
            </h3>
            <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-[#8c7569] font-medium">
              <RefreshCw className="w-4 h-4" /> Click to flip
            </div>
          </div>
          
          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-[#f6efe2] dark:bg-slate-700 border-2 border-[#e8ded1] dark:border-slate-600 rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center shadow-lg text-center"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-bold text-[#63703d] uppercase tracking-wider mb-4">Answer</span>
            <p className="text-base md:text-lg text-[#603620] dark:text-slate-200 font-medium leading-relaxed overflow-y-auto">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-white dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 text-[#603620] dark:text-slate-300 hover:bg-[#f6efe2] dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-bold text-[#231f20] dark:text-slate-300">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <button 
          onClick={handleNext}
          className="p-3 rounded-full bg-white dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 text-[#603620] dark:text-slate-300 hover:bg-[#f6efe2] dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
