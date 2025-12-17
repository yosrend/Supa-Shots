import React, { useState } from 'react';
import { GeneratedImage, ProductStyle, SubjectType, AspectRatio, ProjectHistory } from './types';
import { PRODUCT_STYLES, HUMAN_STYLES, ASPECT_RATIOS, getShotDefinition } from './constants';
import { generateShot, analyzeProduct, editShot } from './services/geminiService';
import { saveProject } from './services/historyService';
import { downloadBulkImages, ImageFormat } from './utils/imageUtils';
import UploadArea from './components/UploadArea';
import ShotCard from './components/ShotCard';
import ImageModal from './components/ImageModal';
import Button from './components/Button';
import SubjectTypeSelector from './components/SubjectTypeSelector';
import HistoryDrawer from './components/HistoryDrawer';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  
  const [productName, setProductName] = useState<string>('product');
  const [productDescription, setProductDescription] = useState<string>(''); 
  const [productCategory, setProductCategory] = useState<string>('');
  const [subjectType, setSubjectType] = useState<SubjectType>(SubjectType.PRODUCT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  
  const [generatedShots, setGeneratedShots] = useState<Record<string, GeneratedImage>>({});
  const [selectedShot, setSelectedShot] = useState<GeneratedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Selection state for bulk actions
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Warning state for bad photo input
  const [detectionWarning, setDetectionWarning] = useState<string | null>(null);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Determine which set of styles to display/generate based on current subject mode
  const activeStyles = subjectType === SubjectType.HUMAN ? HUMAN_STYLES : PRODUCT_STYLES;

  const handleImageSelect = async (base64: string) => {
    setSourceImage(base64);
    setGeneratedShots({});
    setSelectedShotIds(new Set());
    // New image means new project
    setCurrentProjectId(null);
    // Default to product initially, user can switch to Human
    setSubjectType(SubjectType.PRODUCT);
    setDetectionWarning(null); 
    
    // Start detection
    setIsDetecting(true);
    try {
      const analysis = await analyzeProduct(base64);
      setProductName(analysis.productName);
      setProductDescription(analysis.description); 
      setProductCategory(analysis.category);

      // Check for human framing issues
      if (analysis.isHuman) {
        // If system detects human but framing is bad
        if (analysis.framingQuality === 'too_far') {
          setDetectionWarning("Subject appears too far away. For best portrait results, use a closer shot.");
        } else if (analysis.framingQuality === 'cut_off') {
           setDetectionWarning("Subject's face or key features appear cut off. Please use a well-framed photo.");
        } else if (analysis.framingQuality === 'empty') {
           setDetectionWarning("No clear subject detected. Please try another photo.");
        }
      }
    } catch (e) {
      console.error("Analysis error", e);
    } finally {
      setIsDetecting(false);
    }
  };

  const saveToHistory = async (shots: Record<string, GeneratedImage>, pid: string | null) => {
    if (!sourceImage) return;

    const projectId = pid || Date.now().toString();
    const project: ProjectHistory = {
      id: projectId,
      timestamp: Date.now(),
      sourceImage,
      productName,
      productDescription,
      productCategory,
      subjectType,
      generatedShots: shots
    };
    
    await saveProject(project);
    if (!pid) {
      setCurrentProjectId(projectId);
    }
    return projectId;
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;

    setIsGenerating(true);
    setSelectedShotIds(new Set());
    
    // Establish Project ID if not exists
    let activeProjectId = currentProjectId;
    if (!activeProjectId) {
      activeProjectId = Date.now().toString();
      setCurrentProjectId(activeProjectId);
    }

    // Use the styles corresponding to the currently selected mode
    const targetShots = activeStyles;
    
    // Initialize loading states for the active styles
    const initialShots: Record<string, GeneratedImage> = {};
    targetShots.forEach(type => {
      initialShots[type] = {
        id: `${type}-${Date.now()}`,
        shotType: type,
        imageUrl: '',
        isLoading: true,
        timestamp: Date.now(),
        subjectType: subjectType // Store the type used
      };
    });
    // Replace current shots with new set (clears old mode's shots)
    setGeneratedShots(initialShots);

    // Process shots
    const queue = [...targetShots];
    // Reduce concurrency to 1 to avoid rate limits
    const CONCURRENCY = 1;

    const processQueue = async () => {
      if (queue.length === 0) return;

      const batch = queue.splice(0, CONCURRENCY);
      
      const promises = batch.map(async (type) => {
        try {
          const definition = getShotDefinition(type, subjectType);
          
          // Pass productDescription to generation
          const imageUrl = await generateShot(sourceImage, definition, productName, productDescription, aspectRatio);
          
          setGeneratedShots(prev => {
            const next = {
              ...prev,
              [type]: {
                ...prev[type],
                imageUrl: imageUrl,
                isLoading: false
              }
            };
            return next;
          });
        } catch (error) {
          console.error(error);
          setGeneratedShots(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              isLoading: false,
              error: 'Failed to generate'
            }
          }));
        }
      });

      await Promise.all(promises);

      // Add a small delay between requests to be nice to the API
      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await processQueue();
    };

    try {
      await processQueue();
      // Save history after batch completes
      // We need to access the latest state, using callback in setGeneratedShots is tricky for side effects
      // So we will pass the current state to the saver, but we need the LATEST state.
      // A simple way is to use a ref or just rely on React's state update queue. 
      // Safest is to wait a tick or just save what we have. 
      // Actually, since processQueue awaits state updates (indirectly), we can grab state via a functional update wrapper or just use the result of the process.
      // Better approach for simplicity: Call save inside the setGeneratedShots callback? No.
      // Let's just re-read state? No, closure.
      // We will rely on the fact that we updated the state locally in this closure's references if we tracked it, but we didn't.
      // Let's use a functional update to trigger the save.
      setGeneratedShots(finalShots => {
        saveToHistory(finalShots, activeProjectId);
        return finalShots;
      });

    } catch (e) {
      console.error("Batch processing error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Editing (Regenerating using Imagen 3 with modified prompt)
  const handleEditShot = async (type: ProductStyle, customPrompt: string) => {
    const currentShot = generatedShots[type];
    if (!currentShot || !currentShot.imageUrl) return;

    // Set loading state
    setGeneratedShots(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        isLoading: true,
        error: undefined
      }
    }));

    try {
      const definition = getShotDefinition(type, subjectType);
      
      // Use editShot which now uses Imagen 3 regeneration
      const imageUrl = await editShot(
        productName, 
        productDescription, 
        definition, 
        customPrompt, 
        aspectRatio
      );

      const updatedShot: GeneratedImage = {
        ...currentShot,
        imageUrl: imageUrl,
        isLoading: false,
        timestamp: Date.now(),
        customPrompt: customPrompt
      };

      setGeneratedShots(prev => {
        const next = {
          ...prev,
          [type]: updatedShot
        };
        // Auto-save on edit
        saveToHistory(next, currentProjectId);
        return next;
      });

      // Update modal if open
      if (selectedShot && selectedShot.shotType === type) {
        setSelectedShot(updatedShot);
      }

    } catch (error) {
      console.error(`Error editing ${type}:`, error);
      setGeneratedShots(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isLoading: false,
          error: 'Edit failed'
        }
      }));
    }
  };

  const handleShotClick = (shot: GeneratedImage) => {
    setSelectedShot(shot);
    setIsModalOpen(true);
  };

  const toggleShotSelection = (type: string) => {
    const newSelection = new Set(selectedShotIds);
    if (newSelection.has(type)) {
      newSelection.delete(type);
    } else {
      newSelection.add(type);
    }
    setSelectedShotIds(newSelection);
  };

  const handleSelectAll = () => {
    // Only select currently visible/active styles that have been generated
    const activeIds = Object.keys(generatedShots).filter(key => activeStyles.includes(key as ProductStyle));
    setSelectedShotIds(new Set(activeIds));
  };

  const handleBulkDownload = async (format: ImageFormat) => {
    const shotsToDownload = (Object.values(generatedShots) as GeneratedImage[]).filter(
      shot => selectedShotIds.has(shot.shotType) && shot.imageUrl
    );
    
    if (shotsToDownload.length === 0) return;

    setIsDownloading(true);
    try {
      await downloadBulkImages(shotsToDownload, format, `SupaShots-Product-${Date.now()}`);
    } catch (e) {
      console.error("Bulk download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setGeneratedShots({});
    setSelectedShotIds(new Set());
    setIsGenerating(false);
    setProductName('product');
    setProductDescription('');
    setProductCategory('');
    setSubjectType(SubjectType.PRODUCT);
    setDetectionWarning(null);
    setCurrentProjectId(null);
  };

  const handleLoadProject = (project: ProjectHistory) => {
    setSourceImage(project.sourceImage);
    setProductName(project.productName);
    setProductDescription(project.productDescription);
    setProductCategory(project.productCategory);
    setSubjectType(project.subjectType);
    setGeneratedShots(project.generatedShots);
    setCurrentProjectId(project.id);
    setSelectedShotIds(new Set());
    setDetectionWarning(null);
    setIsDetecting(false);
    setIsGenerating(false);
  };

  const hasGeneratedShots = Object.keys(generatedShots).length > 0;
  const completedShotsCount = Object.values(generatedShots).filter((s: GeneratedImage) => !s.isLoading).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-indigo-500 selection:text-white pb-24">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform -rotate-6">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-400">
              Supa Shots <span className="text-white/60 font-light text-sm ml-1">AI Studio</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
             <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
               <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               History
             </Button>
             
             {sourceImage && (
               <Button variant="secondary" size="sm" onClick={handleReset} disabled={isGenerating}>
                 New
               </Button>
             )}
             <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-xs text-slate-500 hover:text-indigo-400 transition-colors ml-2">
               Powered by Gemini
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!sourceImage ? (
          // Empty State / Upload
          <div className="max-w-2xl mx-auto mt-20">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Premium AI Photography
              </h2>
              <p className="text-lg text-slate-400">
                Transform a single photo into 9 editorial-style marketing assets.
                Optimized for luxury e-commerce and high-end campaigns.
              </p>
            </div>
            <UploadArea onImageSelected={handleImageSelect} />
            {isDetecting && (
               <div className="mt-8 text-center text-indigo-400 animate-pulse">
                 Analyzing image structure...
               </div>
            )}
          </div>
        ) : (
          // Workspace
          <div className="space-y-8">
            
            {/* Warning Alert */}
            {detectionWarning && (
              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 flex items-start space-x-3 animate-fadeIn">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-400">Photo Quality Warning</h3>
                  <p className="text-sm text-amber-200/80 mt-1">{detectionWarning}</p>
                </div>
                <button 
                  onClick={() => setDetectionWarning(null)}
                  className="text-amber-400 hover:text-amber-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Controls Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SubjectTypeSelector 
                selectedType={subjectType} 
                onSelect={(type) => {
                  setSubjectType(type);
                  if (type !== subjectType) setGeneratedShots({});
                }} 
                confidence={isDetecting ? 0 : 0.9}
              />
              
              <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-4 mb-8">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Aspect Ratio</h3>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-2 rounded-md text-xs font-mono font-medium transition-all duration-200 border ${
                        aspectRatio === ratio
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Bar: Source + Controls */}
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center gap-6">
              <div className="relative group w-32 h-32 flex-shrink-0">
                <img 
                  src={sourceImage} 
                  alt="Source" 
                  className="w-full h-full object-cover rounded-lg shadow-lg border border-slate-600 group-hover:border-indigo-500 transition-colors"
                />
                <span className="absolute -bottom-2 -right-2 bg-slate-700 text-xs px-2 py-1 rounded-full border border-slate-600 text-slate-300">
                  Source
                </span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-white">
                  {isDetecting ? 'Analyzing...' : `Detected: ${productName}`}
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-xl">
                  {isDetecting 
                    ? "Identifying features and materials..." 
                    : `Ready to generate 9 premium editorial styles for this ${subjectType === SubjectType.HUMAN ? 'person' : (productCategory || 'product')}.`
                  }
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end gap-3">
                {!hasGeneratedShots ? (
                   <Button variant="primary" size="lg" onClick={handleGenerate} className="shadow-lg shadow-indigo-500/20" disabled={isDetecting}>
                     <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                     </svg>
                     Generate Campaign
                   </Button>
                ) : (
                  <>
                    <div className="flex flex-col items-end w-full">
                       <span className="text-sm font-medium text-indigo-400 mb-2">
                         {isGenerating ? 'Processing...' : 'Generation Complete'}
                       </span>
                       <div className="w-32 bg-slate-700 rounded-full h-2">
                         <div 
                           className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                           style={{ 
                             width: `${(completedShotsCount / 9) * 100}%` 
                           }}
                         />
                       </div>
                    </div>
                    
                    {!isGenerating && (
                      <Button variant="secondary" size="sm" onClick={handleGenerate} className="w-full">
                         <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                         </svg>
                         Regenerate All
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Grid Header & Select All */}
            {hasGeneratedShots && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Generated Assets</h2>
                <div className="flex items-center gap-3">
                   <Button variant="outline" size="sm" onClick={handleSelectAll}>
                     Select All
                   </Button>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStyles.map((type) => (
                <ShotCard 
                  key={type} 
                  type={type} 
                  data={generatedShots[type]}
                  isSelected={selectedShotIds.has(type)}
                  onToggleSelection={() => toggleShotSelection(type)}
                  onClick={() => generatedShots[type] && handleShotClick(generatedShots[type])}
                  // onRegenerate from ShotCard triggers Edit mode logic essentially
                  onRegenerate={() => handleEditShot(type, generatedShots[type]?.customPrompt || '')}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bulk Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 z-50 ${
        selectedShotIds.size > 0 ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-2xl mx-auto bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 px-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              {selectedShotIds.size}
            </span>
            <span className="text-white font-medium">Selected</span>
            <button 
              onClick={() => setSelectedShotIds(new Set())}
              className="text-slate-400 hover:text-white text-sm underline"
            >
              Clear
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-sm mr-2 hidden sm:inline">Download as:</span>
            {(['jpg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
              <Button 
                key={fmt}
                variant="secondary" 
                size="sm"
                onClick={() => handleBulkDownload(fmt)}
                disabled={isDownloading}
                className="uppercase"
              >
                {fmt}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ImageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedShot}
        productName={productName}
        onRegenerate={handleEditShot}
      />
      
      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadProject={handleLoadProject}
        currentProjectId={currentProjectId}
      />
    </div>
  );
};

export default App;