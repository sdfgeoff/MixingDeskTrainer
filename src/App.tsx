import { useState, useRef, useEffect } from 'react';
import EQControl from './components/EQControl';
import { EQBand, MixerSettings } from './components/MixerModel';



// Define a list of pre-existing audio tracks
const audioTracks = [
  { name: 'Lxybam', src: 'lxybam.mp3' },
  { name: 'Sermon on Lazarus', src: '2021-05-19 - Raising Lazarus, Scene 1_ Lazarus is Dead - Paul Gordon (519211629596269).mp3' },
];

function App() {
  const [mixerSettings, setMixerSettings] = useState<MixerSettings>({
    parametricEq: [
      { gain: 0, frequency: 60, q: 1 },
      { gain: 0, frequency: 250, q: 1 },
      { gain: 0, frequency: 1000, q: 1 },
      { gain: 0, frequency: 8000, q: 1 },
    ]
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && audioElementRef.current) {
      audioElementRef.current.src = URL.createObjectURL(file);
    }
  };

  const handleTrackSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (audioElementRef.current) {
      audioElementRef.current.src = event.target.value;
    }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioElement = audioElementRef.current!;
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // Set up 4 EQ filters
      const filters = mixerSettings.parametricEq.map(band => createEQFilter(band.frequency));
      eqFiltersRef.current = filters;

      // Connect filters in series and to destination
      filters.forEach((filter, idx) => {
        if (idx === 0) {
          source.connect(filter);
        } else {
          filters[idx - 1].connect(filter);
        }
      });

      filters[filters.length - 1].connect(audioContextRef.current.destination);
    }
  };

  const createEQFilter = (frequency: number): BiquadFilterNode => {
    const filter = audioContextRef.current!.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 1;
    filter.gain.value = 0;
    return filter;
  };

  const modEqSetting = (index: number, mod: (f: EQBand) => EQBand) => {
    setMixerSettings(prev => ({
      ...prev,
      parametricEq: prev.parametricEq.map((band, idx) =>
        idx === index ? mod(band) : band
      )
    })
    );
  };


  // Sync change from eqSettings to the biquad filters
  useEffect(() => {
    if (audioContextRef.current) {
      mixerSettings.parametricEq.forEach((band, index) => {
        const filter = eqFiltersRef.current[index];
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        filter.gain.value = band.gain;
      });
    }
  }, [mixerSettings]);

  return (
    <div>
      <div>
        <h3>Select an existing track:</h3>
        <select onChange={handleTrackSelect}>
          <option value="">Choose a track</option>
          {audioTracks.map((track, index) => (
            <option key={index} value={track.src}>
              {track.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3>Or upload your own track:</h3>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
      </div>

      <audio ref={audioElementRef} controls onPlay={initAudioContext} />


      <h1>Parametric EQ</h1>


      <table className="eq-controls-table">
        <tbody>
          <tr>
            {mixerSettings.parametricEq.map((band, index) => (
              <td key={`freq-${index}`}>
                <EQControl
                  value={band.frequency}
                  min={60}
                  max={20000}
                  onChange={(newVal) => modEqSetting(index, (prev) => ({
                    ...prev,
                    frequency: newVal
                  }))}
                />
                Frequency
              </td>
            ))}
          </tr>
          <tr>
            {mixerSettings.parametricEq.map((band, index) => (
              <td key={`q-${index}`}>
                <EQControl
                  value={band.q}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={(newVal) => modEqSetting(index, (prev) => ({
                    ...prev,
                    q: newVal
                  }))}
                />
                Width
              </td>
            ))}
          </tr>
          <tr>
            {mixerSettings.parametricEq.map((band, index) => (
              <td key={`gain-${index}`}>
                <EQControl
                  value={band.gain}
                  min={-12}
                  max={12}
                  onChange={(newVal) => modEqSetting(index, (prev) => ({
                    ...prev,
                    gain: newVal
                  }))}
                />
                Gain
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default App;
