'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Members', path: '/members' },
    { name: 'Trustees', path: '/trustees' },
    { name: 'Donations', path: '/donations' },
    { name: 'Donors', path: '/donors' },
    { name: 'Expenses', path: '/expenses' },
    { name: 'Activities', path: '/activities' },
    { name: 'Workshops', path: '/workshops' },
    { name: 'Meetings', path: '/meetings' },
    { name: 'Links', path: '/links' },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <Image
                    src="/images/logo.png"
                    alt="Good for Good Logo"
                    width={56}
                    height={56}
                    className="h-14 w-14 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-xl font-bold text-gray-900">Good for Good</span>
                  <span className="text-sm text-gray-600">Charitable Trust</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8 items-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'border-yellow-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-yellow-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} 
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${
                isActive(item.path)
                  ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 