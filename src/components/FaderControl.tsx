import React from "react";

interface FaderControlProps {
  value: number;
  min: number;
  max: number;
  onChange: (newVal: number) => void;
  logScale?: boolean;
}

const FaderControl: React.FC<FaderControlProps> = ({
  value,
  min,
  max,
  logScale,
  onChange,
}) => {
  const setValue = (rawVal: number) => {
    const val = logScale ? Math.pow(10, rawVal) : rawVal;
    if (val < min) {
      onChange(min);
    } else if (val > max) {
      onChange(max);
    } else {
      onChange(val);
    }
  };

  const derivedVal = logScale ? Math.log10(value) : value;
  const logMinFreq = logScale ? Math.log10(min) : min;
  const logMaxFreq = logScale ? Math.log10(max) : max;
  const stepSize = (logMaxFreq - logMinFreq) / 1000.0;

  return (
    <>
      <input
        style={{ height: "20em", writingMode: "vertical-lr", direction: "rtl" }}
        type="range"
        min={logMinFreq}
        max={logMaxFreq}
        step={stepSize}
        value={derivedVal}
        onChange={(e) => setValue(parseFloat(e.target.value))}
      />
    </>
  );
};

export default FaderControl;
