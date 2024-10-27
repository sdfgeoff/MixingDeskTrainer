export interface EQBand {
    gain: number;
    frequency: number;
    q: number;
    name: string;
}


export interface MixerSettings {
    parametricEq: EQBand[];
}
