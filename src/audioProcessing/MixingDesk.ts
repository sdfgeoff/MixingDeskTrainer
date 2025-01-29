import { useEffect, useRef } from "react";
import { MixerModel } from "../components/MixerModel";
import {
  ChannelNodes,
  createChannelNodes,
  syncChannelProcessingToMixerModel,
} from "./InputChannelProcessing";
import { createMixBus, MixBusNodes, syncMixBus } from "./MixBus";

export interface MixingDeskNodes {
  channels: ChannelNodes[];
  busses: MixBusNodes[];
}

export const createMixingDesk = (
  audioContext: AudioContext,
  numChannels: number,
  parametricEqSize: number,
  numBusses: number,
  numBands: number,
): MixingDeskNodes => {
  const channels = Array.from({ length: numChannels }, () =>
    createChannelNodes(audioContext, parametricEqSize),
  );
  const busses = Array.from({ length: numBusses }, () =>
    createMixBus(audioContext, numBands),
  );

  return {
    channels,
    busses,
  };
};

export const useSyncMixingDeskToMixerModel = (
  mixingDeskNodes: MixingDeskNodes | undefined,
  mixerModel: MixerModel,
): void => {
  useEffect(() => {
    mixerModel.channels.forEach((channel, index) => {
      const channelNodes = mixingDeskNodes?.channels[index];
      if (!channelNodes) {
        return;
      }
      syncChannelProcessingToMixerModel(channelNodes, channel);
    });
  }, [mixerModel, mixingDeskNodes]);

  useEffect(() => {
    mixerModel.busses.forEach((bus, index) => {
      const busNodes = mixingDeskNodes?.busses[index];
      if (!busNodes) {
        return;
      }
      syncMixBus(busNodes, bus);
    });
  }, [mixerModel, mixingDeskNodes]);

  const busBandChannelMapping: {
    busIndex: number;
    bandIndex: number;
    channelIndex: number;
  }[] = useDebouncedObject(
    mixerModel.busses.flatMap(
      (bus, busIndex) => {
        return bus.bands.map((band, bandIndex) => {
          return { busIndex, bandIndex, channelIndex: band.channelSource };
        });
      },
      [mixerModel.busses],
    ),
  );

  // Ensure busses are connected to their input channels
  useEffect(() => {
    busBandChannelMapping.forEach(({ busIndex, bandIndex, channelIndex }) => {
      const bandNodes = mixingDeskNodes?.busses[busIndex].bands[bandIndex];
      const channelNodes = mixingDeskNodes?.channels[channelIndex];
      if (!bandNodes || !channelNodes) {
        return;
      }
      channelNodes.pan.left.connect(bandNodes.fader.left);
      channelNodes.pan.right.connect(bandNodes.fader.right);
    });

    return () => {
      busBandChannelMapping.forEach(({ busIndex, bandIndex, channelIndex }) => {
        const bandNodes = mixingDeskNodes?.busses[busIndex].bands[bandIndex];
        const channelNodes = mixingDeskNodes?.channels[channelIndex];
        if (!bandNodes || !channelNodes) {
          return;
        }
        channelNodes.pan.left.disconnect(bandNodes.fader.left);
        channelNodes.pan.right.disconnect(bandNodes.fader.right);
      });
    };
  }, [mixingDeskNodes, busBandChannelMapping]);
};

// Hook that uses JSON.parse and JSON.stringify to debounce a hook by returning the same object reference if the JSON stringified version of the object is the same as the previous render
export const useDebouncedObject = <T extends object>(obj: T): T => {
  const previousJson = useRef<string | null>(null);
  const previousObj = useRef<T>(obj);

  const jsonString = JSON.stringify(obj);
  if (jsonString !== previousJson.current) {
    previousJson.current = jsonString;
    previousObj.current = JSON.parse(jsonString);
  }

  return previousObj.current;
};
