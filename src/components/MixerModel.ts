export interface EQBand {
    gainDb: number;
    frequency: number;
    q: number;
    name: string;
}


export interface ParametricEq {
    bands: EQBand[]
    enabled: boolean
}

export interface Preamp {
    gainDb: number;
}

export interface HighPassFilter {
    frequency: number,
    q: number,
    enabled: boolean,
}

export interface ChannelSettings {
    parametricEq: ParametricEq;
    highPassFilter: HighPassFilter
    preamp: Preamp
}



export type Mod<T> = (prev: T) => T