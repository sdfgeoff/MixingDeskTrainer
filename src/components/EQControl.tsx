import React, { useCallback, useEffect } from 'react';

interface EQControlProps {
  value: number;
  min: number;
  max: number;
  onChange: (newVal: number) => void;
}

const EQControl: React.FC<EQControlProps> = ({ value, min, max,  onChange }) => {

  // const [clickLocation, setClickLocation] = React.useState<[number, number] | null>(null);

  const setValue = (val: number) => {
    if (val < min) {
      onChange(min);
    } else if (val > max) {
      onChange(max);
    } else {
      onChange(val);
    }
  }

  // const onScroll = useCallback((e: WheelEvent) => {
  //   e.preventDefault();
  //   setValue(value - e.deltaY * (max-min) / 1000);
  // }, [setValue])


  // const [scrollDiv, setScrollDiv] = React.useState<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   // DO things this way because wheel is a passive event,so will preventDefault doesn't work
  //   if (scrollDiv) {
  //     scrollDiv.addEventListener('wheel', onScroll, {passive: false});
  //     return () => {
  //       scrollDiv.removeEventListener('wheel', onScroll);
  //     }
  //   }
  // }, [scrollDiv, onScroll])

  
  return (<>
    <input type="range" min={min} max={max} step={(max-min) / 1000.0} value={value} onChange={(e) => setValue(parseFloat(e.target.value))} />
    {/* <div
      ref={setScrollDiv}
      onMouseDown={(e) => {
        e.preventDefault();
        setClickLocation([e.pageX, e.pageY]);
      }}
      onMouseMove={(e) => {
        e.preventDefault()
        if (clickLocation) {
          console.log(e)
          setValue(value + (e.pageX - clickLocation[0]) * (max - min) / 100);
          setClickLocation([e.pageX, e.pageY]);
        }
      }}
      onMouseUp={(e) => {
        setClickLocation(null);
      }}
      onMouse
      style={{
        backgroundColor: 'blue'
      }}
    >
      <img src="knob.png" style={{
        width: '3em',
        height: '3em',
        transform: `rotate(${(value - min) / (max - min) * 270 - 135}deg)`,
        pointerEvents: 'none',
      }}
        
      />
    </div> */}
  </>
  );
};

export default EQControl;
