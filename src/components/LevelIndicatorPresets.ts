import { LED_COLORS } from "../StyleConstants";

export const PK_THRESHOLD = 12;

export interface IndicatorLedGain {
    color: string;
    threshold: number;
    label: string;
}

export const LEVEL_INDICATOR_LEDS_FULL: IndicatorLedGain[] = [
    { label: 'Pk', color: LED_COLORS.red, threshold: PK_THRESHOLD },
    { label: '+9', color: LED_COLORS.yellow, threshold: 9 },
    { label: '+6', color: LED_COLORS.yellow, threshold: 6 },
    { label: '+3', color: LED_COLORS.yellow, threshold: 3 },
    { label: '0', color: LED_COLORS.green, threshold: 0 },
    { label: '-3', color: LED_COLORS.green, threshold: -3 },
    { label: '-6', color: LED_COLORS.green, threshold: -6 },
    { label: '-9', color: LED_COLORS.green, threshold: -9 },
    { label: '-12', color: LED_COLORS.green, threshold: -12 },
    { label: '-16', color: LED_COLORS.green, threshold: -16 },
    { label: '-20', color: LED_COLORS.green, threshold: -20 },
    { label: '-40', color: LED_COLORS.green, threshold: -40 },
];

export const LEVEL_INDICATOR_LEDS_BASIC: IndicatorLedGain[] = [
    { label: 'Pk', color: LED_COLORS.red, threshold: PK_THRESHOLD },
    { label: '0', color: LED_COLORS.green, threshold: 0 },
    { label: 'Sig', color: LED_COLORS.green, threshold: -30 },
];

