import { LabelledControl } from "../LabelledControl";
import KnobControl from "../KnobControl";
import { PADDING, FONTSIZE, LED_COLORS } from "../../StyleConstants";
import { LED } from "../ColoredLed";
import { Mod, PanSettings } from "../MixerModel";


interface PanProps {
    pan: PanSettings;
    onChangePan: (updater: Mod<PanSettings>) => void;
}

const PanLEDS = [
    { label: 'L', min: -8 / 7, max: -6 / 7, color: LED_COLORS.yellow },
    { label: '', min: -6 / 7, max: -4 / 7, color: LED_COLORS.yellow },
    { label: '', min: -4 / 7, max: -2 / 7, color: LED_COLORS.yellow },
    { label: 'C', min: -2 / 7, max: 2 / 7, color: LED_COLORS.green },
    { label: '', min: 2 / 7, max: 4 / 7, color: LED_COLORS.yellow },
    { label: '', min: 4 / 7, max: 6 / 7, color: LED_COLORS.yellow },
    { label: 'R', min: 6 / 7, max: 8 / 7, color: LED_COLORS.yellow },
]


const PanPanel: React.FC<PanProps> = ({ pan, onChangePan: onChange }) => {
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: PADDING.small }}>
        <div style={{ display: "flex", gap: PADDING.small }}>{
            PanLEDS.map((p, index) => (
                <div key={index} style={{ textAlign: "center" }}>
                    <LED color={p.color} on={pan.pan > p.min && pan.pan <= p.max} />
                    <div style={{ fontSize: FONTSIZE.small }}>
                        {p.label}
                    </div>
                </div>
            ))
        }</div>
        <LabelledControl label="Pan">


            <KnobControl value={pan.pan} min={-1} max={1} onChange={(val) => onChange((prev) => {
                return {
                    ...prev,
                    pan: val
                }
            })} />
        </LabelledControl>
    </div>
}

export default PanPanel;