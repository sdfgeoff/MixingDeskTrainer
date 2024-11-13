import { useState, useRef, useEffect, useMemo } from 'react';
import KnobControl from './components/KnobControl';
import { EQBand, ChannelSettings, Mod, ParametricEq } from './components/MixerModel';
import EQView from './components/EQView';
import { PEQ } from './components/PEQ';
import { COLORS, PADDING } from './StyleConstants';
import { Panel } from './components/Panel';



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


const useSourceNode = (audioElement: HTMLAudioElement | undefined, audioContext: AudioContext | undefined) => {
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
    preamp: {
      gainDb: 0.5
    }
  });

  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement>();
  const source = useSourceNode(audioElement, audioContext);

  const [outputLevel, setOutputLevel] = useState<number>(0);

  const numBands = mixerSettings.parametricEq.bands.length;


  const userEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return createEqFilterChain(audioContext, numBands);
  }, [audioContext, numBands]);

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






  // Connect source -> hidden filters -> gain Node -> main filters -----> destination
  //                                                                 '--> analyzer 
  useEffect(() => {
    if (source && userEqFilters && hiddenEqFilters && audioContext && gainNode && analyzerNode) {
      const firstHiddenFilter = hiddenEqFilters[0];
      source.connect(firstHiddenFilter);

      const lastHiddenFilter = hiddenEqFilters[hiddenEqFilters.length - 1];
      const firstUserFilter = userEqFilters[0];
      lastHiddenFilter.connect(gainNode);
      gainNode?.connect(firstUserFilter)

      const lastUserFilter = userEqFilters[userEqFilters.length - 1];
      const destination = audioContext.destination;
      lastUserFilter.connect(destination);

      lastUserFilter.connect(analyzerNode);

      return () => {
        source.disconnect();
        gainNode.disconnect();
        lastHiddenFilter.disconnect();
        lastUserFilter.disconnect();
      }
    }
  }, [source, userEqFilters, hiddenEqFilters, audioContext]);




  // Sync change from eqSettings to the biquad filters
  useEffect(() => {
    if (userEqFilters) {
      mixerSettings.parametricEq.bands.forEach((band, index) => {
        const filter = userEqFilters[index];
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        filter.gain.value = band.gainDb;
      });
    }
  }, [userEqFilters, mixerSettings.parametricEq]);

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
      <div style={{display: 'flex', flexDirection: 'column', gap: PADDING.medium, alignItems: 'start'}}>
      <div style={{ display: 'flex', alignItems: 'start', gap: PADDING.medium }}>
        <Panel heading="Preamp">
          <KnobControl value={mixerSettings.preamp.gainDb} min={-18} max={18} onChange={(val) => setMixerSettings((prev) => {
            return {
              ...prev,
              preamp: {
                ...prev.preamp,
                gainDb: val
              }
            }
          })} /><br />Gain
        </Panel>
        <Panel heading="Parametric EQ">
          <PEQ
            eqSettings={mixerSettings.parametricEq}
            onChangeEq={setEqValues}
          />
        </Panel>
      </div>

      <Panel heading="Touch Screen">
        <EQView
          eqSettings={mixerSettings.parametricEq}
        />
      </Panel>
      </div>

      <div>
        Pk: <div style={{
          width: '1em',
          height: '1em',
          backgroundColor: outputLevel > 10 ? "red" : "grey"
        }} />
        0DB: <div style={{
          width: '1em',
          height: '1em',
          backgroundColor: outputLevel > -0 ? "green" : "grey"
        }} />
        Sig: <div style={{
          width: '1em',
          height: '1em',
          backgroundColor: outputLevel > -30 ? "green" : "grey"
        }} />

      </div>
    </div>
  );
}

export default App;
