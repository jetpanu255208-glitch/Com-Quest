# 🎮 COM QUEST — เกมผจญภัยเรียนรู้วิชาคอมพิวเตอร์และ HTML

> **"มาเรียนรู้วิชาคอมพิวเตอร์ไม่ให้น่าเบื่อกันเลย"**  
> เปลี่ยนการเรียนรู้ให้เป็นการผจญภัย ทำแบบฝึกหัด เก็บ EXP อัปเลเวล และพัฒนาทักษะคอมพิวเตอร์ไปพร้อมกัน

---

## 📖 สารบัญ (Table of Contents)

1. [ภาพรวมของโปรเจกต์ (Project Overview)](#1-ภาพรวมของโปรเจกต์)
2. [เทคโนโลยีที่ใช้ (Tech Stack)](#2-เทคโนโลยีที่ใช้)
3. [สิ่งที่ต้องเตรียมล่วงหน้า (Prerequisites)](#3-สิ่งที่ต้องเตรียมล่วงหน้า-prerequisites)
4. [ขั้นตอนการติดตั้งโปรเจกต์ (Installation)](#4-ขั้นตอนการติดตั้งโปรเจกต์-installation)
5. [การสร้างโปรเจกต์บน Supabase (Supabase Setup)](#5-การสร้างโปรเจกต์บน-supabase)
6. [การรัน SQL Migration (Database Migration)](#6-การรัน-sql-migration)
7. [การตั้งค่า Environment Variables (.env.local)](#7-การตั้งค่า-environment-variables)
8. [การตั้งค่าระบบ Authentication (Email & Password)](#8-การตั้งค่าระบบ-authentication-email--password)
9. [การรันโปรเจกต์ในเครื่อง (Local Development)](#9-การรันโปรเจกต์ในเครื่อง-local-development)
10. [การสร้างและอนุมัติสิทธิ์บัญชีครูผู้สอน (Teacher Account SOP)](#10-การสร้างและอนุมัติสิทธิ์บัญชีครูผู้สอน)
11. [การ Deploy ขึ้น Vercel (Deployment Guide)](#11-การ-deploy-ขึ้น-vercel)
12. [การตั้งค่า Production Redirect URLs](#12-การตั้งค่า-production-redirect-urls)
13. [การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)](#13-การแก้ไขปัญหาที่พบบ่อย-troubleshooting)

---

## 1. ภาพรวมของโปรเจกต์

**Com Quest** เป็นแพลตฟอร์มการเรียนรู้เชิงเกม (Gamified Learning Platform) ที่ออกแบบมาเพื่อสอนวิชาคอมพิวเตอร์และภาษา HTML ให้นักเรียนระดับมัธยมศึกษาหรือผู้เริ่มต้น ด้วยธีมเกม Retro 8-Bit ผสมผสาน Cyberpunk ยุคอวกาศ พร้อมระบบสะสม EXP, เลเวลตัวละคร, เควสต์ และระบบควบคุมบทบาทสิทธิ์ (Role-Based Access Control) ระหว่างนักเรียน (Student) และครูผู้สอน (Teacher/Admin)

---

## 2. เทคโนโลยีที่ใช้

- **Frontend & Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **UI Library**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security - RLS)
- **Authentication SDK**: `@supabase/ssr` และ `@supabase/supabase-js`
- **Deployment Platform**: [Vercel](https://vercel.com/)

---

## 3. สิ่งที่ต้องเตรียมล่วงหน้า (Prerequisites)

- **Node.js**: เวอร์ชัน 18.18.0 ขึ้นไป (แนะนำเวอร์ชัน LTS เช่น v20 หรือ v24)
- **npm** / **pnpm** / **yarn**
- บัญชี **Supabase** (ฟรีที่ [https://supabase.com](https://supabase.com))
- บัญชี **Google Cloud Console** (สำหรับเปิดใช้งาน Google OAuth)

---

## 4. ขั้นตอนการติดตั้งโปรเจกต์ (Installation)

1. Clone หรือเปิดโฟลเดอร์โปรเจกต์ใน Terminal:
   ```bash
   cd com-quest
   ```

2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

---

## 5. การสร้างโปรเจกต์บน Supabase

1. เข้าสู่ระบบที่ [Supabase Dashboard](https://app.supabase.com)
2. คลิก **"New Project"**
3. ตั้งชื่อโปรเจกต์ เช่น `com-quest`
4. กำหนดรหัสผ่านฐานข้อมูล (Database Password) และเลือก Region ใกล้เคียง (เช่น Singapore)
5. รอระบบสร้างฐานข้อมูลประมาณ 1-2 นาที

---

## 6. การรัน SQL Migration

### ขั้นตอนที่ 1: รัน Migration 001 (ระบบโปรไฟล์และยืนยันตัวตนพื้นฐาน)
1. ไปที่เมนู **SQL Editor** บนแถบด้านซ้ายของ Supabase Dashboard
2. คลิก **"New query"**
3. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/001_initial_profiles.sql`
4. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"**

### ขั้นตอนที่ 2: รัน Migration 002 (ระบบเลเวล, ถ้วยรางวัล และแต่งตัวละคร)
1. เปิด **SQL Editor** แล้วคลิก **"New query"** อีกครั้ง
2. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/002_player_progression_and_character.sql`
3. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"**

### ขั้นตอนที่ 3: รัน Migration 003 (ยืนยันอีเมลอัตโนมัติ ไม่ต้องกดยืนยัน)
1. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/003_auto_confirm_emails.sql`
2. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"** เพื่อให้นักเรียนที่สมัครใหม่ได้รับการยืนยันตัวตนอัตโนมัติทันที

### ขั้นตอนที่ 4: รัน Migration 004 (อนุญาตให้เปลี่ยน Role เป็น admin ได้)
1. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/004_allow_role_updates.sql`
2. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"** เพื่อให้สามารถแก้ `role` ในตาราง `profiles` จาก `user` เป็น `admin` ผ่าน Table Editor ได้

### ขั้นตอนที่ 5: รัน Migration 005 (หลักสูตร HTML เบื้องต้น 1 ตลับ 8 บทเรียน 8 เหรียญ รวมเป็น 1 ถ้วยสำเร็จรายวิชา)
1. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/005_single_html_subject_and_8_lessons.sql`
2. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"**

### ขั้นตอนที่ 6: รัน Migration 006 (ระบบจัดการบทเรียน, สไลด์ Google Slides และแบบทดสอบ 10 ข้อจับเวลา 30 วิ)
1. คัดลอกโค้ด SQL จากไฟล์ในโปรเจกต์:  
   `supabase/migrations/006_lesson_management_and_quiz_system.sql`
2. วางโค้ดใน SQL Editor แล้วกดปุ่ม **"Run"**
   - เพิ่มคอลัมน์ `google_slides_url`, `is_published`, `quiz_enabled` ในตาราง `lessons`
   - สร้างตาราง `quiz_questions` พร้อม Seed 10 ข้อสอบมาตรฐานบทเรียนที่ 1
   - สร้างตาราง `quiz_attempts` บันทึกประวัติและคะแนนการทำแบบทดสอบ
   - กำหนดสิทธิ์ RLS ป้องกันนักเรียนดูเฉลยล่วงหน้า อนุญาตให้ครูปรับแต่งข้อสอบและสไลด์ได้


---

## 7. การตั้งค่า Environment Variables

1. คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(บน Windows PowerShell ใช้: `Copy-Item .env.example .env.local`)*

2. เปิดไฟล์ `.env.local` แล้วใส่ค่าจริงจาก Supabase:
   - ไปที่ Supabase Dashboard -> **Project Settings** -> **API**
   - คัดลอก **Project URL** -> นำมาใส่ที่ `NEXT_PUBLIC_SUPABASE_URL`
   - คัดลอก **Project API Keys (anon public)** -> นำมาใส่ที่ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ **คำเตือนความปลอดภัย**: ห้ามนำ Service Role Key (`service_role secret`) มาใส่ใน `NEXT_PUBLIC_` โดยเด็ดขาด เพราะค่าดังกล่าวเป็นกุญแจที่มีสิทธิ์ระดับ Root ของระบบฐานข้อมูล!

---

## 8. การตั้งค่าระบบ Authentication (Email & Password)

ระบบของ **Com Quest** ใช้การยืนยันตัวตนด้วย **อีเมลและรหัสผ่าน (Email & Password)** เป็นหลัก ซึ่งมีความปลอดภัยสูงและเหมาะสำหรับระบบการศึกษา (ไม่จำเป็นต้องตั้งค่าบริการภายนอกหรือ Google Cloud Console ใดๆ):

### แนะนำ: วิธีตั้งค่าให้นักเรียนสมัครแล้วล็อกอินได้ทันที (ไม่ต้องรอยืนยันอีเมล)
1. ไปที่ Supabase Dashboard -> **Authentication** -> **Providers**
2. คลิกที่ตัวเลือก **Email**
3. ปิดสวิตช์ **"Confirm email"** (เปลี่ยนสถานะเป็น OFF)
4. กดปุ่ม **Save**

*ผลลัพธ์: นักเรียนจะสามารถกรอกชื่อ-นามสกุล, รหัสนักเรียน 11 หลัก, Username, Email, Password แล้วเริ่มเล่นเกมเก็บ EXP ได้ทันทีโดยไม่ต้องไปเปิดกล่องจดหมายอีเมล*

---

## 9. การรันโปรเจกต์ในเครื่อง (Local Development)

หลังจากตั้งค่า `.env.local` เรียบร้อยแล้ว ให้เริ่มเซิร์ฟเวอร์ด้วยคำสั่ง:

```bash
npm run dev
```

เปิดบราวเซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

### หน้าที่สามารถทดสอบได้:
- **หน้าหลัก (Landing Page)**: [http://localhost:3000/](http://localhost:3000/)
- **สมัครสมาชิกนักเรียน**: [http://localhost:3000/register](http://localhost:3000/register) *(เมื่อสำเร็จจะพาไปหน้า `/profile` อัตโนมัติ)*
- **เข้าสู่ระบบนักเรียน**: [http://localhost:3000/login](http://localhost:3000/login) *(เมื่อสำเร็จจะพาไปหน้า `/profile` อัตโนมัติ)*
- **โปรไฟล์นักเรียน (RPG Profile)**: [http://localhost:3000/profile](http://localhost:3000/profile) *(แสดงเลเวล 0-500, หลอด EXP, ตู้สะสม 5 ถ้วยรางวัล, ข้อมูลจริง, ปุ่มแต่งตัวละคร)*
- **แต่งตัวละครพิกเซล (Character Customization)**: [http://localhost:3000/character](http://localhost:3000/character) *(กราฟิก 8-Bit Chibi อิงตามภาพต้นแบบ สไตล์น่ารัก บันทึกลง Supabase)*
- **ตั้งค่าระบบ (Settings)**: [http://localhost:3000/settings](http://localhost:3000/settings) *(สลับธีม Dark Mode / Light Mode แบบเรียลไทม์)*
- **วิชาเรียน (Subjects Overview)**: [http://localhost:3000/subjects](http://localhost:3000/subjects) *(ภาพรวม 5 วิชาคอมพิวเตอร์)*
- **กระดานเควสต์ (Quest Board)**: [http://localhost:3000/quest](http://localhost:3000/quest) *(ภารกิจประจำสัปดาห์และเควสต์ผจญภัย)*
- **เข้าสู่ระบบครูผู้สอน**: [http://localhost:3000/teacher/login](http://localhost:3000/teacher/login)
- **หน้าแดชบอร์ดครูผู้สอน (Protected - เฉพาะ Admin)**: [http://localhost:3000/teacher](http://localhost:3000/teacher)

---

## 10. การสร้างและอนุมัติสิทธิ์บัญชีครูผู้สอน

เพื่อความปลอดภัยสูงสุด ระบบ **ไม่มีการเปิดให้สมัครบัญชีครูแบบสาธารณะ** บัญชีที่ลงทะเบียนผ่านหน้าเว็บจะได้รับสิทธิ์เป็น `user` (นักเรียน) เสมอ

### วิธีการแต่งตั้งครูผู้สอน (Promoting Teacher Account):
1. ให้ครูผู้สอนลงทะเบียนด้วยตนเองผ่านหน้าเว็บ `/register` หรือเข้าสู่ระบบด้วย Google ครั้งแรก
2. ผู้ดูแลระบบหลัก (DB Administrator) เข้าไปที่ Supabase SQL Editor
3. รันฟังก์ชันแต่งตั้งสิทธิ์:
   ```sql
   SELECT public.promote_to_teacher('teacher@school.ac.th');
   ```
4. บัญชีดังกล่าวจะได้รับการเปลี่ยนบทบาทเป็น `admin` ทันที และสามารถเข้าสู่ระบบผ่าน `/teacher/login` ได้อย่างปลอดภัย

---

## 11. การ Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub / GitLab / Bitbucket
2. ไปที่ [Vercel Dashboard](https://vercel.com/) แล้วเลือก **"Add New Project"**
3. นำเข้า Repository ของ Com Quest
4. ในส่วน **Environment Variables** ให้ใส่ค่าต่อไปนี้:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (ใส่โดเมนจริง เช่น `https://com-quest.vercel.app`)
5. กด **Deploy**

---

## 12. การตั้งค่า Production Redirect URLs

เมื่อโปรเจกต์ทำงานบน Production (เช่น Vercel) จำเป็นต้องเพิ่ม URL ให้ Supabase อนุญาต:

1. ไปที่ Supabase Dashboard -> **Authentication** -> **URL Configuration**
2. ในช่อง **Site URL** ให้ระบุ Production URL:
   ```
   https://com-quest.vercel.app
   ```
3. ในส่วน **Redirect URLs** ให้เพิ่ม:
   ```
   https://com-quest.vercel.app/**
   https://com-quest.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. กด **Save**

---

## 13. การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

| ปัญหา | สาเหตุที่เป็นไปได้ | แนวทางแก้ไข |
|---|---|---|
| **สมัครสมาชิกแล้วขึ้นแจ้งเตือนรหัสนักเรียนไม่ถูกต้อง** | รหัสนักเรียนต้องเป็นตัวเลข 11 หลัก | ตรวจสอบว่ากรอกตัวเลขครบ 11 หลักพอดี (เช่น `68219100010`) |
| **ล็อกอินครูแล้วขึ้น "สิทธิ์ถูกปฏิเสธ"** | บัญชียังมี Role เป็น `user` | ตรวจสอบในตาราง `profiles` ว่าฟิลด์ `role` เป็น `'admin'` หรือยัง หรือใช้ฟังก์ชัน `promote_to_teacher` |
| **Google Sign-In หมุนค้างหรือไม่เปลี่ยนหน้า** | ยังไม่ได้เพิ่ม Redirect URI ใน Google Cloud หรือ Supabase | ตรวจสอบว่าได้เพิ่ม URL `https://<ref>.supabase.co/auth/v1/callback` ใน Google Cloud Console หรือยัง |
| **เข้าหน้า `/student` แล้วเด้งกลับไปหน้า `/login`** | ไม่มีเซสชันการล็อกอิน หรือคุกกี้หมดอายุ | ล็อกอินใหม่อีกครั้งผ่านหน้า `/login` |
| **สร้างโปรไฟล์ไม่สำเร็จหลัง SignUp** | ไม่ได้รัน Migration หรือเกิดข้อผิดพลาดใน Trigger | ตรวจสอบว่าได้รันโค้ด `supabase/migrations/001_initial_profiles.sql` แล้วหรือไม่ |

---

**Com Quest** — พัฒนาเพื่อยกระดับการเรียนรู้วิทยาการคำนวณและภาษาเว็บสู่โลกอนาคต 🚀
