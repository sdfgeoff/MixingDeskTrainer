import React from 'react';
import { EQBand } from './MixerModel';


export const COLORS = [
    "#00FF00",
    "#00EEEE",
    "#3333FF",
    "#FF0000"
]


const MIN_FREQ = 30
const MAX_FREQ = 20000
const MIN_GAIN = -12
const MAX_GAIN = 12

const FREQ_RANGE = MAX_FREQ - MIN_FREQ
const GAIN_RANGE = MAX_GAIN - MIN_GAIN

const PIXELS_X = 640
const PIXELS_Y = 320

const evaluateBiquad = (band: EQBand, freq: number) => {
    const distance = Math.abs(band.frequency - freq)
    const gain = band.gain
    const q = band.q
    
    // We just want it to look about right
    return gain * Math.exp(-distance / q / 1000.0)
}


interface EQViewProps {
    bands: EQBand[]
}

const EQView: React.FC<EQViewProps> = ({bands}) => {

    const parametersWithColors = React.useMemo(() => {
        return bands.map((p, i) => ({
            ...p,
            color: COLORS[i % COLORS.length]
        }))
    }, [bands])

    const frequencyPoints = React.useMemo(() => {
        const points = []
        const SAMPLES =  PIXELS_X / 8
        for (let i = 0; i < SAMPLES; i++) {
            points.push(MIN_FREQ + (MAX_FREQ - MIN_FREQ) * i / SAMPLES)
        }
        return points
    }, [])


    const parametersWithSamples = React.useMemo(() => {
        return parametersWithColors.map(p => ({
            ...p,
            samples: frequencyPoints.map(f => evaluateBiquad(p, f))
        }))
    }, [parametersWithColors, frequencyPoints])

    const freqToX = (freq: number) => {
        return (freq - MIN_FREQ) / FREQ_RANGE * PIXELS_X
    }

    const gainToY = (gain: number) => {
        return (-gain - MIN_GAIN) / GAIN_RANGE * PIXELS_Y
    }

    const totalResponse = React.useMemo(() => {
        return frequencyPoints.map((f, i) => parametersWithSamples.reduce((acc, p) => acc + p.samples[i], 0))
    }, [parametersWithSamples, frequencyPoints])


  return (
    <div>
      <h1>EQ Visualizer</h1>
      <svg viewBox={`0 0 ${PIXELS_X} ${PIXELS_Y}`} width={PIXELS_X} height={PIXELS_Y} style={{border: "1px solid black", background: "black"}}>

        {parametersWithSamples.map((p, i) => {
            // Box at freq/gain
            return <rect x={freqToX(p.frequency) - 1} y={gainToY(p.gain) - 1} width={4} height={4} stroke={p.color} strokeWidth={2}/>
        })}
        {parametersWithSamples.map((p, i) => {
            // Bar chart at each sample
            return p.samples.map((s, j) => {
                const gainY = gainToY(s)
                if (s > 0) {
                    return <rect x={freqToX(frequencyPoints[j]) - i*1} y={gainY} width={2} height={PIXELS_Y/2 - gainY} fill={p.color}/>
                } else {
                    return <rect x={freqToX(frequencyPoints[j]) - i*1} y={PIXELS_Y/2} width={2} height={Math.abs(gainY - PIXELS_Y/2)} fill={p.color}/>
                }
            })})
        }

        {/* Total response */}
        <polyline points={totalResponse.map((v, i) => `${i * PIXELS_X / totalResponse.length},${gainToY(v)}`).join(" ")} stroke="yellow" strokeWidth={2} fill="none"/>
        
      </svg>
    </div>
  );
};

export default EQView;
