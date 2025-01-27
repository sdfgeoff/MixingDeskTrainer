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

export interface Filters {
    parametricEq: ParametricEq;
    highPassFilter: HighPassFilter
    preamp: Preamp
}


export interface ChannelSettings {
    name: string;
    source: { channel: number }
    filters: Filters
    mute: MuteSettings
    pafl: PaflSettings
    pan: number
}

export interface MuteSettings {
    state: boolean
}

export interface PaflSettings {
    state: boolean
}

export interface FaderSettings {
    gainDb: number
}

export interface BusBand {
    channelSource: number,
    fader: FaderSettings
}

export interface Bus {
    name: string,
    bands: BusBand[]
}

export interface SourceSettings {
    audioUrl: string
}

export interface MixerModel {
    channels: ChannelSettings[]
    channel_links: [number, number][]  // Channels that are linked have the same high pass/eq/fader settings
    busses: Bus[]
    source: SourceSettings
}


export type Mod<T> = (prev: T) => T