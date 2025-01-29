import React, { useEffect, useMemo, useState } from "react";
import { PADDING } from "../../StyleConstants";
import TrackPicker, { AudioTrack } from "./TrackPicker";
import AudioPlayer from "./AudioPlayer";
import { MixerModel } from "../MixerModel";
import { useJsonUrl } from "../../hooks/useJsonUrl";
import { DEFAULT_MIXER_MODEL } from "../MixerModelDefault";



export interface AudioPanelProps {
    audioTracks: AudioTrack[],
    setAudioSource: (source: MediaElementAudioSourceNode | undefined) => void;
    setAudioContext: (context: AudioContext | undefined) => void;
    setMixerModel: (model: MixerModel) => void;
}


const AudioPanelMulti: React.FC<AudioPanelProps> = ({ audioTracks, setAudioSource, setAudioContext, setMixerModel }) => {
    const [audioTrack, setAudioTrack] = useState<AudioTrack | undefined>();

    const dataUrl = audioTrack?.source === 'default' ? audioTrack?.src : undefined
    const modelResponse = useJsonUrl<MixerModel>(dataUrl);
    const mixerModel: MixerModel = useMemo(() => {
        if (!audioTrack) {
            return DEFAULT_MIXER_MODEL;
        }
        if (audioTrack.source === 'default') {
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