import { useAudioLevel } from "../hooks/useAudioLevel";
import LevelIndicator from "./LevelIndicator";
import { IndicatorLedGain } from "./LevelIndicatorPresets";

const LevelIndicatorFromNode: React.FC<{
    audioContext: AudioContext | undefined;
    listenTo: AudioNode | undefined;
    indicatorLedGains: IndicatorLedGain[];
}> = ({ audioContext, listenTo, indicatorLedGains }) => {
    const level = useAudioLevel(audioContext, listenTo);
    return <LevelIndicator level={level} indicatorLedGains={indicatorLedGains} />;
};

export default LevelIndicatorFromNode;