import React from 'react';
import { SubjectType } from '../types';
import { SUBJECT_CONFIGS } from '../constants';

interface SubjectTypeSelectorProps {
  selectedType: SubjectType;
  onSelect: (type: SubjectType) => void;
  confidence?: number;
}

const SubjectTypeSelector: React.FC<SubjectTypeSelectorProps> = ({
  selectedType,
  onSelect,
  confidence,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Subject Analysis</h3>
          {confidence && confidence > 0 && (
             <p className="text-xs text-indigo-400 mt-1">
               AI Detection Confidence: {Math.round(confidence * 100)}%
             </p>
          )}
        </div>
        
        <div className="flex bg-slate-900 rounded-lg p-1 overflow-x-auto">
          {(Object.keys(SUBJECT_CONFIGS) as SubjectType[]).map((type) => {
            if (type === SubjectType.UNKNOWN) return null;
            
            const isSelected = selectedType === type;
            const config = SUBJECT_CONFIGS[type];
            
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>
                  {type === SubjectType.HUMAN && '👤'}
                  {type === SubjectType.PRODUCT && '📦'}
                  {type === SubjectType.MIXED && '🛍️'}
                </span>
                <span>{config.uiLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Active Mode: </strong> 
          {SUBJECT_CONFIGS[selectedType].recommendations.join('. ')}.
        </p>
      </div>
    </div>
  );
};

export default SubjectTypeSelector;