import { AudioTrack } from "./components/Panels/TrackPicker";

// Define a list of pre-existing audio tracks
export const AUDIO_SOURCES_MULTITRACK: AudioTrack[] = [
  {
    name: "Mighty Name",
    src: "multitrack/MightyName/data.json",
    description: "Mighty Name sung at our local church",
  },
];

export const AUDIO_SOURCES_MONO: AudioTrack[] = [
  {
    name: "CS Lewis on Prayer",
    src: "mono/c.s.lewis-original-recording.mp3",
    description:
      "A recording of CS Lewis himself talking about prayer. This was recorded in 1944 and became the book 'Mere Christianity'. This track has some strange recording artifacts due to it's age.",
  },
  {
    name: "Piano Improvisation",
    src: "mono/all-creatures-of-our-god-and-king-piano-improvisation-247210.mp3",
    description:
      "An improvisation on All Creatures of our God and King done by smccleery (sourced from pixabay.com)",
  },
  {
    name: "Keith Bible Reading",
    src: "mono/KeithBibleReading.mp3",
    description: "Bible Reading at a Lecturn Microphone",
  },
];
