import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ currentPage, totalPages, totalItems, limit, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = ((currentPage - 1) * limit) + 1;
  const end = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-border">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">
            Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-r-none border-r-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Simple windowing logic
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${currentPage === page 
                        ? 'z-10 bg-navy text-white border-navy' 
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 || 
                page === currentPage + 2
              ) {
                return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">...</span>;
              }
              return null;
            })}

            <Button
              variant="secondary"
              size="sm"
              className="rounded-l-none border-l-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
