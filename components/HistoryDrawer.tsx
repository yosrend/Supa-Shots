import React, { useEffect, useState } from 'react';
import { ProjectHistory } from '../types';
import { getAllProjects, deleteProject } from '../services/historyService';
import Button from './Button';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: ProjectHistory) => void;
  currentProjectId: string | null;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onLoadProject,
  currentProjectId 
}) => {
  const [projects, setProjects] = useState<ProjectHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    const data = await getAllProjects();
    setProjects(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
      await fetchProjects();
    }
  };

  const handleSelect = (project: ProjectHistory) => {
    onLoadProject(project);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white">History</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No history yet.</p>
              <p className="text-xs mt-2">Generate some shots to see them here.</p>
            </div>
          ) : (
            projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => handleSelect(project)}
                className={`group relative bg-slate-800 rounded-xl p-3 cursor-pointer border transition-all duration-200 hover:border-indigo-500 hover:shadow-lg ${
                  currentProjectId === project.id 
                    ? 'border-indigo-500 ring-1 ring-indigo-500' 
                    : 'border-slate-700'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                    <img 
                      src={project.sourceImage} 
                      alt="Source" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-white truncate pr-6">
                        {project.productName}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(project.timestamp).toLocaleDateString()} • {new Date(project.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase font-medium">
                         {project.subjectType === 'human' ? 'Person' : 'Product'}
                       </span>
                       <span className="text-[10px] text-slate-500">
                         {Object.keys(project.generatedShots).length} shots
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 text-center text-xs text-slate-500">
          History is saved locally in your browser.
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;