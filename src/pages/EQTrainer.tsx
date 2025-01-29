import { useState, useEffect, useMemo } from "react";
import { Filters, Mod, ParametricEq } from "../components/MixerModel";
import EQView from "../components/EQView";
import { PEQPanel } from "../components/Panels/PEQPanel";
import { COLORS, PADDING } from "../StyleConstants";
import { MinimizablePanel, Panel } from "../components/Panel";
import { useAudioLevel } from "../hooks/useAudioLevel";
import PreampPanel from "../components/Panels/PreampPanel";
import { HighPassFilterPanel } from "../components/Panels/HighPassFilterPanel";
import { useAudioDestination } from "../hooks/useAudioDestination";
import AudioPanelMono from "../components/Panels/AudioPanelMono";
import { createEqFilterChain } from "../audioProcessing/EqFilterChain";
import { createChannelNodes, syncChannelProcessingToMixerModel } from "../audioProcessing/InputChannelProcessing";
import { AUDIO_SOURCES_MONO } from "../AvailableAudio";
import LevelIndicatorFromNode from "../components/LevelIndicatorFromNode";
import { LEVEL_INDICATOR_LEDS_FULL } from "../components/LevelIndicatorPresets";


const INITIAL_SETTINGS: Filters = {
  parametricEq: {
    bands: [
      { gainDb: 0, frequency: 60, q: 1, name: "LF" },
      { gainDb: 0, frequency: 250, q: 1, name: "LM" },
      { gainDb: 0, frequency: 1000, q: 1, name: "HM" },
      { gainDb: 0, frequency: 8000, q: 1, name: "HF" },
    ],
    enabled: true,
  },
  highPassFilter: {
    frequency: 100,
    q: 0.707,
    enabled: true,
  },
  preamp: {
    gainDb: 0.5,
  },
};

const EQTrainer: React.FC = () => {
  const [mixerSettings, setMixerSettings] = useState<Filters>(INITIAL_SETTINGS);

  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode>();

  const numBands = mixerSettings.parametricEq.bands.length;


  const hiddenEqFilters = useMemo(() => {
    if (!audioContext) {
      return undefined;
    }
    return createEqFilterChain(audioContext, numBands);
  }, [audioContext, numBands]);


  const channelProcessing = useMemo(() => {
    if (!audioContext || !hiddenEqFilters) {
      return undefined;
    }
    return createChannelNodes(audioContext, numBands);
  }, [audioContext, hiddenEqFilters, numBands]);


  // Connect source -> hidden filters -> gain Node -> highpass -> user peq filters -----> destination
  useEffect(() => {
    if (
      sourceNode &&
      hiddenEqFilters &&
      audioContext &&
      channelProcessing
    ) {
      const firstHiddenFilter = hiddenEqFilters[0];
      sourceNode.connect(firstHiddenFilter);

      const lastHiddenFilter = hiddenEqFilters[hiddenEqFilters.length - 1];
      lastHiddenFilter.connect(channelProcessing.preamp);

      return () => {
        sourceNode.disconnect(firstHiddenFilter);
        lastHiddenFilter.disconnect(channelProcessing.preamp);
      };
    }
  }, [
    sourceNode,
    hiddenEqFilters,
    audioContext,
    channelProcessing,
  ]);

  const outputNode = channelProcessing?.pan.right;

  const preampLevel = useAudioLevel(audioContext, channelProcessing?.preamp);

  useAudioDestination(
    audioContext,
    outputNode,
  );

  // Sync change from eqSettings to the biquad filters
  useEffect(() => {
    if (channelProcessing) {
      syncChannelProcessingToMixerModel(channelProcessing, {
        filters: mixerSettings,
        name: "",
        mute: { state: false },
        pan: { pan: 0 },
        source: { channel: 0 },
     });
    }
  }, [mixerSettings, channelProcessing]);

  const scrambleHiddenEq = () => {
    if (hiddenEqFilters) {
      hiddenEqFilters.forEach((filter) => {
        // Log compensate frequency
        filter.frequency.value = Math.pow(10, Math.random() * 3) * 20;
        filter.Q.value = Math.random() * 10;

        filter.gain.value = -Math.random() * 20;
        // Generate random gain evenly spaced in audible range
        // Math.pow(10, gain / 40);
        //filter.gain.value = Math.pow(10, (-Math.random()) * 80 / 40) * 24;
      });
    }
  };

  const resetHiddenEq = () => {
    if (hiddenEqFilters) {
      hiddenEqFilters.forEach((filter) => {
        filter.frequency.value = 100;
        filter.Q.value = 1;
        filter.gain.value = 0;
      });
    }
  };

  const setEqValues = (updater: Mod<ParametricEq>) =>
    setMixerSettings((prev) => ({
      ...prev,
      parametricEq: updater(prev.parametricEq),
    }));

  const resetMainEq = () => {
    setMixerSettings(() => INITIAL_SETTINGS);
  };

  return (
    <div
      style={{
        background: COLORS.background,
        color: COLORS.text,
        display: "flex",
        flexDirection: "column",
        gap: PADDING.small,
        padding: PADDING.medium,
      }}
    >
      <MinimizablePanel
        heading="Understanding the controls"
        color={COLORS.interact_color}
        startExpanded={false}
      >
        <p>
          This page provides the controls for a single audio channel, which
          includes a preamp, high pass filter and a parametric Equalizer.
        </p>
        <h2>"In" buttons</h2>
        <p>
          Many audio processing effects have an "In" button. This button is used
          to enable or disable the audio effect. When the button is "In" (green)
          the control is enabled, when the button is "Out" (grey) the control is
          disabled.
        </p>
        <h2>Preamp</h2>
        <p>
          When a microphone is connected to the mixing desk, it's signal is
          often very quiet, and further processing (eg the paraetric equalizer)
          make it quieter still. In order to have and audible signal coming out
          of the desk, when the signal arrives at the desk it is amplified by
          the "preamp". Next to the preamp knob there is a red LED labeled "Pk",
          this LED lights up if the output of the preamp is peaking (too loud),
          which would cause the signal to distort. When picking a preamp level,
          you generally want to make sure that the the signal doesn't peak, but
          is still loud enough to be used.
        </p>
        <h2>High Pass Filter (HPF)</h2>
        <p>
          The high pass filter is used to remove low frequency noise from the
          signal (low frequencies are bass notes). Some common noises that can
          be picked up by a microphone that the High Pass Filter is used to
          remove include wind blowing across the microphone, or "Pop's" from
          when a speaker says a word that starts with a 'P'. Generally you want
          the high pass filter set as low as possible so it doens't remove any
          of the wanted audio, but high enough that it removes the noise. A high
          pass filter that is set too high will make the sound thin and tinny.
        </p>
        <p>The high pass filter can be seen on the screen as a purple line.</p>
        <h2>Parametric Equalizer (PEQ)</h2>
        <p>
          The parametric equalizer is used to adjust how loud the low
          frequencies are compared to the high frequencies. This particular
          parametric equalizer has 4 bands, each of which can be adjusted to
          boost or cut any frequency range. The abbreviations under the knobs
          are:
        </p>
        <ul>
          <li>LF - Low Frequency</li>
          <li>LM - Low Midrange</li>
          <li>HM - High Midrange</li>
          <li>HF - High Frequency</li>
        </ul>
        <p>
          But the frequency that is actually used is dependant on the Frequency
          knob for that band. Each band has 3 controls:
        </p>
        <ul>
          <li>Gain - How much to boost or cut the frequency range</li>
          <li>Frequency - What frequency to boost or cut</li>
          <li>
            Width - How wide the frequency range is. Although this is labelled
            "width" (as that is the easy way to think about it), the knob may go
            in the opposite direction to what you expect. This is because old
            analog desks had a concept called "Q" which is the inverse of
            "width"
          </li>
        </ul>
        <p>
          Adjusting the EQ is a bit of an art, and varies by instrument and
          voice. Too much bass can sound boomy, to little can be tinny. Too much
          treble can sound harsh, too little can sound muffled. EQing a voice
          can be challenging as the "Ssss" sound is very close to "T" and "D"
          sounds, so if you try to remove excessive "Ssss" sounds you may also
          remove the "T" and "D" sounds making the voice hard to hear.
        </p>
      </MinimizablePanel>
      <MinimizablePanel
        heading="Game"
        color={COLORS.interact_color}
        startExpanded={false}
      >
        <p>
          As a bit of a game, the input to this audio channel can be mutated by
          some hidden filters. This is to simulate the effect of a bad
          microphone (eg a lecturn microphone a long way from the speaker). The
          'Scramble EQ' button will randomize the hidden filters, and the 'Reset
          EQ' button will reset them to neutral so you can hear the original
          audio. I find that I have to hit the scramble button a few times to
          find one that you can I can actually hear.
        </p>
        <div style={{ display: "flex", gap: PADDING.small }}>
          <button onClick={scrambleHiddenEq}>Scramble EQ</button>
          <button onClick={resetHiddenEq}>Reset EQ</button>
        </div>
      </MinimizablePanel>

      <h1>Mixing Desk</h1>
      <button onClick={resetMainEq}>Reset Mixing Desk</button>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: PADDING.medium,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "start", gap: PADDING.medium }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: PADDING.medium,
            }}
          >
            <Panel heading="Preamp">
              <PreampPanel
                preamp={mixerSettings.preamp}
                preampLevel={preampLevel}
                onChangePreamp={(mod) =>
                  setMixerSettings((prev) => ({
                    ...prev,
                    preamp: mod(prev.preamp),
                  }))
                }
              />
            </Panel>
            <Panel heading="HPF">
              <HighPassFilterPanel
                highPassFilter={mixerSettings.highPassFilter}
                onChangeHighPassFilter={(mod) =>
                  setMixerSettings((prev) => ({
                    ...prev,
                    highPassFilter: mod(prev.highPassFilter),
                  }))
                }
              />
            </Panel>
          </div>
          <Panel heading="Screen">
            <PEQPanel
              eqSettings={mixerSettings.parametricEq}
              onChangeEq={setEqValues}
            />
          </Panel>
        </div>
        <div
          style={{ display: "flex", alignItems: "start", gap: PADDING.medium }}
        >
          <Panel heading="PEQ">
            <EQView
              eqSettings={mixerSettings.parametricEq}
              highPassFilter={mixerSettings.highPassFilter}
            />
          </Panel>
          <Panel>
            <LevelIndicatorFromNode audioContext={audioContext} listenTo={outputNode} indicatorLedGains={LEVEL_INDICATOR_LEDS_FULL} />
          </Panel>
        </div>
      </div>

      <Panel heading="Audio Source" color={COLORS.interact_color}>
        <AudioPanelMono
          audioTracks={AUDIO_SOURCES_MONO}
          setAudioContext={setAudioContext}
          setAudioSource={setSourceNode}
        />
      </Panel>
    </div>
  );
}

export default EQTrainer;
