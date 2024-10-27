export interface EQBand {
    gain: number;
    frequency: number;
    q: number;
}


export interface MixerSettings {
    parametricEq: EQBand[];
}
