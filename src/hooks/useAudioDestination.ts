import { useEffect } from "react";

export const useAudioDestination = (
  audioContext: AudioContext | undefined,
  listenTo: AudioNode | undefined,
) => {
  // Connect the listenTo node to the audioContext destination
  useEffect(() => {
    if (audioContext && listenTo) {
      listenTo.connect(audioContext.destination);
    }
    return () => {
      if (audioContext && listenTo) {
        listenTo.disconnect(audioContext.destination);
      }
    };
  }, [audioContext, listenTo]);
};
