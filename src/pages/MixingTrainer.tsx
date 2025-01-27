import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/Panel'
import { BORDER_RADIUS, COLORS, FONTSIZE, PADDING } from '../StyleConstants';
import { useAudioDestination } from '../hooks/useAudioDestination';
import { AudioTrack } from '../components/Panels/TrackPicker';
import AudioPanelMulti, { DEFAULT_MIXER_MODEL } from '../components/Panels/AudioPanelMulti';
import { Bus, ChannelSettings, MixerModel, Mod } from '../components/MixerModel';
import FaderControl from '../components/FaderControl';
import { LabelledControl } from '../components/LabelledControl';
import { LEDButtonRound } from '../components/LedButtonRound';
import LevelIndicator, { IndicatorLedGain, LEVEL_INDICATOR_LEDS_BASIC, LEVEL_INDICATOR_LEDS_FULL } from '../components/LevelIndicator';
import { useAudioLevel } from '../hooks/useAudioLevel';
import PreampPanel from '../components/Panels/PreampPanel';
import PanPanel from '../components/Panels/PanPanel';


// Define a list of pre-existing audio tracks
const audioTracks: AudioTrack[] = [
    { name: 'Mighty Name', src: 'multitrack/MightyName/data.json', description: "Mighty Name sung at our local church" },
];


const LevelIndicatorFromNode: React.FC<{ audioContext: AudioContext | undefined, listenTo: AudioNode | undefined, indicatorLedGains: IndicatorLedGain[] }> = ({ audioContext, listenTo, indicatorLedGains }) => {
    const level = useAudioLevel(audioContext, listenTo);
    return <LevelIndicator level={level} indicatorLedGains={indicatorLedGains} />
}



const MixingTrainer: React.FC = () => {
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode>();
    const [mixerModel, setMixerModel] = useState<MixerModel>(DEFAULT_MIXER_MODEL);

    const [selectedChannel, setSelectedChannel] = useState<number>(0);

    const numChannels = useMemo(() => {
        return mixerModel.channels.map((channel) => channel.source.channel).reduce((a, b) => Math.max(a, b), 0) + 1;
    }, [mixerModel]);

    const channelSplitter = useMemo(() => {
        if (audioContext) {
            const splitter = audioContext.createChannelSplitter(numChannels);
            return splitter;
        }
    }, [audioContext, numChannels]);


    const busId = 0;
    const bus = React.useMemo(() => {
        return mixerModel?.busses[busId];
    }, [mixerModel]);


    // Connect source to channel splitter
    useEffect(() => {
        if (sourceNode && channelSplitter) {
            sourceNode.connect(channelSplitter);
        }
    }, [sourceNode, channelSplitter]);

    /////////////////////////////// PREAMPS ///////////////////////////////
    const preampNodes = useMemo(() => {
        if (audioContext) {
            return Array.from({ length: numChannels }, (_, _i) => {
                const node = audioContext.createGain();
                node.gain.value = 1;
                return node;
            })
        }
    }, [audioContext, numChannels]);

    // Connect channel splitter to preamps
    useEffect(() => {
        if (channelSplitter && preampNodes) {
            preampNodes.forEach((node, i) => {
                channelSplitter.connect(node, i);
            })
        }
    }, [channelSplitter, preampNodes]);

    // Sync preamp nodes with mixer model -> preamp and mute
    useEffect(() => {
        if (preampNodes) {
            mixerModel.channels.forEach((channel, i) => {
                const gainNorm = Math.pow(10, channel.filters.preamp.gainDb / 20);
                preampNodes[i].gain.value = gainNorm * (channel.mute.state ? 0 : 1);
            })
        }
    }, [mixerModel, preampNodes]);

    console.log()


    /////////////////////////////// PAN NODES ///////////////////////////////
    // Pan Nodes
    const panNodes = useMemo(() => {
        if (audioContext) {
            return Array.from({ length: numChannels }, (_, _i) => {
                const left_gain = audioContext.createGain();
                const right_gain = audioContext.createGain();
                left_gain.gain.value = 1;
                right_gain.gain.value = 1;
                return {
                    left: left_gain,
                    right: right_gain,
                };
            })
        }
    }, [audioContext, numChannels]);

    // Connect mute nodes to pan nodes
    useEffect(() => {
        if (preampNodes && panNodes) {
            preampNodes.forEach((node, i) => {
                node.connect(panNodes[i].left);
                node.connect(panNodes[i].right);
            })
        }
    }, [preampNodes, panNodes]);

    // Sync pan nodes with mixer model
    useEffect(() => {
        if (panNodes) {
            mixerModel.channels.forEach((channel, i) => {
                const pan = channel.pan; // between -1 and 1 with zero being center
                panNodes[i].left.gain.value = (1 + pan.pan) / 2;
                panNodes[i].right.gain.value = (1 - pan.pan) / 2;
            })
        }
    }, [mixerModel, panNodes]);


    /////////////////////////// FADERS ///////////////////////////
    // Fader Nodes
    const faderNodes = useMemo(() => {
        if (audioContext) {
            return Array.from({ length: bus.bands.length }, (_, _i) => {
                const node_left = audioContext.createGain();
                node_left.gain.value = 1;
                const node_right = audioContext.createGain();
                node_right.gain.value = 1;

                return {
                    left: node_left,
                    right: node_right
                };
            })
        }
    }, [audioContext, numChannels]);

    // Connect pan nodes to fader nodes
    useEffect(() => {
        if (panNodes && faderNodes) {
            faderNodes.forEach((node, i) => {
                const inputChannel = bus.bands[i].channelSource;
                panNodes[inputChannel].left.connect(node.left);
                panNodes[inputChannel].right.connect(node.right);
            })
        }
    }, [panNodes, faderNodes, bus]);

    // Sync fader nodes with mixer model
    useEffect(() => {
        if (faderNodes) {
            bus.bands.forEach((band, i) => {
                faderNodes[i].left.gain.value = Math.pow(10, band.fader.gainDb / 20);
                faderNodes[i].right.gain.value = Math.pow(10, band.fader.gainDb / 20);
            })
        }
    }, [mixerModel, faderNodes]);

    /////////////////////////// CHANNEL MERGER ///////////////////////////
    const channelMerger = useMemo(() => {
        if (audioContext) {
            const merger = audioContext.createChannelMerger(2);
            return merger;
        }
    }, [audioContext]);

    // Connect fader nodes to channel merger
    useEffect(() => {
        if (faderNodes && channelMerger) {
            faderNodes.forEach((node, i) => {
                node.left.connect(channelMerger, 0, 0);
                node.right.connect(channelMerger, 0, 1);
            })
        }
    }, [faderNodes, channelMerger]);


    /////////////////////////// Output Fader ///////////////////////////
    const outputFaderNode = useMemo(() => {
        if (audioContext) {
            const node = audioContext.createGain();
            node.gain.value = 1;
            return node;
        }
    }, [audioContext]);

    // Connect channel merger to output fader
    useEffect(() => {
        if (channelMerger && outputFaderNode) {
            channelMerger.connect(outputFaderNode);
        }
    }, [channelMerger, outputFaderNode]);

    // Sync output fader with mixer model
    useEffect(() => {
        if (outputFaderNode) {
            outputFaderNode.gain.value = Math.pow(10, bus.output_gain.gainDb / 20);
        }
    }, [bus, outputFaderNode]);


    useAudioDestination(audioContext, outputFaderNode);



    const setFaderValue = React.useCallback((busId: number, bandId: number, newValue: number) => {
        setMixerModel((oldModel) => {
            if (!oldModel) {
                return oldModel;
            }
            return {
                ...oldModel,
                busses: oldModel.busses.map((bus, bId) => {
                    if (busId === bId) {
                        return {
                            ...bus,
                            bands: bus.bands.map((b, i) => {
                                if (i === bandId) {
                                    return {
                                        ...b,
                                        fader: {
                                            ...b.fader,
                                            gainDb: newValue
                                        }
                                    }
                                } else {
                                    return b;
                                }
                            })
                        }
                    } else {
                        return bus;
                    }
                })
            }
        })
    }, [setMixerModel]);


    const monitoredPreamp = useAudioLevel(audioContext, preampNodes?.[selectedChannel]);

    const updateSelectedChannel = useCallback((updater: Mod<ChannelSettings>) => {
        setMixerModel((oldModel) => {
            if (!oldModel) {
                return oldModel;
            }
            return {
                ...oldModel,
                channels: oldModel.channels.map((channel, cId) => {
                    if (cId === selectedChannel) {
                        return updater(channel);
                    } else {
                        return channel;
                    }
                })
            }
        })
    }, [selectedChannel, setMixerModel]);





    return (
        <div style={{ background: COLORS.background, color: COLORS.text, display: 'flex', flexDirection: 'column', gap: PADDING.small, padding: PADDING.medium }}>
            <Panel heading="Audio Source" color={COLORS.interact_color}>
                <AudioPanelMulti audioTracks={audioTracks} setAudioContext={setAudioContext} setAudioSource={setSourceNode} setMixerModel={setMixerModel} />
            </Panel>
            <Panel heading="Mixer" color={COLORS.background_colorful}>
                This is a work in progress. The mixer will be displayed here. If you have a multichannel ogg file, the first 32 channels will be rounted to your speakers

            </Panel>
            <div style={{ display: "flex", gap: PADDING.small }}>
            <Panel heading="Preamp">
                <PreampPanel preamp={mixerModel.channels[selectedChannel].filters.preamp} onChangePreamp={(updater) => {
                    updateSelectedChannel((oldChannel) => {
                        return {
                            ...oldChannel,
                            filters: {
                                ...oldChannel.filters,
                                preamp: updater(oldChannel.filters.preamp)
                            }
                        }
                    })
                }} preampLevel={monitoredPreamp} />
            </Panel>
            <Panel heading="Pan">
                <PanPanel pan={mixerModel.channels[selectedChannel].pan} onChangePan={(updater) => {
                    updateSelectedChannel((oldChannel) => {
                        return {
                            ...oldChannel,
                            pan: updater(oldChannel.pan)
                        }
                    })
                }}/>
            </Panel>
            </div>
            <div style={{ display: "flex", gap: PADDING.small }}>
                <Panel heading="Faders">
                    <div style={{ display: "flex", gap: PADDING.small, justifyContent: "center" }}>
                        {bus && bus.bands.map((band, index) => {
                            const channelId = band.channelSource;
                            return <div key={index} style={{ display: "flex", flexDirection: "column", gap: PADDING.small }}>
                                <LabelledControl label="Mute" position="top">
                                    <LEDButtonRound onColor="#ff5555" round={false} on={
                                        mixerModel?.channels[band.channelSource].mute.state ?? false
                                    }
                                        onClick={(
                                            () => {
                                                setMixerModel((oldModel) => {
                                                    if (!oldModel) {
                                                        return oldModel;
                                                    }
                                                    return {
                                                        ...oldModel,
                                                        channels: oldModel.channels.map((channel, cId) => {
                                                            if (cId === band.channelSource) {
                                                                return {
                                                                    ...channel,
                                                                    mute: {
                                                                        state: !channel.mute.state
                                                                    }
                                                                }
                                                            } else {
                                                                return channel;
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        )}
                                    />
                                </LabelledControl>

                                <LabelledControl label="Sel">
                                    <LEDButtonRound onColor="#55ff55" offColor="#557766" on={selectedChannel === channelId} onClick={() => setSelectedChannel(channelId)} semiTransparent={true} />
                                </LabelledControl>

                                <LevelIndicatorFromNode audioContext={audioContext} listenTo={preampNodes?.[channelId]} indicatorLedGains={LEVEL_INDICATOR_LEDS_BASIC} />

                                <div style={{ borderRadius: BORDER_RADIUS, background: COLORS.background_colorful, padding: PADDING.small, textAlign: 'center' }}>
                                    <div style={{ width: '4rem', height: '2.5rem', overflow: 'clip', textOverflow: 'elipsis', fontSize: FONTSIZE.small }}>{mixerModel.channels[channelId].name}</div>
                                    <div style={{ fontSize: FONTSIZE.tiny }}>{index + 1}</div>
                                </div>

                                <LabelledControl label={index + 1}>

                                    <FaderControl value={band.fader.gainDb} min={-50} max={10} onChange={(newValue) => {
                                        setFaderValue(busId, index, newValue)
                                    }} />
                                </LabelledControl>
                            </div>
                        })}

                    </div>
                </Panel>
                <Panel heading="Out">
                    <div style={{ display: "flex" }}>
                        <LabelledControl label="Master">
                            <FaderControl value={bus.output_gain.gainDb} min={-50} max={10} onChange={(newValue) => {
                                setMixerModel((oldModel) => {
                                    if (!oldModel) {
                                        return oldModel;
                                    }
                                    return {
                                        ...oldModel,
                                        busses: oldModel.busses.map((bus, bId) => {
                                            if (busId === bId) {
                                                return {
                                                    ...bus,
                                                    output_gain: {
                                                        ...bus.output_gain,
                                                        gainDb: newValue
                                                    }
                                                }
                                            } else {
                                                return bus;
                                            }
                                        })
                                    }
                                })
                            }} />
                        </LabelledControl>

                        <LevelIndicatorFromNode audioContext={audioContext} listenTo={outputFaderNode} indicatorLedGains={LEVEL_INDICATOR_LEDS_FULL} />
                    </div>
                </Panel>
            </div>
        </div>
    )
}

export default MixingTrainer