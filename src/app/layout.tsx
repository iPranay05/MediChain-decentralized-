import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '../context/Web3Context';
import Navigation from '../components/Navigation';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MediChain Healthcare',
  description: 'A secure and transparent healthcare records management system built on the Avalanche blockchain.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-100">
            <Navigation />
            <Web3Provider>{children}</Web3Provider>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
