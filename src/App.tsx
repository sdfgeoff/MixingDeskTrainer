import { useState, useEffect, useMemo } from 'react';
import KnobControl from './components/KnobControl';
import { ChannelSettings, Mod, ParametricEq } from './components/MixerModel';
import EQView from './components/EQView';
import { PEQ } from './components/PEQ';
import { COLORS, FONTSIZE, PADDING } from './StyleConstants';
import { MinimizablePanel, Panel } from './components/Panel';
import { LabelledControl } from './components/LabelledControl';
import { LEDButtonRound } from './components/LedButtonRound';
import { LED } from './components/ColoredLed';
import { useSourceNode } from './hooks/useSourceNode';
import { useAudioLevel } from './hooks/useAudioLevel';



const createEqFilterChain = (audioContext: AudioContext, length: number) => {
  const filters = Array.from({ length: length }, () => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 100;
    filter.Q.value = 1;
    filter.gain.value = 0;
    return filter;
  });

  // Chain Filters
  filters.forEach((filter, idx) => {
    if (idx === 0) {
      return
    } else {
      filters[idx - 1].connect(filter);
    }
  })
  return filters
}




const useAudioDestination = (audioContext: AudioContext | undefined, listenTo: AudioNode | undefined) => {
  // Connect the listenTo node to the audioContext destination
  useEffect(() => {
    if (audioContext && listenTo) {
      listenTo.connect(audioContext.destination)
    }
    return () => {
      if (audioContext && listenTo) {
        listenTo.disconnect(audioContext.destination)
      }
    }
  }, [audioContext, listenTo])
}



interface AudioTrack {
  name: string,
  src: string,
  description: string
}

// Define a list of pre-existing audio tracks
const audioTracks: AudioTrack[] = [
  { name: 'CS Lewis on Prayer', src: 'mono/c.s.lewis-original-recording.mp3', description: "A recording of CS Lewis himself talking about prayer. This was recorded in 1944 and became the book 'Mere Christianity'. This track has some strange recording artifacts due to it's age." },
  { name: 'Piano Improvisation', src: 'mono/all-creatures-of-our-god-and-king-piano-improvisation-247210.mp3', description: "An improvisation on All Creatures of our God and King done by smccleery (sourced from pixabay.com)" },
  { name: 'Keith Bible Reading', src: 'mono/KeithBibleReading.mp3', description: "Bible Reading at a Lecturn Microphone" },
];


const INITIAL_SETTINGS: ChannelSettings = {
  parametricEq: {
    bands: [
      { gainDb: 0, frequency: 60, q: 1, name: 'LF' },
      { gainDb: 0, frequency: 250, q: 1, name: 'LM' },
      { gainDb: 0, frequency: 1000, q: 1, name: 'HM' },
      { gainDb: 0, frequency: 8000, q: 1, name: 'HF' },
    ],
    enabled: true
  },
  highPassFilter: {
    frequency: 100,
    Q: 0.707,
    enabled: true,
  },
  preamp: {
    gainDb: 0.5
  }
}


function App() {
  const [mixerSettings, setMixerSettings] = useState<ChannelSettings>(INITIAL_SETTINGS);

  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioTrack, setAudioTrack] = useState<AudioTrack>();
  const source = useSourceNode(audioElement, audioContext);


  const numBands = mixerSettings.parametricEq.bands.length;


  const userEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return createEqFilterChain(audioContext, numBands);
  }, [audioContext, numBands]);

  const highPassFilter = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    return filter
  }, [audioContext]);

  const hiddenEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return createEqFilterChain(audioContext, numBands);
  }, [audioContext, numBands]);

  const preampNode = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return audioContext.createGain();
  }, [audioContext]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return
    }
    setAudioTrack({
      name: file?.name ?? 'Unknown',
      description: 'User uploaded track',
      src: URL.createObjectURL(file)
    })
  }

  const handleTrackSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Find track by src and event.target.value
    const track = audioTracks.find(t => t.src === event.target.value);
    setAudioTrack(track);
  };

  useEffect(() => {
    if (audioElement) {
      audioElement.src = audioTrack?.src ?? '';
    }
  }, [audioTrack, audioElement]);

  const initAudioContext = () => {
    // Have to wait for user interactino with page before this can be done
    setAudioContext((old) => old ?? new AudioContext());
  }


  // Connect source -> hidden filters -> gain Node -> highpass -> user peq filters -----> destination
  useEffect(() => {
    if (source && userEqFilters && hiddenEqFilters && audioContext && preampNode && highPassFilter) {
      const firstHiddenFilter = hiddenEqFilters[0];
      source.connect(firstHiddenFilter);

      const lastHiddenFilter = hiddenEqFilters[hiddenEqFilters.length - 1];
      lastHiddenFilter.connect(preampNode);

      preampNode.connect(highPassFilter);

      const firstUserFilter = userEqFilters[0];
      highPassFilter.connect(firstUserFilter)

      return () => {
        source.disconnect(firstHiddenFilter);
        preampNode.disconnect(highPassFilter);
        highPassFilter.disconnect(firstUserFilter);
        lastHiddenFilter.disconnect(preampNode);
      }
    }
  }, [source, userEqFilters, hiddenEqFilters, audioContext, highPassFilter, preampNode]);

  const outputLevel = useAudioLevel(audioContext, userEqFilters ? userEqFilters[userEqFilters.length - 1] : undefined);
  const preampPeakingDetect = useAudioLevel(audioContext, preampNode);

  useAudioDestination(audioContext, userEqFilters ? userEqFilters[userEqFilters.length - 1] : undefined);
  //useAudioDestination(audioContext, preampNode);



  // Sync change from eqSettings to the biquad filters
  useEffect(() => {
    if (userEqFilters) {
      mixerSettings.parametricEq.bands.forEach((band, index) => {
        const filter = userEqFilters[index];
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        filter.gain.value = mixerSettings.parametricEq.enabled ? band.gainDb : 0;
      });
    }
  }, [userEqFilters, mixerSettings.parametricEq]);

  // Sync changes to the high pass filter
  useEffect(() => {
    if (highPassFilter) {
      highPassFilter.frequency.value = mixerSettings.highPassFilter.enabled ? mixerSettings.highPassFilter.frequency : 0;
      highPassFilter.Q.value = mixerSettings.highPassFilter.Q;
    }
  }, [highPassFilter, mixerSettings.highPassFilter])

  // Sync changes from preamp to the gainNode
  useEffect(() => {
    if (preampNode) {
      preampNode.gain.value = Math.pow(10, mixerSettings.preamp.gainDb / 20);
    }
  })

  const scrambleHiddenEq = () => {
    if (hiddenEqFilters) {
      hiddenEqFilters.forEach((filter) => {
        // Log compensate frequency
        filter.frequency.value = Math.pow(10, Math.random() * 3) * 20;
        filter.Q.value = Math.random() * 10;

        filter.gain.value = (-Math.random()) * 20;
        // Generate random gain evenly spaced in audible range
        // Math.pow(10, gain / 40);
        //filter.gain.value = Math.pow(10, (-Math.random()) * 80 / 40) * 24;

      });
    }
  }

  const resetHiddenEq = () => {
    if (hiddenEqFilters) {
      hiddenEqFilters.forEach((filter) => {
        filter.frequency.value = 100;
        filter.Q.value = 1;
        filter.gain.value = 0;
      });
    }
  }

  const setEqValues = (updater: Mod<ParametricEq>) => setMixerSettings((prev) => ({
    ...prev,
    parametricEq: updater(prev.parametricEq)
  }))

  const resetMainEq = () => {
    setMixerSettings(() => INITIAL_SETTINGS)
  }

  return (
    <div style={{ background: COLORS.background, color: COLORS.text, display: 'flex', flexDirection: 'column', gap: PADDING.small, padding: PADDING.medium }}>
      <MinimizablePanel heading="Instructions" color={COLORS.background_colorful_2} startExpanded={true}>
        <p>
          A modern mixing panel has a lot of buttons and dials, and it can be hard to figure out what they all do. A live performance and even rehearsals are not the best time to play around, so it can be hard to find a place to practice.
          This page provides the controls for a single audio channel, and lets you fiddle with them where no-one can hear you. This mixing desk is roughly based on the Allen and Heath QU-16, as that is what I have access to.
        </p>
        <p>
          As a bit of a game, the input to this audio channel can be mutated by some hidden filters. This is to simulate the effect of a bad microphone (eg a lecturn microphone a long way from the speaker).
          The 'Scramble EQ' button will randomize the hidden filters, and the 'Reset EQ' button will reset them to neutral so you can hear the original audio. I find that I have to hit
          the scramble button a few times to find one that you can I can actually hear.
        </p>

        <div style={{ display: 'flex', gap: PADDING.small }}>
          <button onClick={scrambleHiddenEq} >Scramble EQ</button>
          <button onClick={resetHiddenEq}>Reset EQ</button>
        </div>
      </MinimizablePanel>
      <MinimizablePanel heading="Audio Source" color={COLORS.background_colorful_2} startExpanded={true}>
        <div style={{ display: 'flex', gap: PADDING.small }}>
          <audio ref={setAudioElement} controls onPlay={initAudioContext} />

          <div style={{ flexGrow: 1 }}>
            <select onChange={handleTrackSelect}>
              <option value="">Choose existing track</option>
              {audioTracks.map((track, index) => (
                <option key={index} value={track.src}>
                  {track.name}
                </option>
              ))}
            </select> or {' '}
            <input type="file" accept="audio/*" onChange={handleFileChange} />

            <div style={{ opacity: 0.5, fontSize: "0.8rem" }}>
              {/* If the current audio source matches one of the known sources, display it's description */}
              {audioTrack?.description}
            </div>
          </div>

        </div>
      </MinimizablePanel>




      <h1>Mixing Desk</h1>
      <button onClick={resetMainEq}>Reset Mixing Desk</button>
      <div style={{ display: 'flex', flexDirection: 'row', gap: PADDING.medium, alignItems: 'start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: PADDING.medium }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: PADDING.medium }}>
            <Panel heading="Preamp">
              <LabelledControl label="Gain">
                <div style={{ display: "flex", justifyContent: "end", gap: PADDING.small, fontSize: FONTSIZE.small }}>Pk:<LED color="red" on={preampPeakingDetect > 12} />
                </div>
                <KnobControl value={mixerSettings.preamp.gainDb} min={-40} max={18} onChange={(val) => setMixerSettings((prev) => {
                  return {
                    ...prev,
                    preamp: {
                      ...prev.preamp,
                      gainDb: val
                    }
                  }
                })} />
              </LabelledControl>

            </Panel>
            <Panel heading="HPF">
              <div style={{ display: 'flex', flexDirection: 'column', gap: PADDING.small }}>
                <LabelledControl label="Frequency">
                  <KnobControl
                    logScale
                    value={mixerSettings.highPassFilter.frequency}
                    min={50}
                    max={20000}
                    onChange={(val) => setMixerSettings((prev) => {
                      return {
                        ...prev,
                        highPassFilter: {
                          ...prev.highPassFilter,
                          frequency: val
                        }
                      }
                    })} />
                </LabelledControl>

                <LabelledControl label="In">
                  <LEDButtonRound
                    on={mixerSettings.highPassFilter.enabled}
                    onClick={() => setMixerSettings((prev) => ({
                      ...prev,
                      highPassFilter: {
                        ...prev.highPassFilter,
                        enabled: !prev.highPassFilter.enabled

                      }
                    }))

                    }
                    onColor="lightgreen"
                  />


                </LabelledControl>
              </div>
            </Panel>
          </div>
          <Panel heading="Parametric EQ">
            <PEQ
              eqSettings={mixerSettings.parametricEq}
              onChangeEq={setEqValues}
            />
          </Panel>
        </div>

        <div style={{ display: 'flex', alignItems: 'start', gap: PADDING.medium }}>
          <Panel heading="PEQ">
            <EQView
              eqSettings={mixerSettings.parametricEq}
              highPassFilter={mixerSettings.highPassFilter}
            />
          </Panel>
          <Panel>
            <div>
              {LEVEL_INDICATOR_LEDS.map((led, index) => (
                <div key={index} style={{ display: "flex", gap: PADDING.small }}>
                  <LED color={led.color} on={outputLevel > led.threshold} />
                  {led.label}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

    </div>
  );
}

const LEVEL_INDICATOR_LEDS = [
  { label: 'Pk', color: 'red', threshold: 12 },
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

]

export default App;