import { useState, useRef, useEffect, useMemo } from 'react';
import KnobControl from './components/KnobControl';
import { EQBand, ChannelSettings, Mod, ParametricEq } from './components/MixerModel';
import EQView from './components/EQView';
import { PEQ } from './components/PEQ';
import { COLORS, PADDING } from './StyleConstants';
import { Panel } from './components/Panel';
import { LabelledControl } from './components/LabelledControl';
import { LEDButtonRound } from './components/LedButtonRound';



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


const useSourceNode = (audioElement: HTMLAudioElement | null, audioContext: AudioContext | undefined) => {
  // You can only get one source node from an element, and sometimes useEffects fire multiple times. This
  // creates a single source node for the provided element/context using a ref to ensure it happens only once,
  // but externally acts like a useState so you can respond to changes
  const sourceRef = useRef<MediaElementAudioSourceNode>();
  const [source, setSource] = useState<MediaElementAudioSourceNode>();

  useEffect(() => {
    if (!sourceRef.current && audioElement && audioContext) {
      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;
      setSource(source)
    }
  });

  return source;
}


// Define a list of pre-existing audio tracks
const audioTracks = [
  { name: 'CS Lewis on Prayer', src: 'c.s.lewis-original-recording.mp3', description: "A recording of CS Lewis himself talking about prayer. This was recorded in 1944 and became the book 'Mere Christianity'. This track has some strange recording artifacts due to it's age." },
  { name: 'Piano Improvisation', src: 'all-creatures-of-our-god-and-king-piano-improvisation-247210.mp3', description: "An improvisation on All Creatures of our God and King done by smccleery (sourced from pixabay.com)" },
  { name: 'Keith Bible Reading', src: 'KeithBibleReading.mp3', description: "Bible Reading at a Lecturn Microphone" },
];


const INITIAL_EQ: ParametricEq = {
  bands: [
    { gainDb: 0, frequency: 60, q: 1, name: 'LF' },
    { gainDb: 0, frequency: 250, q: 1, name: 'LM' },
    { gainDb: 0, frequency: 1000, q: 1, name: 'HM' },
    { gainDb: 0, frequency: 8000, q: 1, name: 'HF' },
  ],
  enabled: true
}


function App() {
  const [mixerSettings, setMixerSettings] = useState<ChannelSettings>({
    parametricEq: INITIAL_EQ,
    highPassFilter: {
      frequency: 100,
      Q: 0.707,
      enabled: true,
    },
    preamp: {
      gainDb: 0.5
    }
  });

  console.log(mixerSettings.highPassFilter)

  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const source = useSourceNode(audioElement, audioContext);

  const [outputLevel, setOutputLevel] = useState<number>(0);

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

  const gainNode = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    const gainNode = audioContext.createGain();
    return gainNode
  }, [audioContext]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && audioElement) {
      audioElement.src = URL.createObjectURL(file);
    }
  };

  const handleTrackSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (audioElement) {
      audioElement.src = event.target.value;
    }
  };

  const initAudioContext = () => {
    // Have to wait for user interactino with page before this can be done
    setAudioContext((old) => old ?? new AudioContext());
  }


  const analyzerNode = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    const analyzerNode = audioContext.createAnalyser();
    analyzerNode.fftSize = 256;
    return analyzerNode
  }, [audioContext])

  const updatePeaking = () => {
    requestAnimationFrame(updatePeaking) // TODO: figure out when to stop this!

    const dataArray = new Float32Array(analyzerNode?.frequencyBinCount ?? 0);

    analyzerNode?.getFloatTimeDomainData(dataArray)
    // Get RMS
    const rms = Math.sqrt(dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length);
    // Convert to dB
    const db = 20 * Math.log10(rms);
    setOutputLevel(db)
  }


  useEffect(() => {
    if (analyzerNode) {
      updatePeaking()
    }
  }, [analyzerNode])






  // Connect source -> hidden filters -> gain Node -> highpass -> user peq filters -----> destination
  //                                                                                 '--> analyzer 
  useEffect(() => {
    if (source && userEqFilters && hiddenEqFilters && audioContext && gainNode && analyzerNode && highPassFilter) {
      const firstHiddenFilter = hiddenEqFilters[0];
      source.connect(firstHiddenFilter);

      const lastHiddenFilter = hiddenEqFilters[hiddenEqFilters.length - 1];
      lastHiddenFilter.connect(gainNode);

      gainNode.connect(highPassFilter);

      const firstUserFilter = userEqFilters[0];
      highPassFilter.connect(firstUserFilter)

      const lastUserFilter = userEqFilters[userEqFilters.length - 1];
      const destination = audioContext.destination;
      lastUserFilter.connect(destination);

      lastUserFilter.connect(analyzerNode);

      return () => {
        source.disconnect();
        gainNode.disconnect();
        highPassFilter.disconnect();
        lastHiddenFilter.disconnect();
        lastUserFilter.disconnect();
      }
    }
  }, [source, userEqFilters, hiddenEqFilters, audioContext, highPassFilter]);




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
    if (gainNode) {
      gainNode.gain.value = Math.pow(10, mixerSettings.preamp.gainDb / 20);
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
    setEqValues(() => INITIAL_EQ)
  }


  return (
    <div style={{ background: COLORS.background, color: COLORS.text }}>
      <div>
        <h1>Select a track</h1>
        <select onChange={handleTrackSelect}>
          <option value="">Choose existing track</option>
          {audioTracks.map((track, index) => (
            <option key={index} value={track.src}>
              {track.name}
            </option>
          ))}
        </select> or {' '}
        <input type="file" accept="audio/*" onChange={handleFileChange} />
      </div>
      <div style={{ opacity: 0.5, fontSize: "0.8rem" }}>
        {/* If the current audio source matches one of the known sources, display it's description */}
        {audioTracks.find(track => audioElement?.src.endsWith(track.src))?.description}
      </div>
      <audio ref={setAudioElement} controls onPlay={initAudioContext} />

      <h1>Game</h1>
      <button onClick={scrambleHiddenEq} >Scramble EQ</button>
      <button onClick={resetHiddenEq}>Reset EQ</button>


      <h1>Parametric EQ Controls</h1>
      <button onClick={resetMainEq}>Reset EQ</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: PADDING.medium, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: PADDING.medium }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: PADDING.medium }}>
            <Panel heading="Preamp">
              <LabelledControl label="Gain">
                <KnobControl value={mixerSettings.preamp.gainDb} min={-18} max={18} onChange={(val) => setMixerSettings((prev) => {
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
                  <div
                    style={{
                      width: '1em',
                      height: '1em',
                      borderRadius: '50%',
                      backgroundColor: led.color,
                      position: 'relative',
                    }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderRadius: '50%',
                      backgroundColor: 'black',
                      opacity: outputLevel > led.threshold ? '0%' : '90%'
                    }} />
                  </div>
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
