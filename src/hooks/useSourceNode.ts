import { useEffect, useRef, useState } from "react";

export const useSourceNode = (
  audioElement: HTMLAudioElement | null,
  audioContext: AudioContext | undefined,
) => {
  // You can only get one source node from an element, and sometimes useEffects fire multiple times. This
  // creates a single source node for the provided element/context using a ref to ensure it happens only once,
  // but externally acts like a useState so you can respond to changes
  const sourceRef = useRef<MediaElementAudioSourceNode>();
  const [source, setSource] = useState<MediaElementAudioSourceNode>();

  useEffect(() => {
    if (!sourceRef.current && audioElement && audioContext) {
      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;
      setSource(source);
    }
  }, [setSource, audioContext, audioElement]);

  return source;
};
