import React, { useEffect, useMemo, useState } from "react";
import { PADDING } from "../../StyleConstants";
import TrackPicker, { AudioTrack } from "./TrackPicker";
import AudioPlayer from "./AudioPlayer";
import { Filters, MixerModel } from "../MixerModel";
import { useJsonUrl } from "../../hooks/useJsonUrl";



export interface AudioPanelProps {
    audioTracks: AudioTrack[],
    setAudioSource: (source: MediaElementAudioSourceNode | undefined) => void;
    setAudioContext: (context: AudioContext | undefined) => void;
    setMixerModel: (model: MixerModel) => void;
}


const DEFAULT_CHANNELS = 16
const DEFAULT_CHANNEL_FILTERS: Filters = {
    parametricEq: {
        bands: [
            { frequency: 100, gainDb: 0, q: 1, name: 'LF' },
            { frequency: 1000, gainDb: 0, q: 1, name: 'LM' },
            { frequency: 5000, gainDb: 0, q: 1, name: 'HM' },
            { frequency: 10000, gainDb: 0, q: 1, name: 'HF' }
        ],
        enabled: true
    },
    highPassFilter: {
        frequency: 50,
        q: 1,
        enabled: true
    },
    preamp: {
        gainDb: 0
    }
}
export const DEFAULT_MIXER_MODEL: MixerModel = {
    source: {
        audioUrl: ''
    },
    channels: Array.from({ length: DEFAULT_CHANNELS }, (_, i) => ({
        name: `Channel ${i + 1}`,
        pan: 0,
        source: {
            channel: i
        },
        mute: {
            state: false
        },
        pafl: {
            state: false
        },
        filters: DEFAULT_CHANNEL_FILTERS
    }),
    ),
    channel_links: [],
    busses: [
        {
            name: 'Main',
            bands: Array.from({ length: DEFAULT_CHANNELS }, (_, i) => ({
                channelSource: i,
                fader: {
                    gainDb: 0
                }
            }))
        }
    ]
}


const AudioPanelMulti: React.FC<AudioPanelProps> = ({ audioTracks, setAudioSource, setAudioContext, setMixerModel }) => {
    const [audioTrack, setAudioTrack] = useState<AudioTrack | undefined>();

    const dataUrl = audioTrack?.source == 'default' ? audioTrack?.src : undefined
    const modelResponse = useJsonUrl<MixerModel>(dataUrl);
    const mixerModel: MixerModel = useMemo(() => {
        if (!audioTrack) {
            return DEFAULT_MIXER_MODEL;
        }
        if (audioTrack.source == 'default') {
            if (modelResponse.state === 'loaded') {
                return modelResponse.data;
            }
            return DEFAULT_MIXER_MODEL;
        }
        return {
            ...DEFAULT_MIXER_MODEL,
            source: {
                ...DEFAULT_MIXER_MODEL.source,
                audioUrl: audioTrack.src
            }
        }
    }, [modelResponse, audioTrack]);

    useEffect(() => {
        setMixerModel(mixerModel);
    }, [mixerModel, setMixerModel]);

    // The audio URL is assumed to be relative to the JSON path and defined in the modelreponse
    const basePath = audioTrack?.src?.split('/').slice(0, -1).join('/');
    const audioUrl = mixerModel?.source.audioUrl.startsWith("blob:") ? mixerModel?.source.audioUrl : `${basePath}/${mixerModel?.source.audioUrl}`;

    return <div style={{ display: 'flex', gap: PADDING.small }}>
        <TrackPicker audioTracks={audioTracks} onSelect={setAudioTrack} selectedTrack={audioTrack} />
        {modelResponse.state === 'loading' && <div>Loading Mixer Setup</div>}
        {modelResponse.state === 'error' && <div>Error: {modelResponse.errorMessage}</div>}
        {modelResponse.state === 'loaded' && <div>Ready</div>}
        <AudioPlayer trackUrl={audioUrl} setAudioSource={setAudioSource} setAudioContext={setAudioContext} />
    </div>
}


export default AudioPanelMulti;