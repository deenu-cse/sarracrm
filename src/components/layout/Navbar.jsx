"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { NavLinks } from './NavLinks';
import { UserDropdown } from './UserDropdown';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-navy sticky top-0 z-40 h-16 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-none tracking-wide">SARRA</span>
                <span className="text-blue-200 text-[10px] uppercase tracking-wider font-medium mt-0.5">CRM Portal</span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop NavLinks */}
          <div className="hidden md:block">
            <NavLinks />
          </div>

          {/* Right: User actions */}
          <div className="hidden md:flex items-center gap-4">
            <NotificationBell />
            <UserDropdown />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-4">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-navy-light focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-light border-t border-blue-800 shadow-xl absolute w-full">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks mobile onClick={() => setMobileMenuOpen(false)} />
          </div>
          <div className="pt-4 pb-3 border-t border-blue-800">
            <div className="px-5">
              <UserDropdown mobile />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
