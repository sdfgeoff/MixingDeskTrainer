import { Filters, MixerModel } from "./MixerModel";

export const DEFAULT_CHANNELS = 16;
export const DEFAULT_CHANNEL_FILTERS: Filters = {
  parametricEq: {
    bands: [
      { frequency: 100, gainDb: 0, q: 1, name: "LF" },
      { frequency: 1000, gainDb: 0, q: 1, name: "LM" },
      { frequency: 5000, gainDb: 0, q: 1, name: "HM" },
      { frequency: 10000, gainDb: 0, q: 1, name: "HF" },
    ],
    enabled: true,
  },
  highPassFilter: {
    frequency: 50,
    q: 1,
    enabled: true,
  },
  preamp: {
    gainDb: 0,
  },
};
export const DEFAULT_MIXER_MODEL: MixerModel = {
  source: {
    audioUrl: "",
  },
  channels: Array.from({ length: DEFAULT_CHANNELS }, (_, i) => ({
    name: `Channel ${i + 1}`,
    pan: {
      pan: 0,
    },
    source: {
      channel: i,
    },
    mute: {
      state: false,
    },
    pafl: {
      state: false,
    },
    filters: DEFAULT_CHANNEL_FILTERS,
  })),
  channel_links: [],
  busses: [
    {
      name: "Main",
      bands: Array.from({ length: DEFAULT_CHANNELS }, (_, i) => ({
        channelSource: i,
        fader: {
          gainDb: 0,
        },
      })),
      output_gain: {
        gainDb: 0,
      },
    },
  ],
};
