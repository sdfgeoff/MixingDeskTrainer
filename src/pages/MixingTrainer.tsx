import React, { useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/Panel'
import { COLORS, PADDING } from '../StyleConstants';
import { useAudioDestination } from '../hooks/useAudioDestination';
import { AudioTrack } from '../components/Panels/TrackPicker';
import AudioPanelMulti from '../components/Panels/AudioPanelMulti';
import { MixerModel } from '../components/MixerModel';


// Define a list of pre-existing audio tracks
const audioTracks: AudioTrack[] = [
    { name: 'Mighty Name', src: 'multitrack/MightyName/data.json', description: "Mighty Name sung at our local church" },
];


const MixingTrainer: React.FC = () => {
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

            // For now, mix all the channels together
            mixerModel?.busses[0].bands.forEach((band) => {
                const channelId = band.channelSource;
                const channelData = mixerModel?.channels[channelId];
                if (channelData) {
                    channelSplitter.connect(channelMerger, channelId, 0);
                    channelSplitter.connect(channelMerger, channelId, 1);
                }
            })
        }
    }, [channelSplitter, channelMerger, mixerModel]);

    useAudioDestination(audioContext, channelMerger);


    return (
        <div style={{ background: COLORS.background, color: COLORS.text, display: 'flex', flexDirection: 'column', gap: PADDING.small, padding: PADDING.medium }}>
            <Panel heading="Audio Source" color={COLORS.interact_color}>
                <AudioPanelMulti audioTracks={audioTracks} setAudioContext={setAudioContext} setAudioSource={setSourceNode} setMixerModel={setMixerModel} />
            </Panel>
            <Panel heading="Mixer" color={COLORS.background_colorful}>
                This is a work in progress. The mixer will be displayed here. If you have a multichannel ogg file, the first 32 channels will be rounted to your speakers
            </Panel>
        </div>
    )
}

export default MixingTrainer