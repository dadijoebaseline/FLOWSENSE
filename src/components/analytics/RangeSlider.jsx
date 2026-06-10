import React, { useState, useEffect } from 'react';

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toLocaleString(),
  unit = '',
  disabled = false,
}) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const handleMinChange = (e) => {
    const newMin = Number(e.target.value);
    if (newMin <= localMax) {
      setLocalMin(newMin);
      onChange([newMin, localMax]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = Number(e.target.value);
    if (newMax >= localMin) {
      setLocalMax(newMax);
      onChange([localMin, newMax]);
    }
  };

  const range = max - min || 1;
  const minPercent = ((localMin - min) / range) * 100;
  const maxPercent = ((localMax - min) / range) * 100;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-400">
            {formatValue(localMin)} {unit}
          </span>
          <span className="text-xs text-slate-400">
            {formatValue(localMax)} {unit}
          </span>
        </div>
      </div>

      <div className="relative h-8 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
        {/* Track */}
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 pointer-events-none"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          disabled={disabled}
          className="absolute w-full h-full top-0 left-0 appearance-none bg-transparent pointer-events-none z-10 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:rounded [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-blue-400 [&::-moz-range-thumb]:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          disabled={disabled}
          className="absolute w-full h-full top-0 left-0 appearance-none bg-transparent pointer-events-none z-11 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-cyan-400 [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-cyan-400 [&::-moz-range-thumb]:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
