export interface EQBand {
    gainDb: number;
    frequency: number;
    q: number;
    name: string;
}


export interface ChannelSettings {
    parametricEq: EQBand[];
    preamp: {
        gainDb: number;
    }
}



export type Mod<T> = (prev: T) => T