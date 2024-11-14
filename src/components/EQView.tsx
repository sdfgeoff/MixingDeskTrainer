import React from 'react';
import { EQBand, HighPassFilter, ParametricEq } from './MixerModel';


/*

There is a great resource here:
https://arachnoid.com/BiQuadDesigner/index.html

*/


export const COLORS = [
    "#00FF00",
    "#00EEEE",
    "#3333FF",
    "#FF0000"
]

export const GRIDLINE_COLOR = "#444444"


const MIN_FREQ = 30
const MAX_FREQ = 20000
const MIN_GAIN = -18
const MAX_GAIN = 18

const FREQ_RANGE = MAX_FREQ - MIN_FREQ
const GAIN_RANGE = MAX_GAIN - MIN_GAIN

const PIXELS_X = 640
const PIXELS_Y = 320

const FAKE_SAMPLE_RATE = 41100 // IDK why this is needed. Could probably factor it out somehow

const DB_GRID_LINES = [
    -12, -6, 0, 6, 12
]
const FREQ_GRID_LINES = [
    50, 100, 200, 500, 1000, 2000, 5000, 10000
]

interface FilterConstants {
    a0: number,
    a1: number,
    a2: number,
    b0: number,
    b1: number,
    b2: number
}

const deriveBandpassFilterConstants = (band: EQBand): FilterConstants => {
    const Q = band.q;
    const centerFreq = band.frequency;
    const gain = band.gainDb;

    var gain_abs = Math.pow(10, gain / 40);

    const omega = 2 * Math.PI * centerFreq / FAKE_SAMPLE_RATE;
    const sn = Math.sin(omega);
    const cs = Math.cos(omega);
    const alpha = sn / (2 * Q);

    const a0 = 1 + (alpha / gain_abs);
    const a1 = (-2 * cs) / a0;
    const a2 = (1 - (alpha / gain_abs)) / a0;

    const b0 = (1 + (alpha * gain_abs)) / a0;
    const b1 = (-2 * cs) / a0;
    const b2 = (1 - (alpha * gain_abs)) / a0;

    return {
        a0, a1, a2, b0, b1, b2
    }
}

const deriveHighpassFilterConstants = (filter: HighPassFilter): FilterConstants => {
    const { frequency, Q } = filter;

    const omega = 2 * Math.PI * frequency / FAKE_SAMPLE_RATE;
    const sn = Math.sin(omega);
    const cs = Math.cos(omega);

    const alpha = sn / (2 * Q);

    const b0 = (1 + cs) / 2;
    const b1 = -(1 + cs);
    const b2 = (1 + cs) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cs;
    const a2 = 1 - alpha;

    return {
        a0, a1, a2, b0, b1, b2
    }
}


const evaluateBiquad = (filterConstants: FilterConstants, freq: number) => {
    /// Evaluate a biquad filter at a given frequency
    const { a1, a2, b0, b1, b2 } = filterConstants;
    const phi = Math.pow((Math.sin(2.0 * Math.PI * freq / (2.0 * FAKE_SAMPLE_RATE))), 2.0);
    const r = (Math.pow(b0 + b1 + b2, 2.0) - 4.0 * (b0 * b1 + 4.0 * b0 * b2 + b1 * b2) * phi + 16.0 * b0 * b2 * phi * phi) / (Math.pow(1.0 + a1 + a2, 2.0) - 4.0 * (a1 + 4.0 * a2 + a1 * a2) * phi + 16.0 * a2 * phi * phi);
    const r_ = (r < 0) ? 0 : r;
    const result = Math.sqrt(r_);

    // convert to db
    return 20 * Math.log10(result);
}


const freqToX = (freq: number) => {
    const logMinFreq = Math.log10(MIN_FREQ);
    const logMaxFreq = Math.log10(MAX_FREQ);
    const logFreq = Math.log10(freq);
    return ((logFreq - logMinFreq) / (logMaxFreq - logMinFreq)) * PIXELS_X;
}

const xToFreq = (x: number) => {
    const logMinFreq = Math.log10(MIN_FREQ);
    const logMaxFreq = Math.log10(MAX_FREQ);
    const logFreq = (x / PIXELS_X) * (logMaxFreq - logMinFreq) + logMinFreq;
    return Math.pow(10, logFreq);
}

const gainToY = (gain: number) => {
    return (-gain - MIN_GAIN) / GAIN_RANGE * PIXELS_Y
}


interface EQViewProps {
    eqSettings: ParametricEq,
    highPassFilter: HighPassFilter
}

const EQView: React.FC<EQViewProps> = ({ eqSettings, highPassFilter }) => {
    const { bands } = eqSettings;

    const parametersWithColors = React.useMemo(() => {
        return bands.map((p, i) => ({
            ...p,
            color: COLORS[i % COLORS.length]
        }))
    }, [bands])

    const frequencyPoints = React.useMemo(() => {
        const points = []
        const SAMPLES = PIXELS_X / 8
        for (let i = 0; i < SAMPLES; i++) {
            // Evenly space in graph-space, then convert to Hz
            points.push(xToFreq(i / SAMPLES * PIXELS_X))
        }
        return points
    }, [])

    const highPassFilterPoints = React.useMemo(() => {
        const filterConstants = deriveHighpassFilterConstants(highPassFilter)
        return frequencyPoints.map(f => evaluateBiquad(filterConstants, f))
    }, [highPassFilter, frequencyPoints])


    const parametersWithSamples = React.useMemo(() => {
        return parametersWithColors.map(p => {
            const filterConstants = deriveBandpassFilterConstants(p)

            return {
                ...p,
                samples: frequencyPoints.map(f => evaluateBiquad(filterConstants, f))
            }
        })
    }, [parametersWithColors, frequencyPoints])


    const totalResponse = React.useMemo(() => {
        return frequencyPoints.map((f, i) => parametersWithSamples.reduce((acc, p) => acc + p.samples[i], 0))
    }, [parametersWithSamples, frequencyPoints])


    return (
        <svg viewBox={`0 0 ${PIXELS_X} ${PIXELS_Y}`} width={PIXELS_X} height={PIXELS_Y} style={{ border: "1px solid black", background: "black" }}>
            <Scale />

            {parametersWithSamples.map((p, i) => {
                // Bar chart at each sample
                return p.samples.map((s, j) => {
                    const gainY = gainToY(s)
                    if (s > 0) {
                        return <rect key={`bar-positive-${i}-${j}`} x={freqToX(frequencyPoints[j]) - i * 2} y={gainY} width={2} height={PIXELS_Y / 2 - gainY} fill={p.color} />
                    } else {
                        return <rect key={`bar-negative-${i}-${j}`} x={freqToX(frequencyPoints[j]) - i * 2} y={PIXELS_Y / 2} width={2} height={Math.abs(gainY - PIXELS_Y / 2)} fill={p.color} />
                    }
                })
            })
            }

            {/* HighPass Filter */}
            <polyline points={highPassFilterPoints.map((v, i) => `${freqToX(frequencyPoints[i])},${gainToY(v)}`).join(" ")} stroke={highPassFilter.enabled ? "purple" : GRIDLINE_COLOR} strokeWidth={1} fill="none" />


            {/* Total response */}
            <polyline points={totalResponse.map((v, i) => `${freqToX(frequencyPoints[i])},${gainToY(v)}`).join(" ")} stroke={eqSettings.enabled ? "yellow" : GRIDLINE_COLOR} strokeWidth={1} fill="none" />


            {parametersWithSamples.map((p, i) => {
                // Box at freq/gain
                return <rect key={`sample-rect-${i}`} x={freqToX(p.frequency) - 2} y={gainToY(p.gainDb) - 2} width={5} height={5} stroke={p.color} strokeWidth={2} fillOpacity={0.0} />
            })}

        </svg>
    );
};


const Scale: React.FC = () => {
    return React.useMemo(() => <>
        {/* DB Grid lines at 12db placed at DB_GRID_LINES  */}
        {DB_GRID_LINES.map((db, i) => {
            const y = gainToY(db)
            return <line key={`gain-grid-${i}`} x1={0} y1={y} x2={PIXELS_X} y2={y} stroke={GRIDLINE_COLOR} strokeWidth={1} />
        }
        )}

        {/* Labels for DB Grid lines */}
        {DB_GRID_LINES.map((db, i) => {
            const y = gainToY(db)
            return <text key={`gain-text-${i}`} x={0} y={y} fill="white" fontSize={20} alignmentBaseline="middle" dominantBaseline="middle">{db}</text>
        })}


        {/* Frequency Grid lines, spaced at log intervals (ie 1,2,3,4,5,6,7,8,9,10, 20, 30, 40, 50....)  */}
        {Array.from({ length: 40 }).map((_, i) => {
            const octave = Math.pow(10, Math.floor(i / 10))
            const freq = octave * (i % 10 + 1)
            const x = freqToX(freq)
            return <line key={`frequency-grid-${i}`} x1={x} y1={0} x2={x} y2={PIXELS_Y} stroke={GRIDLINE_COLOR} strokeWidth={1} />
        })}
        {/* Labels for Frequency Grid lines, placed at FREQ_GRID_LINES */}
        {FREQ_GRID_LINES.map((freq, i) => {
            const x = freqToX(freq)
            return <text key={`frequency-text-${i}`} x={x} y={PIXELS_Y} fill="white" fontSize={20} dominantBaseline="top" textAnchor='middle'>{freq.toString().replace(new RegExp("000$"), "k")}</text>
        })}
    </>, [])
}

export default EQView;
