import type { Metadata } from 'next';
import { Prompt, Chakra_Petch, Press_Start_2P } from 'next/font/google';
import { AmbientCyberBackground } from '@/components/layout/AmbientCyberBackground';
import './globals.css';

const promptFont = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
  display: 'swap',
});

const chakraPetch = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-chakra',
  display: 'swap',
});

const pressStart2P = Press_Start_2P({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'เว็บไซต์เรียนรู้วิชาภาษา HTML',
  description:
    'เว็บไซต์เรียนรู้วิชาภาษา HTML เปลี่ยนการเรียนรู้ให้เป็นการผจญภัย ทำแบบฝึกหัด เก็บ EXP อัปเลเวล และพัฒนาทักษะการเขียนเว็บไปพร้อมกัน',
  keywords: ['Com Quest', 'เว็บไซต์เรียนรู้วิชาภาษา HTML', 'เรียน HTML', 'วิชาคอมพิวเตอร์', 'Gamification', 'Coding for Students'],
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: '32x32' },
    ],
    shortcut: '/icon.svg?v=2',
    apple: '/icon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} ${chakraPetch.variable} ${pressStart2P.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('com_quest_theme');
                var accent = localStorage.getItem('com_quest_accent');

                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }

                if (accent === 'pink') {
                  document.documentElement.classList.remove('theme-cyan');
                  document.documentElement.classList.add('theme-pink');
                } else {
                  document.documentElement.classList.add('theme-cyan');
                  document.documentElement.classList.remove('theme-pink');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black relative">
        <AmbientCyberBackground />
        <div className="relative z-10 flex-1 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
