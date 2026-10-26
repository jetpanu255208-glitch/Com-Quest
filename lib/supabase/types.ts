export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'admin';

export type CharacterConfig = {
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  outfit: string;
  accessory: string;
};

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  hairStyle: 'short-neat',
  hairColor: 'black',
  skinTone: 'warm',
  outfit: 'academy-navy',
  accessory: 'none',
};

export type Subject = {
  id: string;
  thai_name: string;
  program_name: string;
  short_label: string;
  description: string;
  icon_type: string;
  created_at: string;
};

export type SubjectProgress = {
  id: string;
  user_id: string;
  subject_id: string;
  completed: boolean;
  completed_at: string;
};

export type Lesson = {
  id: string;
  subject_id: string;
  lesson_number: number;
  title: string;
  description: string;
  xp_reward: number;
  google_slides_url?: string | null;
  is_published?: boolean;
  quiz_enabled?: boolean;
  created_at?: string;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string;
  status?: string;
  mission_completed?: boolean;
  mission_completed_at?: string | null;
  quiz_passed?: boolean;
  quiz_passed_at?: string | null;
  updated_at?: string;
};

export type QuizQuestion = {
  id: string;
  lesson_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  created_at?: string;
  updated_at?: string;
};

export type StudentQuizQuestion = {
  id: string;
  lesson_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  answers_summary?: any;
  created_at: string;
};

export const OFFICIAL_HTML_LESSONS: Lesson[] = [
  {
    id: 'html_01',
    subject_id: 'html_basic',
    lesson_number: 1,
    title: 'โครงสร้างพื้นฐานของ HTML',
    description: 'เรียนรู้แท็กหลัก !DOCTYPE, html, head, title และ body',
    xp_reward: 100,
  },
  {
    id: 'html_02',
    subject_id: 'html_basic',
    lesson_number: 2,
    title: 'หัวเรื่องและย่อหน้าข้อความ',
    description: 'การใช้แท็กหัวข้อ h1-h6 และย่อหน้าข้อความ p พร้อมการขึ้นบรรทัดใหม่',
    xp_reward: 100,
  },
  {
    id: 'html_03',
    subject_id: 'html_basic',
    lesson_number: 3,
    title: 'การจัดรูปแบบข้อความ',
    description: 'การเน้นข้อความตัวหนา ตัวเอียง ขีดเส้นใต้ และไฮไลต์ข้อความ',
    xp_reward: 100,
  },
  {
    id: 'html_04',
    subject_id: 'html_basic',
    lesson_number: 4,
    title: 'ลิงก์และการเชื่อมโยงเว็บ',
    description: 'การสร้าง Hyperlink ด้วยแท็ก a เชื่อมโยงหน้าเว็บภายในและภายนอก',
    xp_reward: 100,
  },
  {
    id: 'html_05',
    subject_id: 'html_basic',
    lesson_number: 5,
    title: 'การแทรกรูปภาพและสื่อในเว็บ',
    description: 'การแสดงผลรูปภาพด้วยแท็ก img กำหนด src, alt และขนาดภาพ พร้อมการฝังวิดีโอ',
    xp_reward: 100,
  },
  {
    id: 'html_06',
    subject_id: 'html_basic',
    lesson_number: 6,
    title: 'รายการและตารางข้อมูลในเว็บ',
    description: 'การสร้างรายการแบบมีและไม่มีลำดับ ul/ol และการสร้างตารางข้อมูล table, tr, th, td',
    xp_reward: 100,
  },
  {
    id: 'html_07',
    subject_id: 'html_basic',
    lesson_number: 7,
    title: 'ฟอร์มและการรับข้อมูลผู้ใช้',
    description: 'การสร้างแบบฟอร์ม form, input ข้อความ ปุ่มกด และตัวเลือกต่าง ๆ',
    xp_reward: 100,
  },
  {
    id: 'html_08',
    subject_id: 'html_basic',
    lesson_number: 8,
    title: 'Semantic HTML5 และโครงร่างเว็บ',
    description: 'การจัดโครงสร้างหน้าเว็บด้วย semantic tags: header, nav, main, footer',
    xp_reward: 100,
  },
];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          student_id: string | null;
          username: string | null;
          role: UserRole;
          character_config: CharacterConfig | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          student_id?: string | null;
          username?: string | null;
          role?: UserRole;
          character_config?: CharacterConfig | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          student_id?: string | null;
          username?: string | null;
          role?: UserRole;
          character_config?: CharacterConfig | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: Subject;
        Insert: Subject;
        Update: Partial<Subject>;
        Relationships: [];
      };
      subject_progress: {
        Row: SubjectProgress;
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          completed?: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          completed?: boolean;
          completed_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: Lesson;
        Insert: Lesson;
        Update: Partial<Lesson>;
        Relationships: [];
      };
      lesson_progress: {
        Row: LessonProgress;
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string;
          status?: string;
          mission_completed?: boolean;
          mission_completed_at?: string | null;
          quiz_passed?: boolean;
          quiz_passed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string;
          status?: string;
          mission_completed?: boolean;
          mission_completed_at?: string | null;
          quiz_passed?: boolean;
          quiz_passed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestion;
        Insert: Omit<QuizQuestion, 'id'> & { id?: string };
        Update: Partial<QuizQuestion>;
        Relationships: [];
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<QuizAttempt>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      promote_to_teacher: {
        Args: {
          p_email: string;
        };
        Returns: undefined;
      };
      complete_subject_for_user: {
        Args: {
          p_subject_id: string;
        };
        Returns: Json;
      };
      complete_lesson_for_user: {
        Args: {
          p_lesson_id: string;
        };
        Returns: Json;
      };
      check_identifier_exists: {
        Args: {
          p_username?: string;
          p_student_id?: string;
        };
        Returns: {
          username_taken: boolean;
          student_id_taken: boolean;
        };
      };
      save_student_profile: {
        Args: {
          p_first_name: string | null;
          p_last_name: string | null;
          p_student_id: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
