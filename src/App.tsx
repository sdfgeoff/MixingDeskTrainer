import { useState, useRef, useEffect, useMemo } from 'react';
import EQControl from './components/EQControl';
import { EQBand, MixerSettings } from './components/MixerModel';
import EQView from './components/EQView';
import { PEQ } from './components/PEQ';



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
];

function App() {
  const [mixerSettings, setMixerSettings] = useState<MixerSettings>({
    parametricEq: [
      { gain: 0, frequency: 60, q: 1, name: 'LF' },
      { gain: 0, frequency: 250, q: 1, name: 'LM' },
      { gain: 0, frequency: 1000, q: 1, name: 'HM' },
      { gain: 0, frequency: 8000, q: 1, name: 'HF' },
    ]
  });

  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement>();
  const source = useSourceNode(audioElement, audioContext);

  const userEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return createEqFilterChain(audioContext, mixerSettings.parametricEq.length);
  }, [audioContext, mixerSettings.parametricEq.length]);

  const hiddenEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined
    }
    return createEqFilterChain(audioContext, mixerSettings.parametricEq.length);
  }, [audioContext, mixerSettings.parametricEq.length]);

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


  // Connect source -> hidden filters -> main filters -> destination
  useEffect(() => {
    if (source && userEqFilters && hiddenEqFilters && audioContext) {
      const firstHiddenFilter = hiddenEqFilters[0];
      source.connect(firstHiddenFilter);

      const lastHiddenFilter = hiddenEqFilters[hiddenEqFilters.length - 1];
      const firstUserFilter = userEqFilters[0];
      lastHiddenFilter.connect(firstUserFilter);

      const lastUserFilter = userEqFilters[userEqFilters.length - 1];
      const destination = audioContext.destination;
      lastUserFilter.connect(destination);

      return () => {
        source.disconnect();
        lastHiddenFilter.disconnect();
        lastUserFilter.disconnect();
      }
    }
  }, [source, userEqFilters, hiddenEqFilters, audioContext]);




  // Sync change from eqSettings to the biquad filters
  useEffect(() => {
    if (userEqFilters) {
      mixerSettings.parametricEq.forEach((band, index) => {
        const filter = userEqFilters[index];
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        filter.gain.value = band.gain;
      });
    }
  }, [userEqFilters, mixerSettings]);

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

        console.log(filter.frequency.value, filter.Q.value, filter.gain.value);
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

  return (
    <div>
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
      <div style={{opacity: 0.5, fontSize:"0.8rem"}}>
        {/* If the current audio source matches one of the known sources, display it's description */}
        {audioTracks.find(track => audioElement?.src.endsWith(track.src))?.description}
      </div>
      <audio ref={setAudioElement} controls onPlay={initAudioContext} />

      <h1>Game</h1>
      <button onClick={scrambleHiddenEq} >Scramble EQ</button>
      <button onClick={resetHiddenEq}>Reset EQ</button>


      <h1>Parametric EQ Controls</h1>
      <PEQ
        bands={mixerSettings.parametricEq}
        onChange={(updater) => setMixerSettings((prev) => ({
          ...prev,
          parametricEq:  updater(prev.parametricEq)
        }))}
        />


      <EQView
        bands={mixerSettings.parametricEq}
      />
    </div>
  );
}

export default App;
