import { PADDING } from "../StyleConstants";
import { LED } from "./ColoredLed";

const LEVEL_INDICATOR_LEDS = [
    { label: 'Pk', color: 'red', threshold: 12 },
    { label: '+9', color: 'yellow', threshold: 9 },
    { label: '+6', color: 'yellow', threshold: 6 },
    { label: '+3', color: 'yellow', threshold: 3 },
    { label: '0', color: 'green', threshold: 0 },
    { label: '-3', color: 'green', threshold: -3 },
    { label: '-6', color: 'green', threshold: -6 },
    { label: '-9', color: 'green', threshold: -9 },
    { label: '-12', color: 'green', threshold: -12 },
    { label: '-16', color: 'green', threshold: -16 },
    { label: '-20', color: 'green', threshold: -20 },
    { label: '-40', color: 'green', threshold: -40 },

]

interface LevelIndicatorProps {
    level: number
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ level }) => {
    return (
        <div>
            {LEVEL_INDICATOR_LEDS.map((led, index) => (
                <div key={index} style={{ display: "flex", gap: PADDING.small }}>
                    <LED color={led.color} on={level > led.threshold} />
                    {led.label}
                </div>
            ))}
        </div>
    );
}

export default LevelIndicator;

