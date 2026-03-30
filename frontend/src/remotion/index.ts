import React from "react";
import { Composition } from "remotion";
import { ProductDemo } from "./compositions/ProductDemo";
import { VIDEO_CONFIG } from "./constants";

export const RemotionRoot: React.FC = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: "ProductDemo",
      component: ProductDemo,
      durationInFrames: VIDEO_CONFIG.durationInFrames,
      fps: VIDEO_CONFIG.fps,
      width: VIDEO_CONFIG.width,
      height: VIDEO_CONFIG.height,
    })
  );
};
