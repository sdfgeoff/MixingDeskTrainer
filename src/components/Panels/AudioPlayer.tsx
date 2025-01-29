import React, { useEffect, useState } from "react";
import { useSourceNode } from "../../hooks/useSourceNode";

interface AudioPlayerProps {
  trackUrl: string | undefined;
  setAudioSource: (source: MediaElementAudioSourceNode | undefined) => void;
  setAudioContext: (context: AudioContext | undefined) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  trackUrl,
  setAudioSource,
  setAudioContext,
}) => {
  const [audioContextL, setAudioContextL] = useState<AudioContext>();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const sourceNode = useSourceNode(audioElement, audioContextL);

  useEffect(() => {
    setAudioSource(sourceNode);
  }, [sourceNode, setAudioSource]);

  useEffect(() => {
    if (audioElement) {
      audioElement.src = trackUrl ?? "";
    }
  }, [trackUrl, audioElement]);

  const initAudioContext = () => {
    // Have to wait for user interactino with page before this can be done
    setAudioContextL((old) => old ?? new AudioContext());
  };

  useEffect(() => {
    setAudioContext(audioContextL);
  }, [audioContextL, setAudioContext]);

  return <audio ref={setAudioElement} controls onPlay={initAudioContext} />;
};

export default AudioPlayer;
