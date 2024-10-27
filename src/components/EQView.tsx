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

const FAKE_SAMPLE_RATE = 44100

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
    const gain = band.gain;

    var gain_abs = Math.pow(10, gain / 40);

    const sampleRate = 44100;
    const omega = 2 * Math.PI * centerFreq / FAKE_SAMPLE_RATE;
    const sn = Math.sin(omega);
    const cs = Math.cos(omega);
    const alpha = sn / (2 * Q);
    const beta = Math.sqrt(gain_abs + gain_abs);


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


const evaluateBiquad = (filterConstants: FilterConstants, freq: number) => {
    /// Evaluate a biquad peaking filter at a given frequency
    const { a1, a2, b0, b1, b2 } = filterConstants;
    const phi = Math.pow((Math.sin(2.0 * Math.PI * freq / (2.0 * FAKE_SAMPLE_RATE))), 2.0);
    const r = (Math.pow(b0 + b1 + b2, 2.0) - 4.0 * (b0 * b1 + 4.0 * b0 * b2 + b1 * b2) * phi + 16.0 * b0 * b2 * phi * phi) / (Math.pow(1.0 + a1 + a2, 2.0) - 4.0 * (a1 + 4.0 * a2 + a1 * a2) * phi + 16.0 * a2 * phi * phi);
    const r_ = (r < 0) ? 0 : r;
    const result = Math.sqrt(r_);

    // convert to db
    return 20 * Math.log10(result);

    // return result;


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
    bands: EQBand[]
}

const EQView: React.FC<EQViewProps> = ({ bands }) => {

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


    const parametersWithSamples = React.useMemo(() => {
        return parametersWithColors.map(p => {
            const  filterConstants = deriveBandpassFilterConstants(p)

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
        <div>
            <h1>EQ Visualizer</h1>
            <svg viewBox={`0 0 ${PIXELS_X} ${PIXELS_Y}`} width={PIXELS_X} height={PIXELS_Y} style={{ border: "1px solid black", background: "black" }}>

                {parametersWithSamples.map((p, i) => {
                    // Box at freq/gain
                    return <rect x={freqToX(p.frequency) - 1} y={gainToY(p.gain) - 1} width={4} height={4} stroke={p.color} strokeWidth={2} />
                })}
                {parametersWithSamples.map((p, i) => {
                    // Bar chart at each sample
                    return p.samples.map((s, j) => {
                        const gainY = gainToY(s)
                        if (s > 0) {
                            return <rect x={freqToX(frequencyPoints[j]) - i * 1} y={gainY} width={2} height={PIXELS_Y / 2 - gainY} fill={p.color} />
                        } else {
                            return <rect x={freqToX(frequencyPoints[j]) - i * 1} y={PIXELS_Y / 2} width={2} height={Math.abs(gainY - PIXELS_Y / 2)} fill={p.color} />
                        }
                    })
                })
                }

                {/* Total response */}
                <polyline points={totalResponse.map((v, i) => `${i * PIXELS_X / totalResponse.length},${gainToY(v)}`).join(" ")} stroke="yellow" strokeWidth={2} fill="none" />

            </svg>
        </div>
    );
};

export default EQView;
