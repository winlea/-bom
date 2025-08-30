import React from 'react';
import './globals.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
