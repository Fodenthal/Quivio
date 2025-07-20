"use client";

// Single Difficulty Slider Component
export const DifficultySlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  getDifficultyLabel: (diff: number) => string;
  className?: string;
}> = ({ value, onChange, getDifficultyLabel, className = "" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  const getSliderBackground = (val: number) => {
    const percent = ((val - 1) / 4) * 100;
    return `linear-gradient(to right, 
      #6366f1 0%, 
      #6366f1 ${percent}%, 
      #e5e7eb ${percent}%, 
      #e5e7eb 100%)`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <style jsx>{`
        .difficulty-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
        }
        
        .difficulty-slider::-webkit-slider-thumb {
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
        
        .difficulty-slider::-webkit-slider-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-slider::-moz-range-thumb {
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
        
        .difficulty-slider::-moz-range-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-slider::-moz-range-track {
          background: transparent;
          border: none;
        }
        
        .difficulty-slider:focus {
          outline: none;
        }
        
        .difficulty-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">
          {getDifficultyLabel(value)}
        </span>
      </div>
      
      <div className="relative">
        {/* Track background */}
        <div 
          className="w-full h-2 rounded-lg"
          style={{ background: getSliderBackground(value) }}
        />
        
        {/* Single slider */}
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={handleChange}
          className="difficulty-slider absolute inset-0 w-full h-2 bg-transparent rounded-lg"
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