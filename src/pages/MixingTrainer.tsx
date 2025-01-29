import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "../components/Panel";
import {
    BORDER_RADIUS,
    COLORS,
    FONTSIZE,
    LED_COLORS,
    PADDING,
} from "../StyleConstants";
import { useAudioDestination } from "../hooks/useAudioDestination";
import AudioPanelMulti from "../components/Panels/AudioPanelMulti";
import { DEFAULT_MIXER_MODEL } from "../components/MixerModelDefault";
import { ChannelSettings, MixerModel, Mod } from "../components/MixerModel";
import FaderControl from "../components/FaderControl";
import { LabelledControl } from "../components/LabelledControl";
import { LEDButtonRound } from "../components/LedButtonRound";
import LevelIndicator from "../components/LevelIndicator";
import { IndicatorLedGain } from "../components/LevelIndicatorPresets";
import { LEVEL_INDICATOR_LEDS_BASIC } from "../components/LevelIndicatorPresets";
import { LEVEL_INDICATOR_LEDS_FULL } from "../components/LevelIndicatorPresets";
import { useAudioLevel } from "../hooks/useAudioLevel";
import PreampPanel from "../components/Panels/PreampPanel";
import PanPanel from "../components/Panels/PanPanel";
import { LED } from "../components/ColoredLed";
import { createChannelNodes, syncChannelProcessingToMixerModel } from "../audioProcessing/InputChannelProcessing";
import { AUDIO_SOURCES_MULTITRACK } from "../AvailableAudio";




const LevelIndicatorFromNode: React.FC<{
    audioContext: AudioContext | undefined;
    listenTo: AudioNode | undefined;
    indicatorLedGains: IndicatorLedGain[];
}> = ({ audioContext, listenTo, indicatorLedGains }) => {
    const level = useAudioLevel(audioContext, listenTo);
    return <LevelIndicator level={level} indicatorLedGains={indicatorLedGains} />;
};

const MixingTrainer: React.FC = () => {
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode>();
    const [mixerModel, setMixerModel] = useState<MixerModel>(DEFAULT_MIXER_MODEL);

    const [selectedChannel, setSelectedChannel] = useState<number>(0);
    const [paflChannel, setPaflChannel] = useState<number>();

    const numChannels = useMemo(() => {
        return (
            mixerModel.channels
                .map((channel) => channel.source.channel)
                .reduce((a, b) => Math.max(a, b), 0) + 1
        );
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

        return () => {
            if (sourceNode && channelSplitter) {
                sourceNode.disconnect(channelSplitter);
            }
        };
    }, [sourceNode, channelSplitter]);

    /////////////////////////// CHANNEL PROCESSING ///////////////////////////
    const channelProcessingChains = useMemo(() => {
        if (audioContext) {
            return Array.from({ length: numChannels }, () => {
                return createChannelNodes(audioContext, 4);
            });
        }
    }, [audioContext, numChannels]);

    // Connect channel splitter to channel processing chains
    useEffect(() => {
        if (channelSplitter && channelProcessingChains) {
            channelProcessingChains.forEach((nodes, i) => {
                channelSplitter.connect(nodes.preamp, i);
            });
        }

        return () => {
            if (channelSplitter && channelProcessingChains) {
                channelProcessingChains.forEach((nodes, i) => {
                    channelSplitter.disconnect(nodes.preamp, i);
                });
            }
        };
    }, [channelSplitter, channelProcessingChains]);

    // Sync channel processing chains with mixer model
    useEffect(() => {
        if (channelProcessingChains) {
            mixerModel.channels.forEach((channel, i) => {
                syncChannelProcessingToMixerModel(channelProcessingChains[i], channel);
            });
        }
    }, [channelProcessingChains, mixerModel.channels]);

    /////////////////////////// FADERS ///////////////////////////
    // Fader Nodes
    const faderNodes = useMemo(() => {
        if (audioContext) {
            return Array.from({ length: bus.bands.length }, () => {
                const node_left = audioContext.createGain();
                node_left.gain.value = 1;
                const node_right = audioContext.createGain();
                node_right.gain.value = 1;

                return {
                    left: node_left,
                    right: node_right,
                };
            });
        }
    }, [audioContext, bus.bands.length]);

    // Connect pan nodes to fader nodes
    useEffect(() => {
        if (channelProcessingChains && faderNodes) {
            faderNodes.forEach((node, i) => {
                const inputChannel = bus.bands[i].channelSource;
                channelProcessingChains[inputChannel].pan.left.connect(node.left);
                channelProcessingChains[inputChannel].pan.right.connect(node.right);
            });
        }
        return () => {
            if (channelProcessingChains && faderNodes) {
                faderNodes.forEach((node, i) => {
                    const inputChannel = bus.bands[i].channelSource;
                    channelProcessingChains[inputChannel].pan.left.disconnect(node.left);
                    channelProcessingChains[inputChannel].pan.right.disconnect(node.right);
                });
            }
        };
    }, [channelProcessingChains, faderNodes, bus]);

    // Sync fader nodes with mixer model
    useEffect(() => {
        if (faderNodes) {
            bus.bands.forEach((band, i) => {
                faderNodes[i].left.gain.value = Math.pow(10, band.fader.gainDb / 20);
                faderNodes[i].right.gain.value = Math.pow(10, band.fader.gainDb / 20);
            });
        }
    }, [faderNodes, bus.bands]);

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
                if (paflChannel === undefined || paflChannel === i) {
                    node.left.connect(channelMerger, 0, 0);
                    node.right.connect(channelMerger, 0, 1);
                }
            });
        }
        return () => {
            if (faderNodes && channelMerger) {
                faderNodes.forEach((node, i) => {
                    if (paflChannel === undefined || paflChannel === i) {
                        node.left.disconnect(channelMerger, 0, 0);
                        node.right.disconnect(channelMerger, 0, 1);
                    }
                });
            }
        };
    }, [faderNodes, channelMerger, paflChannel]);

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

    const setFaderValue = React.useCallback(
        (busId: number, bandId: number, newValue: number) => {
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
                                                gainDb: newValue,
                                            },
                                        };
                                    } else {
                                        return b;
                                    }
                                }),
                            };
                        } else {
                            return bus;
                        }
                    }),
                };
            });
        },
        [setMixerModel],
    );

    const monitoredPreamp = useAudioLevel(
        audioContext,
        channelProcessingChains?.[selectedChannel].preamp,
    );

    const updateChannelById = useCallback(
        (updater: Mod<ChannelSettings>, channelId: number, includeLinked: boolean = true) => {
            setMixerModel((oldModel) => {
                if (!oldModel) {
                    return oldModel;
                }

                const linkedChannels = oldModel.channel_links.filter((link) => {
                    return link.includes(channelId);
                }).flat();
                const channelsToModify = [
                    channelId,
                    ...(includeLinked ? linkedChannels : []),
                ]
                return {
                    ...oldModel,
                    channels: oldModel.channels.map((channel, cId) => {
                        if (channelsToModify?.includes(cId)) {
                            return updater(channel);
                        } else {
                            return channel;
                        }
                    }),
                };
            });
        },
        [setMixerModel],
    );

    return (
        <div
            style={{
                background: COLORS.background,
                color: COLORS.text,
                display: "flex",
                flexDirection: "column",
                gap: PADDING.small,
                padding: PADDING.medium,
            }}
        >

            <div style={{ display: "flex", gap: PADDING.small }}>
                <Panel heading="Preamp">
                    <PreampPanel
                        preamp={mixerModel.channels[selectedChannel].filters.preamp}
                        onChangePreamp={(updater) => {
                            updateChannelById((oldChannel) => {
                                return {
                                    ...oldChannel,
                                    filters: {
                                        ...oldChannel.filters,
                                        preamp: updater(oldChannel.filters.preamp),
                                    },
                                };
                            }, selectedChannel);
                        }}
                        preampLevel={monitoredPreamp}
                    />
                </Panel>
                <Panel heading="Pan">
                    <PanPanel
                        pan={mixerModel.channels[selectedChannel].pan}
                        onChangePan={(updater) => {
                            updateChannelById((oldChannel) => {
                                return {
                                    ...oldChannel,
                                    pan: updater(oldChannel.pan),
                                };
                            }, selectedChannel, false);
                        }}
                    />
                </Panel>
            </div>
            <div style={{ display: "flex", gap: PADDING.small }}>
                <Panel heading="Faders">
                    <div
                        style={{
                            display: "flex",
                            gap: PADDING.small,
                            justifyContent: "center",
                        }}
                    >
                        {bus &&
                            bus.bands.map((band, index) => {
                                const channelId = band.channelSource;
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: PADDING.small,
                                        }}
                                    >
                                        <LabelledControl label="Mute" position="top">
                                            <LEDButtonRound
                                                ledColor={LED_COLORS.red}
                                                shape="rectangle"
                                                on={
                                                    mixerModel?.channels[band.channelSource].mute.state ??
                                                    false
                                                }
                                                onClick={() => {
                                                    updateChannelById((oldChannel) => {
                                                        return {
                                                            ...oldChannel,
                                                            mute: {
                                                                state: !oldChannel.mute.state,
                                                            },
                                                        };
                                                    }, channelId);
                                                }}
                                            />
                                        </LabelledControl>

                                        <LabelledControl label="Sel" position="top">
                                            <LEDButtonRound
                                                ledColor={LED_COLORS.green}
                                                buttonColor="#557766"
                                                on={selectedChannel === channelId}
                                                semiTransparent={false}
                                                onClick={() => setSelectedChannel(channelId)}
                                            />
                                        </LabelledControl>

                                        <LabelledControl label="PAFL" position="top">
                                            <LEDButtonRound
                                                shape="round"
                                                ledColor={LED_COLORS.red}
                                                buttonColor="#555"
                                                on={paflChannel === channelId}
                                                semiTransparent={false}
                                                onClick={() =>
                                                    setPaflChannel((channel) => {
                                                        if (channel === channelId) {
                                                            return undefined;
                                                        } else {
                                                            return channelId;
                                                        }
                                                    })
                                                }
                                            />
                                        </LabelledControl>

                                        <LevelIndicatorFromNode
                                            audioContext={audioContext}
                                            listenTo={channelProcessingChains?.[channelId].preamp}
                                            indicatorLedGains={LEVEL_INDICATOR_LEDS_BASIC}
                                        />

                                        <div
                                            style={{
                                                borderRadius: BORDER_RADIUS,
                                                background: COLORS.background_colorful,
                                                padding: PADDING.small,
                                                textAlign: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "4rem",
                                                    height: "2.5rem",
                                                    overflow: "clip",
                                                    textOverflow: "elipsis",
                                                    fontSize: FONTSIZE.small,
                                                }}
                                            >
                                                {mixerModel.channels[channelId].name}
                                            </div>
                                            <div style={{ fontSize: FONTSIZE.tiny }}>{index + 1}</div>
                                        </div>

                                        <LabelledControl label={index + 1}>
                                            <FaderControl
                                                value={band.fader.gainDb}
                                                min={-50}
                                                max={10}
                                                onChange={(newValue) => {
                                                    setFaderValue(busId, index, newValue);
                                                }}
                                            />
                                        </LabelledControl>
                                    </div>
                                );
                            })}
                    </div>
                </Panel>
                <Panel heading="Out">
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: PADDING.small,
                        }}
                    >
                        <LevelIndicatorFromNode
                            audioContext={audioContext}
                            listenTo={outputFaderNode}
                            indicatorLedGains={LEVEL_INDICATOR_LEDS_FULL}
                        />

                        <LabelledControl label="PAFL">
                            <LED color={LED_COLORS.red} on={paflChannel !== undefined} />
                        </LabelledControl>

                        <div
                            style={{
                                backgroundColor: COLORS.background_colorful,
                                borderRadius: BORDER_RADIUS,
                                height: "2.5rem",
                                width: "4rem",
                                padding: PADDING.small,
                                textAlign: "center",
                                fontSize: FONTSIZE.small,
                            }}
                        >
                            {bus.name}
                        </div>

                        <LabelledControl label="Output">
                            <FaderControl
                                value={bus.output_gain.gainDb}
                                min={-50}
                                max={10}
                                onChange={(newValue) => {
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
                                                            gainDb: newValue,
                                                        },
                                                    };
                                                } else {
                                                    return bus;
                                                }
                                            }),
                                        };
                                    });
                                }}
                            />
                        </LabelledControl>
                    </div>
                </Panel>
            </div>
            <Panel heading="Audio Source" color={COLORS.interact_color}>
                <AudioPanelMulti
                    audioTracks={AUDIO_SOURCES_MULTITRACK}
                    setAudioContext={setAudioContext}
                    setAudioSource={setSourceNode}
                    setMixerModel={setMixerModel}
                />
            </Panel>
        </div>
    );
};

export default MixingTrainer;
