import { EQBand } from "../components/MixerModel";

export const createEqFilterChain = (audioContext: AudioContext, length: number): BiquadFilterNode[] => {
    const filters = Array.from({ length: length }, () => {
      const filter = audioContext.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = 100;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });
  
    // Chain Filters
    filters.forEach((filter, idx) => {
      if (idx === 0) {
        return;
      } else {
        filters[idx - 1].connect(filter);
      }
    });
    return filters;
  };

export const syncEqFilterChainToModel = (filters: BiquadFilterNode[], model: EQBand[]): void => {
    if (filters.length !== model.length) {
      throw new Error(
        `Filter chain length ${filters.length} does not match model length ${model.length}`
      );
    }

    filters.forEach((filter, idx) => {
      const band = model[idx];
      filter.frequency.value = band.frequency;
      filter.Q.value = band.q;
      filter.gain.value = band.gainDb;
    });
  }
