'use client';

import React, { useState } from 'react';
import { Lesson, QuizQuestion } from '@/lib/supabase/types';
import { parseGoogleSlidesUrl } from '@/lib/slides';
import { updateLessonSettings, updateQuizQuestion, seedDefaultQuizQuestions } from '@/app/actions/teacher-lessons';
import {
  Save,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Edit3,
  Sliders,
  HelpCircle,
  X,
  Sparkles,
  BookOpen,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface LessonEditorProps {
  initialLesson: Lesson;
  initialQuestions: QuizQuestion[];
}

export function LessonEditor({ initialLesson, initialQuestions }: LessonEditorProps) {
  // Lesson Info State
  const [title, setTitle] = useState(initialLesson.title);
  const [googleSlidesUrl, setGoogleSlidesUrl] = useState(initialLesson.google_slides_url || '');
  const [isPublished, setIsPublished] = useState(initialLesson.is_published ?? true);
  const [quizEnabled, setQuizEnabled] = useState(initialLesson.quiz_enabled ?? true);

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [editForm, setEditForm] = useState<{
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    explanation: string;
  }>({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
  });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Real-time URL parse
  const parsedSlides = parseGoogleSlidesUrl(googleSlidesUrl);

  // Handle Save Lesson Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    if (googleSlidesUrl.trim() && !parsedSlides.isValid) {
      setSaveMessage({ type: 'error', text: parsedSlides.errorMessage || 'ลิงก์ Google Slides ไม่ถูกต้อง' });
      setIsSaving(false);
      return;
    }

    const res = await updateLessonSettings({
      lessonId: initialLesson.id,
      title,
      googleSlidesUrl: googleSlidesUrl.trim() || null,
      isPublished,
      quizEnabled,
    });

    if (res.success) {
      setSaveMessage({ type: 'success', text: 'บันทึกการตั้งค่าบทเรียนสำเร็จเรียบร้อยแล้ว!' });
      setTimeout(() => setSaveMessage(null), 4000);
    } else {
      setSaveMessage({ type: 'error', text: res.error || 'เกิดข้อผิดพลาดในการบันทึก' });
    }
    setIsSaving(false);
  };

  // Open Edit Question Modal
  const openEditModal = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setEditForm({
      questionText: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctOption: q.correct_option,
      explanation: q.explanation,
    });
    setQuestionError(null);
  };

  // Handle Save Edited Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsSavingQuestion(true);
    setQuestionError(null);

    const res = await updateQuizQuestion({
      id: editingQuestion.id,
      ...editForm,
    });

    if (res.success) {
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === editingQuestion.id
            ? {
                ...item,
                question_text: editForm.questionText,
                option_a: editForm.optionA,
                option_b: editForm.optionB,
                option_c: editForm.optionC,
                option_d: editForm.optionD,
                correct_option: editForm.correctOption,
                explanation: editForm.explanation,
              }
            : item
        )
      );
      setEditingQuestion(null);
    } else {
      setQuestionError(res.error || 'ไม่สามารถบันทึกข้อสอบได้');
    }
    setIsSavingQuestion(false);
  };

  // Seed / Reset Default 10 Questions
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedQuestions = async () => {
    setIsSeeding(true);
    setSaveMessage(null);
    try {
      const res = await seedDefaultQuizQuestions(initialLesson.id);
      if (res.success && res.questions) {
        setQuestions(res.questions);
        setSaveMessage({
          type: 'success',
          text: 'สร้างชุดข้อสอบมาตรฐาน 10 ข้อเรียบร้อยแล้ว!',
        });
      } else {
        setSaveMessage({
          type: 'error',
          text: res.error || 'ไม่สามารถสร้างข้อสอบได้',
        });
      }
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg animate-fadeIn ${
            saveMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-thai">
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{saveMessage.text}</span>
          </div>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: ข้อมูลบทเรียน */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-sm font-bold">
              บทเรียนที่ {initialLesson.lesson_number}
            </span>
            <h2 className="text-xl font-cyber font-bold text-white">ส่วนที่ 1: ข้อมูลบทเรียน</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">ID: {initialLesson.id}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-cyber text-slate-300">
              ชื่อบทเรียน (แก้ไขได้)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-thai text-sm outline-none transition-all"
              placeholder="ระบุชื่อบทเรียน..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-cyber text-slate-300">สถานะปัจจุบัน</label>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-thai font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                วิชา: HTML เบื้องต้น (+100 EXP)
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-thai font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                1 เหรียญรางวัล
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: อัปโหลดสไลด์ GOOGLE SLIDES & CANVA */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/40 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-cyber font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>ส่วนที่ 2: สไลด์ประกอบการเรียน (Google Slides &amp; Canva)</span>
            </h2>
            <p className="text-xs font-thai text-slate-400 mt-0.5">
              รองรับทั้งลิงก์ Google Slides และ Canva Presentation เพื่อให้นักเรียนเปิดอ่านและศึกษาผ่านหน้าเว็บ
            </p>
          </div>

          {parsedSlides.isValid && parsedSlides.openUrl && (
            <a
              href={parsedSlides.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-400 text-xs font-thai transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิด {parsedSlides.platformLabel} ในแท็บใหม่</span>
            </a>
          )}
        </div>

        {/* Input Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-cyber text-slate-300">
              วางลิงก์ Google Slides หรือ Canva ของบทเรียนที่นี่:
            </label>
            {parsedSlides.isValid && (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{parsedSlides.platformLabel}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={googleSlidesUrl}
              onChange={(e) => setGoogleSlidesUrl(e.target.value)}
              placeholder="https://docs.google.com/presentation/... หรือ https://www.canva.com/design/..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-white font-mono text-xs outline-none transition-all"
            />

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              disabled={!parsedSlides.isValid}
              className={`px-4 py-3 rounded-xl font-cyber text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                parsedSlides.isValid
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/50 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>ดูตัวอย่างสไลด์</span>
            </button>
          </div>

          {/* Validation Feedback */}
          {googleSlidesUrl.trim() && (
            <div className="text-xs font-thai">
              {parsedSlides.isValid ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    รูปแบบลิงก์ <strong>{parsedSlides.platformLabel}</strong> ถูกต้อง พร้อมสำหรับการแสดงผลใน iframe
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{parsedSlides.errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Teacher Guide & Permissions Notice */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-thai text-slate-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>คำแนะนำเรื่องสิทธิ์การเข้าถึงสไลด์ (Sharing Permissions):</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-slate-300 leading-relaxed">
              <li>
                <strong className="text-cyan-300">Google Slides:</strong> กดปุ่ม <em>&quot;แชร์ (Share)&quot;</em> &rarr; ตั้งค่าเป็น <em>&quot;ทุกคนที่มีลิงก์มีสิทธิ์ดู (Anyone with the link can view)&quot;</em>
              </li>
              <li>
                <strong className="text-purple-300">Canva:</strong> กดปุ่ม <em>&quot;แชร์ (Share)&quot;</em> ด้านขวาบน &rarr; ตั้งค่าการเข้าถึงเป็น <em>&quot;ทุกคนที่มีลิงก์สามารถดูได้ (Anyone with the link can view)&quot;</em> หรือเลือก <em>&quot;ฝัง (Embed)&quot;</em>
              </li>
            </ul>
          </div>
        </div>

        {/* Embedded Preview Box */}
        {parsedSlides.isValid && parsedSlides.embedUrl && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cyber text-slate-300">
                ตัวอย่างการแสดงผล ({parsedSlides.platformLabel}):
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                RESPONSIVE IFRAME 16:9
              </span>
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-inner">
              <iframe
                src={parsedSlides.embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                title={`${parsedSlides.platformLabel} Preview`}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: ตั้งค่าสิทธิ์การเรียน */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-xl font-cyber font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <span>ส่วนที่ 3: ตั้งค่าสิทธิ์การเรียน (Access Control)</span>
          </h2>
          <p className="text-xs font-thai text-slate-400 mt-0.5">
            ควบคุมการเปิด/ปิดให้นักเรียนเข้าเรียนและทำแบบทดสอบผ่านระบบฐานข้อมูล
          </p>
        </div>

        <div className="space-y-4">
          {/* Checkbox 1 */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-sm font-cyber font-bold text-white">
                เปิดให้นักเรียนเรียนบทนี้ได้
              </span>
              <p className="text-xs font-thai text-slate-400">
                เมื่อปิดการเรียน นักเรียนจะไม่สามารถคลิกเริ่มเรียนบทนี้ และไม่สามารถเปิดดูสไลด์ได้
              </p>
            </div>
          </label>

          {/* Checkbox 2 */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={quizEnabled}
              onChange={(e) => setQuizEnabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-sm font-cyber font-bold text-white">
                เปิดให้นักเรียนทำแบบทดสอบของบทเรียนนี้ได้
              </span>
              <p className="text-xs font-thai text-slate-400">
                เมื่อปิดแบบทดสอบ นักเรียนจะไม่สามารถเริ่มทำแบบทดสอบได้ แต่ข้อสอบและคะแนนเดิมยังคงถูกบันทึกไว้อย่างปลอดภัย
              </p>
            </div>
          </label>
        </div>

        {/* Global Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-cyber font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าบทเรียนและสิทธิ์'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: ตรวจสอบแบบทดสอบ (QUIZ MANAGEMENT) */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-cyber font-bold text-white flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-amber-400" />
              <span>ส่วนที่ 4: ตรวจสอบแบบทดสอบ (Quiz Questions Review)</span>
            </h2>
            <p className="text-xs font-thai text-slate-400 mt-0.5">
              ตรวจสอบคำถาม ตัวเลือก เฉลย และคำอธิบาย ทั้ง 10 ข้อ (ครูสามารถกดแก้ไขได้ทุกข้อ)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{questions.length} / 10 QUESTIONS READY</span>
            </div>

            {questions.length > 0 && (
              <button
                type="button"
                onClick={handleSeedQuestions}
                disabled={isSeeding}
                title="รีเซ็ตเป็นชุดข้อสอบมาตรฐาน 10 ข้อ"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-cyber flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>รีเซ็ตข้อสอบ</span>
              </button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-amber-500/40 rounded-xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-cyber font-bold text-white text-base">
                ยังไม่มีแบบทดสอบสำหรับบทเรียนนี้ในระบบ
              </p>
              <p className="text-xs font-thai text-slate-400 mt-1">
                คลิกปุ่มด้านล่างเพื่อสร้างชุดข้อสอบมาตรฐาน 10 ข้อพร้อมเฉลยและคำอธิบายโดยอัตโนมัติ
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedQuestions}
              disabled={isSeeding}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-cyber font-bold text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isSeeding ? 'กำลังสร้างชุดข้อสอบ...' : '⚡ กดตรงนี้เพื่อสร้างชุดข้อสอบ 10 ข้อมาตรฐานทันที'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      ข้อที่ {q.question_number}
                    </span>
                    <h3 className="text-sm font-thai font-semibold text-white">
                      {q.question_text}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(q)}
                    className="self-end sm:self-center px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 text-xs font-cyber flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อนี้</span>
                  </button>
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-thai">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const text =
                      key === 'A'
                        ? q.option_a
                        : key === 'B'
                        ? q.option_b
                        : key === 'C'
                        ? q.option_c
                        : q.option_d;
                    const isCorrect = q.correct_option === key;

                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-semibold'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {key}
                        </span>
                        <span className="flex-1">{text}</span>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-500 text-emerald-200">
                            เฉลย
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-thai space-y-1">
                  <span className="text-amber-400 font-semibold font-mono text-[11px] flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    คำอธิบายเฉลย:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 sm:p-8 border border-cyan-400/50 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-cyber font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>แก้ไขข้อสอบ ข้อที่ {editingQuestion.question_number}</span>
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {questionError && (
              <div className="p-3 rounded-lg bg-rose-950 border border-rose-500 text-rose-300 text-xs font-thai">
                {questionError}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-cyber text-slate-300">คำถาม</label>
                <textarea
                  value={editForm.questionText}
                  onChange={(e) =>
                    setEditForm({ ...editForm, questionText: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-sm outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">ตัวเลือก A</label>
                  <input
                    type="text"
                    value={editForm.optionA}
                    onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-xs outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">ตัวเลือก B</label>
                  <input
                    type="text"
                    value={editForm.optionB}
                    onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-xs outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">ตัวเลือก C</label>
                  <input
                    type="text"
                    value={editForm.optionC}
                    onChange={(e) => setEditForm({ ...editForm, optionC: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-xs outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">ตัวเลือก D</label>
                  <input
                    type="text"
                    value={editForm.optionD}
                    onChange={(e) => setEditForm({ ...editForm, optionD: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-xs outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-cyber text-emerald-400">คำตอบที่ถูกต้อง</label>
                  <select
                    value={editForm.correctOption}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        correctOption: e.target.value as 'A' | 'B' | 'C' | 'D',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs outline-none"
                  >
                    <option value="A">ตัวเลือก A</option>
                    <option value="B">ตัวเลือก B</option>
                    <option value="C">ตัวเลือก C</option>
                    <option value="D">ตัวเลือก D</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-cyber text-amber-400">คำอธิบายเฉลย</label>
                  <textarea
                    value={editForm.explanation}
                    onChange={(e) =>
                      setEditForm({ ...editForm, explanation: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-thai text-xs outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-cyber text-xs hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  {isSavingQuestion ? 'กำลังบันทึก...' : 'บันทึกข้อสอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {showPreviewModal && parsedSlides.embedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-2xl border border-cyan-500/50 bg-slate-950 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="font-cyber font-bold text-sm text-white">
                  ตัวอย่างสไลด์เต็มจอ ({parsedSlides.platformLabel} Preview)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {parsedSlides.openUrl && (
                  <a
                    href={parsedSlides.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-thai text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิด {parsedSlides.platformLabel} ในแท็บใหม่</span>
                  </a>
                )}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-950">
              <iframe
                src={parsedSlides.embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                title={`${parsedSlides.platformLabel} Fullscreen Preview`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
