"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <UIContext.Provider value={{ toasts, addToast, removeToast, globalLoading, setGlobalLoading }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded shadow-lg text-white flex items-center justify-between min-w-[250px] ${t.type === 'success' ? 'bg-success' : t.type === 'error' ? 'bg-danger' : t.type === 'warning' ? 'bg-warning' : 'bg-navy'}`}>
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-4 text-white/80 hover:text-white">&times;</button>
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
