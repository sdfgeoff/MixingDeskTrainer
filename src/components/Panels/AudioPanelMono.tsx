import React, { useState } from "react";
import { PADDING } from "../../StyleConstants";
import TrackPicker, { AudioTrack } from "./TrackPicker";
import AudioPlayer from "./AudioPlayer";

export interface AudioPanelProps {
  audioTracks: AudioTrack[];
  setAudioSource: (source: MediaElementAudioSourceNode | undefined) => void;
  setAudioContext: (context: AudioContext | undefined) => void;
}

const AudioSourcePanel: React.FC<AudioPanelProps> = ({
  audioTracks,
  setAudioSource,
  setAudioContext,
}) => {
  const [audioTrack, setAudioTrack] = useState<AudioTrack | undefined>();

  return (
    <div style={{ display: "flex", gap: PADDING.small }}>
      <TrackPicker
        audioTracks={audioTracks}
        onSelect={setAudioTrack}
        selectedTrack={audioTrack}
      />
      <AudioPlayer
        trackUrl={audioTrack?.src}
        setAudioSource={setAudioSource}
        setAudioContext={setAudioContext}
      />
    </div>
  );
};

export default AudioSourcePanel;
