import React from 'react';

interface EQControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (newVal: number) => void;
}

const EQControl: React.FC<EQControlProps> = ({ value, min, max, step = 1, onChange }) => {
  return (<>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    {value}
  </>
  );
};

export default EQControl;
