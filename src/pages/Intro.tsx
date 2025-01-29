import { Panel } from "../components/Panel";
import { PADDING } from "../StyleConstants";

const Intro = () => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: PADDING.small,
        padding: PADDING.medium,
      }}
    >
      <Panel heading="intro">
        <p>
          A modern mixing panel has a lot of buttons and dials, and it can be
          intimidating to figure out what they all do if you don't have existing
          experience on a desk, or someone to show you what they all do. A live
          performance and even rehearsals are not the best time to play around,
          so it can be hard to find a place to practice.
        </p>
        <p>
          This website intends to provide training resources for teaching people
          to use a modern mixing desk including EQing, mixing multiple channels
          etc. It won't provide a complete simulation of the desk, but should be
          adequate to train the skills for day-to-day running of an existing
          setup. The desk is roughly based on an Allen & Heath QU-16 as that is
          what I have access to.
        </p>
      </Panel>
      <Panel heading="More Details">
        <p>
          This is a project developed by{" "}
          <a href="www.sdfgeoff.space">sdfgeoff</a> in my free time, and all the
          code (and known issues) is available over on the{" "}
          <a href="https://github.com/sdfgeoff/MixingDeskTrainer">
            projects Github
          </a>
          .{" "}
        </p>
      </Panel>
    </div>
  );
};

export default Intro;
