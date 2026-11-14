'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ParsedPresentation } from '@/lib/slides';
import { playSelectSound } from '@/lib/sound/sound-manager';
import {
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface SlideViewerProps {
  lessonId: string;
  lessonTitle: string;
  parsedSlides: ParsedPresentation;
  totalLocalSlides?: number;
}

export function SlideViewer({
  lessonId,
  lessonTitle,
  parsedSlides,
  totalLocalSlides = 10,
}: SlideViewerProps) {
  const [activeTab, setActiveTab] = useState<'embed' | 'gallery'>(
    parsedSlides.isValid && parsedSlides.embedUrl ? 'embed' : 'gallery'
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slideDir =
    lessonId === 'html_08'
      ? 'lesson_8'
      : lessonId === 'html_07'
      ? 'lesson_7'
      : lessonId === 'html_06'
      ? 'lesson_6'
      : lessonId === 'html_05'
      ? 'lesson_5'
      : lessonId === 'html_04'
      ? 'lesson_4'
      : lessonId === 'html_03'
      ? 'lesson_3'
      : lessonId === 'html_02'
      ? 'lesson_2'
      : lessonId === 'html_01'
      ? 'lesson_1'
      : null;

  const currentSlideImage = slideDir
    ? `/slides/${slideDir}/slide_${currentSlideIndex}.png`
    : null;

  const handleNextSlide = useCallback(() => {
    playSelectSound();
    setCurrentSlideIndex((prev) => (prev < totalLocalSlides ? prev + 1 : 1));
  }, [totalLocalSlides]);

  const handlePrevSlide = useCallback(() => {
    playSelectSound();
    setCurrentSlideIndex((prev) => (prev > 1 ? prev - 1 : totalLocalSlides));
  }, [totalLocalSlides]);

  // Keyboard arrow navigation for gallery slides + Escape for fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeTab === 'gallery' && currentSlideImage) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextSlide();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevSlide();
        }
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, currentSlideImage, handleNextSlide, handlePrevSlide, isFullscreen]);

  const progressPercent = Math.round((currentSlideIndex / Math.max(totalLocalSlides, 1)) * 100);

  return (
    <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-slate-800 space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-cyber font-bold text-white">
            สไลด์เนื้อหาการเรียนรู้ (Course Presentation)
          </h2>
          {activeTab === 'gallery' && (
            <span className="hidden md:inline-block ml-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
              กดปุ่ม ◀ ▶ บนคีย์บอร์ดเพื่อเปลี่ยนหน้าได้
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs switch if embed is available */}
          {parsedSlides.isValid && parsedSlides.embedUrl && (
            <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-thai">
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setActiveTab('embed');
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'embed'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {parsedSlides.platformLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setActiveTab('gallery');
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                สไลด์ต้นฉบับ ({totalLocalSlides} หน้า)
              </button>
            </div>
          )}

          {parsedSlides.isValid && parsedSlides.openUrl && (
            <a
              href={parsedSlides.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-400 text-xs font-thai transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดในแท็บใหม่</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Presentation View */}
      {activeTab === 'embed' && parsedSlides.isValid && parsedSlides.embedUrl ? (
        <div className="space-y-2.5">
          <div className="relative w-full aspect-video max-h-[calc(100vh-270px)] mx-auto rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            <iframe
              src={parsedSlides.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title={`${parsedSlides.platformLabel} - ${lessonTitle}`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-thai text-slate-400">
            <span>💡 ใช้ปุ่มลูกศรหรือคลิกบนสไลด์เพื่อเปลี่ยนหน้า</span>
            {parsedSlides.openUrl && (
              <span>
                หากสไลด์ไม่โหลด ให้กด{' '}
                <a
                  href={parsedSlides.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  เปิด {parsedSlides.platformLabel} ในแท็บใหม่
                </a>
              </span>
            )}
          </div>
        </div>
      ) : currentSlideImage ? (
        /* Local High-Res Slide Gallery (Viewport-Fitted) */
        <div className="space-y-3">
          <div
            className={`relative w-full aspect-video max-h-[calc(100vh-285px)] mx-auto rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.15)] group flex items-center justify-center ${
              isFullscreen ? 'fixed inset-4 z-50 max-h-none aspect-auto h-auto' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSlideImage}
              alt={`สไลด์ที่ ${currentSlideIndex} - ${lessonTitle}`}
              onClick={handleNextSlide}
              title="คลิกเพื่อไปสไลด์ถัดไป"
              className="w-full h-full object-contain select-none cursor-pointer"
            />

            {/* Prev button overlay */}
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/85 hover:bg-cyan-500 border border-slate-700 hover:border-cyan-400 text-white hover:text-slate-950 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next button overlay */}
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/85 hover:bg-cyan-500 border border-slate-700 hover:border-cyan-400 text-white hover:text-slate-950 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Index Badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold shadow-md backdrop-blur-sm">
              สไลด์ {currentSlideIndex} / {totalLocalSlides}
            </div>

            {/* Fullscreen toggle button */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setIsFullscreen(!isFullscreen);
              }}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/85 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
              title={isFullscreen ? 'ปิดจอเต็ม (Esc)' : 'ขยายเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Slide Progress Bar + Compact Thumbnail Strip */}
          <div className="space-y-2">
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {Array.from({ length: totalLocalSlides }).map((_, idx) => {
                const num = idx + 1;
                const isActive = num === currentSlideIndex;
                const thumbSrc = `/slides/${slideDir}/slide_${num}.png`;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setCurrentSlideIndex(num);
                    }}
                    className={`relative flex-shrink-0 w-16 sm:w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.5)] scale-105'
                        : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbSrc} alt={`สไลด์ ${num}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-slate-950/90 text-[9px] font-mono text-slate-300">
                      {num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-thai text-slate-300">
            ยังไม่ได้กำหนดสไลด์สำหรับบทเรียนนี้
          </p>
        </div>
      )}
    </div>
  );
}
