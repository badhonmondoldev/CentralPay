import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CentralPay MAX - Personal Payment Infrastructure',
  description: 'Private multi-application payment orchestration and SMS verification core.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <Navigation>{children}</Navigation>
      </body>
    </html>
  );
}
