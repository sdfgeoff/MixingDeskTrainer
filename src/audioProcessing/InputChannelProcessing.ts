import { ChannelSettings } from "../components/MixerModel";
import { dbToValue } from "./db_util";
import { createEqFilterChain, syncEqFilterChainToModel } from "./EqFilterChain";

export interface ChannelNodes {
    preamp: GainNode,
    highPassFilter: BiquadFilterNode,
    parametricEq: BiquadFilterNode[],
    mute: GainNode,
    pan: { left: GainNode, right: GainNode },
}


export const createChannelNodes = (audioContext: AudioContext, parametricEqSize: number): ChannelNodes => {
    const preamp = audioContext.createGain();
    preamp.gain.value = 1;

    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = "highpass";
    highPassFilter.frequency.value = 20;
    highPassFilter.Q.value = 1;

    const parametricEq = createEqFilterChain(audioContext, parametricEqSize);

    const mute = audioContext.createGain();
    mute.gain.value = 1;

    const panSplitter = audioContext.createChannelSplitter(2);
    const leftPanGain = audioContext.createGain();
    const rightPanGain = audioContext.createGain();
    leftPanGain.gain.value = 1;
    rightPanGain.gain.value = 1;

    const pan = {
        left: leftPanGain,
        right: rightPanGain,
    };

    preamp.connect(highPassFilter);
    highPassFilter.connect(parametricEq[0]);
    parametricEq[parametricEq.length - 1].connect(mute);
    mute.connect(panSplitter);

    panSplitter.connect(pan.left, 0);
    panSplitter.connect(pan.right, 0);
    
    return {
        preamp,
        highPassFilter,
        parametricEq,
        mute,
        pan,
    };
}


export const syncChannelProcessingToMixerModel = (channelNodes: ChannelNodes, channel: ChannelSettings): void => {
    const { preamp, highPassFilter, parametricEq, mute, pan } = channelNodes;

    preamp.gain.value = dbToValue(channel.filters.preamp.gainDb);

    highPassFilter.frequency.value = channel.filters.highPassFilter.frequency;
    highPassFilter.Q.value = channel.filters.highPassFilter.q;
    highPassFilter.gain.value = 0;

    syncEqFilterChainToModel(parametricEq, channel.filters.parametricEq.bands);

    mute.gain.value = channel.mute.state ? 0 : 1;

    // Pan goes from -1 to 1 and the gains go from 1 to 0
    pan.left.gain.value = (1.0 - channel.pan.pan) / 2;
    pan.right.gain.value = (1.0 + channel.pan.pan) / 2;
}