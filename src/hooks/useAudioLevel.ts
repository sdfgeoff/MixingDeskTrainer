import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * A hook that listens to an audio node and returns the output level in dB
 */
export const useAudioLevel = (
  audioContext: AudioContext | undefined,
  listenTo: AudioNode | undefined,
): number => {
  const [outputDb, setOutputDb] = useState<number>(-40);

  const outputAnalyzerNode = useMemo(() => {
    if (!audioContext) {
      return undefined;
    }
    const analyzerNode = audioContext.createAnalyser();
    analyzerNode.fftSize = 256;
    return analyzerNode;
  }, [audioContext]);

  const updateOutputAudioLevel = useCallback(() => {
    requestAnimationFrame(updateOutputAudioLevel); // TODO: figure out when to stop this!

    const dataArray = new Float32Array(
      outputAnalyzerNode?.frequencyBinCount ?? 0,
    );

    outputAnalyzerNode?.getFloatTimeDomainData(dataArray);
    // Get RMS
    const rms = Math.sqrt(
      dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length,
    );
    // Convert to dB

    const db = 20 * Math.log10(rms * 11); // The scaling is so the output level hits peaks at +12 DB
    setOutputDb(db);
  }, [setOutputDb, outputAnalyzerNode]);

  useEffect(() => {
    if (outputAnalyzerNode) {
      updateOutputAudioLevel();
    }
  }, [outputAnalyzerNode, updateOutputAudioLevel]);

  useEffect(() => {
    if (!outputAnalyzerNode || !listenTo) {
      return () => {};
    }
    listenTo.connect(outputAnalyzerNode);

    return () => {
      listenTo.disconnect(outputAnalyzerNode);
    };
  }, [listenTo, outputAnalyzerNode]);

  return outputDb;
};
