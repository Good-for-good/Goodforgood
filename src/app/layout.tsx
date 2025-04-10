import React from 'react';
import Navigation from '@/components/Navigation';
import './globals.css';

export const metadata = {
  title: 'Charitable Trust Management',
  description: 'A web application to manage charitable trust activities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        {children}
      </body>
    </html>
  );
} 