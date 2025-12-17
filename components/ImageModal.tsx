import React, { useState, useEffect } from 'react';
import { GeneratedImage, ProductStyle } from '../types';
import { getShotDefinition } from '../constants';
import Button from './Button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GeneratedImage | null;
  productName?: string;
  onRegenerate?: (type: ProductStyle, customPrompt: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  isOpen, 
  onClose, 
  data,
  productName = 'product',
  onRegenerate
}) => {
  const [promptText, setPromptText] = useState('');
  
  // Update prompt text when data changes
  useEffect(() => {
    if (data && isOpen) {
      // Pass the stored subjectType (or default to PRODUCT if missing)
      const definition = getShotDefinition(data.shotType, data.subjectType);
      
      // Use custom prompt if it exists, otherwise use the template with productName substituted
      // Note: We use the raw promptTemplate from definition which might contain [PRODUCT]
      // if it hasn't been substituted yet in a stored customPrompt.
      const initialPrompt = data.customPrompt || definition.promptTemplate.replace(/\[PRODUCT\]/g, productName);
      setPromptText(initialPrompt);
    }
  }, [data, isOpen, productName]);

  if (!isOpen || !data) return null;

  const definition = getShotDefinition(data.shotType, data.subjectType);
  const isLoading = data.isLoading;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = data.imageUrl;
    link.download = `SupaShot-${data.shotType}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = () => {
    if (onRegenerate) {
      onRegenerate(data.shotType, promptText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-700">
        
        {/* Image Section */}
        <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4 relative group">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
               <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <span className="text-indigo-400 font-medium animate-pulse">Processing edits...</span>
            </div>
          ) : (
            <img 
              src={data.imageUrl} 
              alt={definition.label}
              className="max-w-full max-h-[60vh] md:max-h-full object-contain rounded-lg shadow-2xl" 
            />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col border-l border-slate-800 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
              {data.shotType}
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{definition.label}</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {definition.description}
          </p>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Emotional Impact</h4>
              <p className="text-sm text-indigo-300">{definition.emotional}</p>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">AI Edit Command</h4>
                 <span className="text-[10px] text-slate-500">Modify this shot</span>
               </div>
               <textarea 
                 className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-300 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y min-h-[120px]"
                 value={promptText}
                 onChange={(e) => setPromptText(e.target.value)}
                 placeholder="E.g., Add a retro filter, remove the background, make it brighter..."
                 disabled={isLoading}
               />
               <div className="mt-2 flex justify-end">
                 <Button 
                   size="sm" 
                   variant="secondary"
                   onClick={handleEditClick} 
                   disabled={isLoading}
                   className="text-xs"
                 >
                   <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                   </svg>
                   Edit Image
                 </Button>
               </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
             <Button variant="primary" size="lg" onClick={handleDownload} className="w-full" disabled={isLoading}>
               <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Download Shot
             </Button>
             <Button variant="outline" size="md" onClick={onClose} className="w-full">
               Close Viewer
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;