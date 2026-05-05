import React, { useState } from 'react';
import { Modal } from './Modal';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from './Button';

export function FilePreview({ url, type, title = 'File Preview' }) {
  const [isOpen, setIsOpen] = useState(false);

  const isPDF = type === 'pdf' || (url && url.toLowerCase().endsWith('.pdf'));
  const isImage = type === 'image' || (url && url.match(/\.(jpeg|jpg|gif|png)$/i));
  const isKML = type === 'kml' || (url && url.toLowerCase().endsWith('.kml'));

  if (!url) return <span className="text-slate-400 text-sm">No file available</span>;

  if (isKML) {
    return (
      <a 
        href={url} 
        download 
        target="_blank" 
        rel="noreferrer"
        className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
      >
        <Download className="w-4 h-4 mr-2 text-slate-500" />
        Download KML
      </a>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <ExternalLink className="w-4 h-4 mr-2" /> View File
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} maxWidth={isPDF ? 'max-w-5xl' : 'max-w-4xl'}>
        <div className="flex flex-col h-[70vh]">
          <div className="flex justify-end mb-4">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              download
              className="inline-flex items-center text-sm font-medium text-navy hover:text-navy-light"
            >
              <Download className="w-4 h-4 mr-1" /> Download original
            </a>
          </div>
          
          <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
            {isPDF ? (
              <iframe 
                src={`${url}#toolbar=0`} 
                className="w-full h-full border-0" 
                title={title}
              />
            ) : isImage ? (
              // Using regular img tag as requested, not next/image for preview modal due to unknown dimensions
              <img 
                src={url} 
                alt={title} 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <p className="text-slate-500 mb-4">Preview not available for this file type.</p>
                <a 
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-navy hover:bg-navy-light"
                >
                  <Download className="w-4 h-4 mr-2" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
