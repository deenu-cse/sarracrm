import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useUI } from '@/contexts/UIContext';

export function FileUpload({ label, accept = "image/*,application/pdf", multiple = false, maxFiles = 5, maxSizeMB = 5, onUploadSuccess, existingFiles = [] }) {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useUI();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (newFiles) => {
    if (!multiple && files.length > 0) {
      addToast("You can only upload 1 file here.", "warning");
      return;
    }
    
    if (files.length + newFiles.length > maxFiles) {
      addToast(`Maximum ${maxFiles} files allowed.`, "warning");
      return;
    }

    const validFiles = newFiles.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        addToast(`${file.name} exceeds ${maxSizeMB}MB limit.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      validFiles.forEach(f => formData.append('files', f));
      
      const res = await apiCall('/upload', { method: 'POST', body: formData });
      
      if (res?.success && res.data) {
        // res.data should be array of uploaded file objects { url, public_id, originalName, format }
        const newUploaded = res.data.map(f => ({
          url: f.url,
          name: f.originalName || 'Uploaded File',
          type: f.format === 'pdf' ? 'pdf' : (f.format === 'kml' ? 'kml' : 'image')
        }));
        
        const combined = multiple ? [...files, ...newUploaded] : newUploaded;
        setFiles(combined);
        if (onUploadSuccess) onUploadSuccess(multiple ? combined : combined[0]);
      } else {
        addToast(res?.message || 'Upload failed', 'error');
      }
    } catch (e) {
      addToast('Error uploading files', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (onUploadSuccess) onUploadSuccess(multiple ? newFiles : null);
  };

  return (
    <div className="mb-6">
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      
      {(!files.length || multiple) && (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive ? 'border-navy bg-blue-50' : 'border-slate-300 hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className={`w-10 h-10 ${uploading ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
            {uploading ? (
              <p className="text-sm font-medium text-slate-700">Uploading...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-navy">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  {accept.replace(/\./g, '').toUpperCase()} (Max. {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                {file.type === 'pdf' ? (
                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                    <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name || file.description || `File ${i+1}`}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
