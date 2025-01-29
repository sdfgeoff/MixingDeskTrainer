import { LED_COLORS, PADDING } from "../../StyleConstants";
import KnobControl from "../KnobControl";
import { LabelledControl } from "../LabelledControl";
import { LEDButtonRound } from "../LedButtonRound";
import { HighPassFilter, Mod } from "../MixerModel";

interface HighPassFilterProps {
  highPassFilter: HighPassFilter;
  onChangeHighPassFilter: (updater: Mod<HighPassFilter>) => void;
}

export const HighPassFilterPanel: React.FC<HighPassFilterProps> = ({
  highPassFilter,
  onChangeHighPassFilter,
}) => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: PADDING.small }}
    >
      <LabelledControl label="Frequency">
        <KnobControl
          logScale
          value={highPassFilter.frequency}
          min={50}
          max={20000}
          onChange={(val) =>
            onChangeHighPassFilter((prev) => {
              return {
                ...prev,
                frequency: val,
              };
            })
          }
        />
      </LabelledControl>

      <LabelledControl label="In">
        <LEDButtonRound
          on={highPassFilter.enabled}
          onClick={() =>
            onChangeHighPassFilter((prev) => ({
              ...prev,
              enabled: !prev.enabled,
            }))
          }
          ledColor={LED_COLORS.green}
        />
      </LabelledControl>
    </div>
  );
};
