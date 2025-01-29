import { FONTSIZE, PADDING } from "../StyleConstants";
import { LED } from "./ColoredLed";
import {
  IndicatorLedGain,
  LEVEL_INDICATOR_LEDS_FULL,
} from "./LevelIndicatorPresets";

interface LevelIndicatorProps {
  level: number;
  indicatorLedGains?: IndicatorLedGain[];
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  level,
  indicatorLedGains = LEVEL_INDICATOR_LEDS_FULL,
}) => {
  return (
    <div>
      {indicatorLedGains.map((led, index) => (
        <div key={index} style={{ display: "flex", gap: PADDING.small }}>
          <LED color={led.color} on={level > led.threshold} />
          <span style={{ fontSize: FONTSIZE.small }}>{led.label}</span>
        </div>
      ))}
    </div>
  );
};

export default LevelIndicator;
