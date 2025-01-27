export const PK_THRESHOLD = 12;

export interface IndicatorLedGain {
    color: string;
    threshold: number;
    label: string;
}

export const LEVEL_INDICATOR_LEDS_FULL: IndicatorLedGain[] = [
    { label: 'Pk', color: 'red', threshold: PK_THRESHOLD },
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
];

export const LEVEL_INDICATOR_LEDS_BASIC: IndicatorLedGain[] = [
    { label: 'Pk', color: 'red', threshold: PK_THRESHOLD },
    { label: '0', color: 'green', threshold: 0 },
    { label: 'Sig', color: 'green', threshold: -30 },
];

