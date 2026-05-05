import React, { useState } from 'react';
import { Modal } from '../ui/Modal';

export function PhotoGallery({ photos = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return <div className="text-slate-400 text-center py-8">No photos uploaded for this section.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img 
              src={photo.url} 
              alt={photo.description || `Photo ${index + 1}`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                <p className="text-white text-xs truncate">{photo.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
        title={selectedPhoto?.description || "Photo Preview"}
        maxWidth="max-w-4xl"
      >
        {selectedPhoto && (
          <div className="flex justify-center items-center h-[60vh] bg-slate-900 rounded-lg overflow-hidden">
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.description || "Preview"} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
