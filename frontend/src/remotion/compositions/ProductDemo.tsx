import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";

import { ColdOpenScene } from "../scenes/ColdOpenScene";
import { ChatShowcaseScene } from "../scenes/ChatShowcaseScene";
import { DashboardShowcaseScene } from "../scenes/DashboardShowcaseScene";
import { ClosingScene } from "../scenes/ClosingScene";
import { BRAND } from "../constants";

/**
 * Product Demo — 900 frames at 30 fps (30 seconds)
 *
 * Scene 1: Cold Open          150 frames (5s)    — Dark cinematic stat reveal
 * ── fade              ──      10 frames (0.33s)  — Dissolve dark → warm
 * Scene 2: Chat Showcase      300 frames (10s)   — Floating chat fragments
 * ── slide(from-right) ──      10 frames (0.33s)  — Dashboard slides in
 * Scene 3: Dashboard          270 frames (9s)    — Clinician oversight fragments
 * ── fade              ──      10 frames (0.33s)  — Dissolve to closing
 * Scene 4: Closing            210 frames (7s)    — Value props + logo
 *
 * Total: 150 + 300 + 270 + 210 - 10 - 10 - 10 = 900
 */
export const ProductDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.surface }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <ColdOpenScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={300}>
          <ChatShowcaseScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={270}>
          <DashboardShowcaseScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={210}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
