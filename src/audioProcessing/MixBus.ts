import { Bus } from "../components/MixerModel";
import { dbToValue } from "./db_util";

interface MixBusBandNodes {
    fader: {
        left: GainNode;
        right: GainNode;
    },
}

export interface MixBusNodes {
    bands: MixBusBandNodes[]
    merger: ChannelMergerNode;
    outputGain: GainNode;
}


export const createMixBus = (audioContext: AudioContext, numBands: number): MixBusNodes => {
    const bands: MixBusBandNodes[] = Array.from({ length: numBands }, () => {
        const left = audioContext.createGain();
        left.gain.value = 1.0;
        const right = audioContext.createGain();
        right.gain.value = 1.0;

        left.connect(right);
        return { fader: { left, right } };
    });

    const merger = audioContext.createChannelMerger(2);

    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;

    bands.forEach(({ fader }) => {
        fader.left.connect(merger, 0, 0);
        fader.right.connect(merger, 0, 1);
    });

    merger.connect(outputGain);
    
    return {
        bands,
        merger,
        outputGain,
    }
}

export const syncMixBus = ( mixBusNodes: MixBusNodes, busModel: Bus) => {
    busModel.bands.forEach((band, index) => {
        const { fader } = mixBusNodes.bands[index];
        fader.left.gain.value = dbToValue(band.fader.gainDb);
        fader.right.gain.value = dbToValue(band.fader.gainDb);
    });

    mixBusNodes.outputGain.gain.value = dbToValue(busModel.output_gain.gainDb);
}
