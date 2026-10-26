'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ExternalLink, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { cleanDummyTestAccounts, deleteStudent } from '@/app/actions/teacher-manage';

interface CleanTestAccountsButtonProps {
  className?: string;
}

export function CleanTestAccountsButton({ className = '' }: CleanTestAccountsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  const handleClean = () => {
    if (
      !window.confirm(
        'ต้องการลบรายชื่อบัญชีทดสอบที่ไม่รู้จักทั้งหมด (test_*, check_*) ออกจากระบบ ใช่หรือไม่?'
      )
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback('กำลังทำความสะอาดฐานข้อมูล...');
      const res = await cleanDummyTestAccounts();
      if (res.success) {
        setFeedback(res.message || 'ล้างบัญชีทดสอบเรียบร้อยแล้ว');
        router.refresh();
      } else {
        setFeedback('เกิดข้อผิดพลาด: ' + (res.error || 'ไม่สามารถลบได้'));
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClean}
        disabled={isPending}
        className={`px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 font-cyber font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 ${className}`}
      >
        <Trash2 className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
        <span>{isPending ? 'กำลังล้างข้อมูล...' : 'ลบรายชื่อที่ไม่รู้จักทั้งหมด'}</span>
      </button>

      {feedback && (
        <span className="text-xs font-thai text-amber-300 bg-amber-950/70 border border-amber-500/50 px-2.5 py-1 rounded-lg animate-fade-in">
          {feedback}
        </span>
      )}
    </div>
  );
}

interface StudentRowActionsProps {
  studentId: string;
  studentName: string;
}

export function StudentRowActions({ studentId, studentName }: StudentRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (
      !window.confirm(
        `ยืนยันการลบนักเรียน (${studentName})\n\nการลบนี้จะลบโปรไฟล์ คะแนน ความคืบหน้าการเรียน และประวัติการทำข้อสอบของนักเรียนคนนี้อย่างถาวร คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res.success) {
        router.refresh();
      } else {
        alert('เกิดข้อผิดพลาดในการลบ: ' + (res.error || ''));
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={`/profile?studentId=${studentId}`}
        title="เปิดดูหน้าโปรไฟล์ของนักเรียนคนนี้"
        className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition-colors flex items-center gap-1 text-[11px] font-thai"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">ดูโปรไฟล์</span>
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title="ลบข้อมูลนักเรียนคนนี้"
        className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors disabled:opacity-40 cursor-pointer"
      >
        <Trash2 className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
