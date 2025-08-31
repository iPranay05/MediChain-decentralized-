'use client';

import { Web3Provider } from '../context/Web3Context';
import Navigation from './Navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <Web3Provider>{children}</Web3Provider>
    </div>
  );
}
