import React, { useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/Panel'
import { COLORS, PADDING } from '../StyleConstants';
import { useAudioDestination } from '../hooks/useAudioDestination';
import { AudioTrack } from '../components/Panels/TrackPicker';
import AudioPanelMulti from '../components/Panels/AudioPanelMulti';
import { MixerModel } from '../components/MixerModel';


// Define a list of pre-existing audio tracks
const audioTracks: AudioTrack[] = [
    { name: 'Mighty Name', src: 'multitrack/MightyName/data.json', description: "Mighty Name sung at our local church"},
];


const MixingTrainer = () => {
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode>();
    const [mixerModel, setMixerModel] = useState<MixerModel>();


    const channelSplitter = useMemo(() => {
      if (audioContext) {
        const splitter = audioContext.createChannelSplitter(32);
        return splitter;
      }
    }, [audioContext]);

    const channelMerger = useMemo(() => {
        if (audioContext) {
            const merger = audioContext.createChannelMerger(2);
            return merger;
        }
    }, [audioContext]);

    // Connect source to channel splitter
    useEffect(() => {
        if (sourceNode && channelSplitter) {
            sourceNode.connect(channelSplitter);
        }
    }, [sourceNode, channelSplitter]);

    // Connect channel splitter to channel merger
    useEffect(() => {
        if (channelSplitter && channelMerger) {
            channelSplitter.connect(channelMerger, 10, 0);
            channelSplitter.connect(channelMerger, 11, 1);
        }
    }, [channelSplitter, channelMerger]);

    useAudioDestination(audioContext, channelMerger);


    return (
        <div style={{ background: COLORS.background, color: COLORS.text, display: 'flex', flexDirection: 'column', gap: PADDING.small, padding: PADDING.medium }}>
            <Panel heading="Audio Source" color={COLORS.interact_color}>
                <AudioPanelMulti audioTracks={audioTracks} setAudioContext={setAudioContext} setAudioSource={setSourceNode} setMixerModel={setMixerModel} />
            </Panel>
        </div>
    )
}

export default MixingTrainer