import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AQM Impact Lab',
  description: 'AI-assisted city-budget simulation for HackAlemAI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
