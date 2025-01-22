import React, { useEffect, useState } from "react";
import { useSourceNode } from "../../hooks/useSourceNode";
import { PADDING } from "../../StyleConstants";
import TrackPicker, { AudioTrack } from "./TrackPicker";





interface AudioSourcePanelProps {
    audioTracks: AudioTrack[];
    setAudioSource: (source: MediaElementAudioSourceNode | undefined) => void;
    setAudioContext: (context: AudioContext | undefined) => void;
}




const AudioSourcePanel: React.FC<AudioSourcePanelProps> = ({ audioTracks, setAudioSource, setAudioContext }) => {

    const [audioContextL, setAudioContextL] = useState<AudioContext>();
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [audioTrack, setAudioTrack] = useState<AudioTrack>();

    const sourceNode = useSourceNode(audioElement, audioContextL);

    useEffect(() => {
        setAudioSource(sourceNode);
    }, [sourceNode, setAudioSource]);



    useEffect(() => {
        if (audioElement) {
            audioElement.src = audioTrack?.src ?? '';
        }
    }, [audioTrack, audioElement]);

    const initAudioContext = () => {
        // Have to wait for user interactino with page before this can be done
        setAudioContextL((old) => old ?? new AudioContext());
    }

    useEffect(() => {
        setAudioContext(audioContextL);
    }, [audioContextL, setAudioContext]);




    return <div style={{ display: 'flex', gap: PADDING.small }}>
        <TrackPicker audioTracks={audioTracks} onSelect={setAudioTrack} selectedTrack={audioTrack} />
        <audio ref={setAudioElement} controls onPlay={initAudioContext} />
    </div>
}


export default AudioSourcePanel;