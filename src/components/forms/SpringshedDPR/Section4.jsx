import React from 'react';
import { FileUpload } from '../shared/FileUpload';
import { FloatInput } from '../shared/FloatInput';

export default function Section4({ data, onChange, errors }) {
  // data is array of photos { url, name, description }
  
  const handleUploadSuccess = (uploadedFiles) => {
    const currentData = Array.isArray(data) ? data : [];
    // uploadedFiles can be array or single object depending on multiple prop
    const newFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    onChange([...currentData, ...newFiles.map(f => ({ url: f.url, name: f.name, description: '' }))]);
  };

  const handleDescriptionChange = (index, desc) => {
    const newData = [...data];
    newData[index] = { ...newData[index], description: desc };
    onChange(newData);
  };

  const removePhoto = (index) => {
    const newData = [...data];
    newData.splice(index, 1);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">4. Photographs</h2>
        <p className="text-sm text-slate-500 mt-1">Upload clear photos of the spring, source area, and surrounding catchment. Minimum 2 photos required.</p>
      </div>

      <FileUpload 
        label="Upload Photos (Max 5)" 
        accept="image/*" 
        multiple={true} 
        maxFiles={5}
        onUploadSuccess={handleUploadSuccess} 
      />

      {errors?.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}

      {Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {data.map((photo, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
              <div className="relative aspect-video bg-slate-100">
                <img src={photo.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex-1">
                <FloatInput
                  id={`photo-desc-${index}`}
                  label="Description / Caption"
                  value={photo.description || ''}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  placeholder="E.g. View of spring source"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
