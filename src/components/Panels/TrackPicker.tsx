import React from "react";

export interface AudioTrack {
    name: string,
    src: string,
    description: string,
    source?: "user" | "default"
}


const TrackPicker: React.FC<{ audioTracks: AudioTrack[], onSelect: (track: AudioTrack | undefined) => void, selectedTrack: AudioTrack | undefined }> = ({ audioTracks, onSelect, selectedTrack }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return
        }
        onSelect({
            name: file?.name ?? 'Unknown',
            description: 'User uploaded track',
            src: URL.createObjectURL(file),
            source: 'user'
        })
    }

    const handleTrackSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // Find track by src and event.target.value
        const track = audioTracks.find(t => t.src === event.target.value);
        onSelect(track ? {
            ...track,
            source: 'default'
        } : undefined);
    };

    return <div style={{ flexGrow: 1 }}>
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
            {selectedTrack?.description}
        </div>
    </div>
}

export default TrackPicker;