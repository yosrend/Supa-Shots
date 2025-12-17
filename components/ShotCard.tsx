import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImage, ProductStyle } from '../types';
import { getShotDefinition } from '../constants';
import { ImageFormat, copyToClipboard, downloadImage } from '../utils/imageUtils';

interface ShotCardProps {
  type: ProductStyle;
  data?: GeneratedImage;
  isSelected: boolean;
  onToggleSelection: () => void;
  onClick: () => void;
  onRegenerate?: () => void;
}

const ShotCard: React.FC<ShotCardProps> = ({ 
  type, 
  data, 
  isSelected, 
  onToggleSelection, 
  onClick,
  onRegenerate
}) => {
  // Definition is now pure, based on style only
  const definition = getShotDefinition(type);
  
  const isLoading = data?.isLoading;
  const isError = !!data?.error;
  const hasImage = !!data?.imageUrl;

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Track previous loading state to detect completion
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    // If we transitioned from loading=true to loading=false, and we have an image, and no error
    if (prevLoadingRef.current && !isLoading && hasImage && !isError) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2500); // Show for 2.5s
      return () => clearTimeout(timer);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, hasImage, isError]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data?.imageUrl) return;
    
    setIsCopying(true);
    await copyToClipboard(data.imageUrl);
    setTimeout(() => setIsCopying(false), 1500);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadMenu(!showDownloadMenu);
  };

  const handleDownload = async (e: React.MouseEvent, format: ImageFormat) => {
    e.stopPropagation();
    setShowDownloadMenu(false);
    if (!data?.imageUrl) return;
    
    await downloadImage(data.imageUrl, `SupaShot-${type}`, format);
  };

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegenerate) onRegenerate();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection();
  };

  return (
    <div 
      className={`group relative rounded-xl bg-slate-800 shadow-xl border transition-all duration-300 cursor-pointer aspect-[4/5]
        ${isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/20' 
          : 'border-slate-700/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
        }`}
      onClick={() => hasImage && !isLoading && onClick()}
      onMouseLeave={() => setShowDownloadMenu(false)}
    >
      {/* Inner Container for Image/Content with Clipping */}
      <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs text-indigo-400 font-medium animate-pulse">Generating...</span>
          </div>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/20 backdrop-blur-sm z-20 animate-fadeIn">
            <div className="bg-emerald-500 rounded-full p-2 shadow-lg shadow-emerald-500/30 transform animate-bounce-short">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm mt-3 shadow-black drop-shadow-md">Generated!</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4 z-10 text-center">
            <svg className="w-8 h-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-red-400">Generation Failed</span>
            {onRegenerate && (
              <button 
                onClick={handleRegenerateClick}
                className="mt-3 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {hasImage ? (
          <img 
            src={data.imageUrl} 
            alt={definition.label}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Placeholder
          !isLoading && !isError && (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center p-4 text-center">
               <span className="text-slate-600 text-xs">{definition.description}</span>
            </div>
          )
        )}

        {/* Overlay Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{definition.label}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                  {definition.emotional}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Elements (Above Clipping) */}
      
      {/* Selection Checkbox */}
      {hasImage && !isLoading && !showSuccess && (
        <div 
          className="absolute top-3 left-3 z-30"
          onClick={handleCheckboxClick}
        >
          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-indigo-600 border-indigo-600 text-white' 
              : 'bg-black/40 border-white/50 text-transparent hover:border-white'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Action Buttons (Regenerate / Copy / Download) */}
      {hasImage && !isLoading && !showSuccess && (
        <div className="absolute top-3 right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          
          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={handleRegenerateClick}
              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-indigo-600 transition-colors"
              title="Regenerate"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Copy Button */}
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-indigo-600 transition-colors relative"
            title="Copy to Clipboard"
          >
            {isCopying ? (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>

          {/* Download Button Group */}
          <div className="relative">
            <button 
              onClick={handleDownloadClick}
              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-indigo-600 transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-2 w-24 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden flex flex-col z-50">
                {(['jpg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={(e) => handleDownload(e, fmt)}
                    className="px-3 py-2 text-xs font-medium text-slate-300 hover:bg-indigo-600 hover:text-white text-left uppercase transition-colors"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShotCard;