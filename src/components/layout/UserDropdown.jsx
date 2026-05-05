"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User as UserIcon, LogOut, Key } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/constants/roles';

export function UserDropdown({ mobile = false }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (!mobile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobile]);

  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  if (mobile) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-saffron text-white flex items-center justify-center font-bold">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">{user.name}</p>
          <p className="text-blue-300 text-sm">{ROLE_LABELS[user.role]}</p>
        </div>
        <button onClick={logout} className="p-2 text-blue-200 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none group"
      >
        <div className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center font-bold text-sm ring-2 ring-transparent group-hover:ring-blue-300 transition-all">
          {initials}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
          <p className="text-xs text-blue-200">{ROLE_LABELS[user.role]}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 focus:outline-none z-50">
          <div className="px-4 py-3">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <UserIcon className="w-4 h-4 mr-2 text-slate-400" /> My Profile
            </button>
            <button className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <Key className="w-4 h-4 mr-2 text-slate-400" /> Change Password
            </button>
          </div>
          <div className="py-1">
            <button 
              onClick={logout}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2 text-red-500" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
