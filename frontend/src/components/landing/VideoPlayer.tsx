"use client";

import React from "react";
import { Player } from "@remotion/player";
import { ProductDemo } from "@/remotion/compositions/ProductDemo";
import { VIDEO_CONFIG } from "@/remotion/constants";

export default function VideoPlayer() {
  return (
    <Player
      component={ProductDemo}
      durationInFrames={VIDEO_CONFIG.durationInFrames}
      fps={VIDEO_CONFIG.fps}
      compositionWidth={VIDEO_CONFIG.width}
      compositionHeight={VIDEO_CONFIG.height}
      controls={false}
      autoPlay={true}
      loop={true}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
