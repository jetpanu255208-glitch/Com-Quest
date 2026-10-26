'use client';

import React, { useState } from 'react';
import { ParsedPresentation } from '@/lib/slides';
import {
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
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

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < totalLocalSlides ? prev + 1 : 1));
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 1 ? prev - 1 : totalLocalSlides));
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base sm:text-lg font-cyber font-bold text-white">
            สไลด์เนื้อหาการเรียนรู้ (Course Presentation)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs switch if embed is available */}
          {parsedSlides.isValid && parsedSlides.embedUrl && (
            <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-thai">
              <button
                type="button"
                onClick={() => setActiveTab('embed')}
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
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                สไลด์ต้นฉบับ ({totalLocalSlides} สไลด์)
              </button>
            </div>
          )}

          {parsedSlides.isValid && parsedSlides.openUrl && (
            <a
              href={parsedSlides.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-400 text-xs font-thai transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดในแท็บใหม่</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Presentation View */}
      {activeTab === 'embed' && parsedSlides.isValid && parsedSlides.embedUrl ? (
        <div className="space-y-3">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            <iframe
              src={parsedSlides.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title={`${parsedSlides.platformLabel} - ${lessonTitle}`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-thai text-slate-400 pt-1">
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
        /* Local High-Res Slide Gallery */
        <div className="space-y-4">
          <div
            className={`relative w-full aspect-video rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.15)] group flex items-center justify-center ${
              isFullscreen ? 'fixed inset-4 z-50 aspect-auto h-auto' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSlideImage}
              alt={`สไลด์ที่ ${currentSlideIndex} - ${lessonTitle}`}
              className="w-full h-full object-contain select-none"
            />

            {/* Prev button overlay */}
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-cyan-500 border border-slate-700 hover:border-cyan-400 text-white hover:text-slate-950 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next button overlay */}
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-cyan-500 border border-slate-700 hover:border-cyan-400 text-white hover:text-slate-950 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Index Badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-md backdrop-blur-sm">
              สไลด์ {currentSlideIndex} / {totalLocalSlides}
            </div>

            {/* Fullscreen toggle button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
              title={isFullscreen ? 'ปิดจอเต็ม' : 'ขยายเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {Array.from({ length: totalLocalSlides }).map((_, idx) => {
              const num = idx + 1;
              const isActive = num === currentSlideIndex;
              const thumbSrc = `/slides/${slideDir}/slide_${num}.png`;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentSlideIndex(num)}
                  className={`relative flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
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
