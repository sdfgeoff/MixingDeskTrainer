

import React from 'react'
import { EQBand, Mod } from './MixerModel';
import EQControl from './EQControl';

export interface PEQProps {
    bands: EQBand[];
    onChange: (updater: Mod<EQBand[]>) => void;
}

export const PEQ: React.FC<PEQProps> = ({ bands, onChange }) => {

    const modEqSetting = (index: number, mod: Mod<EQBand>) => {
        onChange((prev) => {
            return prev.map((band, idx) =>
                idx === index ? mod(band) : band
              )
        });
      };

    return (
        <table className="eq-controls-table">
        <tbody>
          <tr>
            {bands.map((band, index) => (
              <td key={`freq-${index}`} style={{ padding: '0.5em' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <EQControl
                    value={band.frequency}
                    min={60}
                    max={20000}
                    logScale={true}
                    onChange={(newVal) => modEqSetting(index, (prev) => ({
                      ...prev,
                      frequency: newVal
                    }))}
                  />
                  Freq
                </div>
              </td>
            ))}
          </tr>
          <tr>
            {bands.map((band, index) => (
              <td key={`q-${index}`} style={{ padding: '0.5em' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <EQControl
                    value={band.q}
                    min={0.1}
                    max={10}
                    onChange={(newVal) => modEqSetting(index, (prev) => ({
                      ...prev,
                      q: newVal
                    }))}
                  />
                  Width
                </div>
              </td>
            ))}
          </tr>
          <tr>
            {bands.map((band, index) => (
              <td key={`gain-${index}`} style={{ padding: '0.5em' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <EQControl
                    value={band.gainDb}
                    min={-18}
                    max={18}
                    onChange={(newVal) => modEqSetting(index, (prev) => ({
                      ...prev,
                      gainDb: newVal
                    }))}
                  />
                  Gain
                </div>
              </td>
            ))}
          </tr>
          <tr>
            {bands.map((band, index) => (
              <td key={`name-${index}`} style={{ padding: '0.5em' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold' }}>
                  {band.name}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    )
}