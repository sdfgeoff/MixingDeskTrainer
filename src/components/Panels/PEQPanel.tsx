import React from "react";
import { EQBand, Mod, ParametricEq } from "../MixerModel";
import KnobControl from "../KnobControl";
import { LabelledControl } from "../LabelledControl";
import { PADDING } from "../../StyleConstants";
import { LEDButtonRound } from "../LedButtonRound";

export interface PEQProps {
  eqSettings: ParametricEq;
  onChangeEq: (updater: Mod<ParametricEq>) => void;
}

export const PEQPanel: React.FC<PEQProps> = ({
  eqSettings,
  onChangeEq: onChange,
}) => {
  const { bands, enabled } = eqSettings;

  const modEqBand = (index: number, mod: Mod<EQBand>) => {
    onChange((prev) => {
      return {
        ...prev,
        bands: prev.bands.map((band, idx) =>
          idx === index ? mod(band) : band,
        ),
      };
    });
  };

  return (
    <table className="eq-controls-table">
      <tbody>
        <tr>
          {bands.map((band, index) => (
            <td key={`q-${index}`} style={{ padding: PADDING.small }}>
              <LabelledControl label="Width">
                <KnobControl
                  value={band.q}
                  min={0.1}
                  max={10}
                  onChange={(newVal) =>
                    modEqBand(index, (prev) => ({
                      ...prev,
                      q: newVal,
                    }))
                  }
                  logScale
                />
              </LabelledControl>
            </td>
          ))}
        </tr>
        <tr>
          {bands.map((band, index) => (
            <td key={`freq-${index}`} style={{ padding: PADDING.small }}>
              <LabelledControl label="Freq">
                <KnobControl
                  value={band.frequency}
                  min={60}
                  max={20000}
                  logScale={true}
                  onChange={(newVal) =>
                    modEqBand(index, (prev) => ({
                      ...prev,
                      frequency: newVal,
                    }))
                  }
                />
              </LabelledControl>
            </td>
          ))}
        </tr>

        <tr>
          {bands.map((band, index) => (
            <td key={`gain-${index}`} style={{ padding: PADDING.small }}>
              <LabelledControl label="Gain">
                <KnobControl
                  value={band.gainDb}
                  min={-18}
                  max={18}
                  onChange={(newVal) =>
                    modEqBand(index, (prev) => ({
                      ...prev,
                      gainDb: newVal,
                    }))
                  }
                />
              </LabelledControl>
            </td>
          ))}
        </tr>
        <tr>
          {bands.map((band, index) => (
            <td key={`name-${index}`} style={{ padding: PADDING.small }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  fontWeight: "bold",
                }}
              >
                {band.name}
              </div>
            </td>
          ))}
        </tr>
        <tr>
          <td colSpan={4}>
            <LabelledControl label="In">
              <LEDButtonRound
                onClick={() => {
                  onChange((prev) => ({ ...prev, enabled: !prev.enabled }));
                }}
                ledColor="lightgreen"
                on={enabled}
              />
            </LabelledControl>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
