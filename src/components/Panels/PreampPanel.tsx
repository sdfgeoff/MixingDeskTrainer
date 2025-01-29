import { LabelledControl } from "../LabelledControl";
import KnobControl from "../KnobControl";
import { PADDING, FONTSIZE, LED_COLORS } from "../../StyleConstants";
import { LED } from "../ColoredLed";
import { Mod, Preamp } from "../MixerModel";
import { PK_THRESHOLD } from "../LevelIndicatorPresets";


interface PreampProps {
  preamp: Preamp;
  onChangePreamp: (updater: Mod<Preamp>) => void;
  preampLevel: number;
}

const PreampPanel: React.FC<PreampProps> = ({ preamp, onChangePreamp: onChange, preampLevel }) => {
  return <LabelledControl label="Gain">
    <div style={{ display: "flex", justifyContent: "end", gap: PADDING.small, fontSize: FONTSIZE.small }}>Pk:<LED color={LED_COLORS.red} on={preampLevel > PK_THRESHOLD} />
    </div>
    <KnobControl value={preamp.gainDb} min={-40} max={50} onChange={(val) => onChange((prev) => {
      return {
        ...prev,
        gainDb: val
      }
    })} />
  </LabelledControl>
}

export default PreampPanel;