"use client";

// Difficulty Range Slider Component
export const DifficultyRangeSlider: React.FC<{
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  getDifficultyLabel: (diff: number) => string;
  className?: string;
  disabled?: boolean;
}> = ({ minValue, maxValue, onChange, getDifficultyLabel, className = "", disabled = false }) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      const newMin = parseInt(e.target.value);
      const newMax = Math.max(newMin, maxValue);
      onChange(newMin, newMax);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      const newMax = parseInt(e.target.value);
      const newMin = Math.min(newMax, minValue);
      onChange(newMin, newMax);
    }
  };

  const getSliderBackground = (min: number, max: number) => {
    const minPercent = ((min - 1) / 4) * 100;
    const maxPercent = ((max - 1) / 4) * 100;
    return `linear-gradient(to right, 
      #e5e7eb 0%, 
      #e5e7eb ${minPercent}%, 
      #6366f1 ${minPercent}%, 
      #6366f1 ${maxPercent}%, 
      #e5e7eb ${maxPercent}%, 
      #e5e7eb 100%)`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <style jsx>{`
        .difficulty-range-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
        }
        
        .difficulty-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.15s ease-in-out;
          pointer-events: auto;
        }
        
        .difficulty-range-slider::-webkit-slider-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-range-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.15s ease-in-out;
          border: none;
          pointer-events: auto;
        }
        
        .difficulty-range-slider::-moz-range-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-range-slider::-moz-range-track {
          background: transparent;
          border: none;
        }
        
        .difficulty-range-slider:focus {
          outline: none;
        }
        
        .difficulty-range-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">
          {getDifficultyLabel(minValue)} - {getDifficultyLabel(maxValue)}
        </span>
      </div>
      
      <div className="relative">
        {/* Track background */}
        <div 
          className="w-full h-2 rounded-lg"
          style={{ background: getSliderBackground(minValue, maxValue) }}
        />
        
        {/* Min slider */}
        <input
          type="range"
          min="1"
          max="5"
          value={minValue}
          onChange={handleMinChange}
          disabled={disabled}
          className={`difficulty-range-slider absolute inset-0 w-full h-2 bg-transparent rounded-lg ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
        />
        
        {/* Max slider */}
        <input
          type="range"
          min="1"
          max="5"
          value={maxValue}
          onChange={handleMaxChange}
          disabled={disabled}
          className={`difficulty-range-slider absolute inset-0 w-full h-2 bg-transparent rounded-lg ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-text-secondary px-0.5">
        <span className="text-center">VE</span>
        <span className="text-center">E</span>
        <span className="text-center">M</span>
        <span className="text-center">H</span>
        <span className="text-center">VH</span>
      </div>
    </div>
  );
}; 