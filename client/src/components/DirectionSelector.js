import React from 'react';

const DirectionSelector = ({ direction, onDirectionChange }) => {
  const directions = [
    { src: 'de', tgt: 'fr', label: '🇩🇪 → 🇫🇷' },
    { src: 'fr', tgt: 'de', label: '🇫🇷 → 🇩🇪' }
  ];

  return (
    <div className="direction-selector">
      {directions.map((dir) => (
        <button
          key={`${dir.src}-${dir.tgt}`}
          className={`direction-btn ${direction.src === dir.src ? 'active' : ''}`}
          onClick={() => onDirectionChange({ src: dir.src, tgt: dir.tgt })}
        >
          {dir.label}
        </button>
      ))}
    </div>
  );
};

export default DirectionSelector;
