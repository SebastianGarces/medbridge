"use client";

import dynamic from "next/dynamic";
import ScrollReveal from "./ScrollReveal";

const RemotionPlayer = dynamic(() => import("./VideoPlayer"), { ssr: false });

export default function VideoSection() {
  return (
    <section id="demo" className="py-20 md:py-32 bg-surface">
      <ScrollReveal>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-text tracking-tight mb-2">
            Product Demo
          </h2>
          <p className="text-text-muted text-lg mb-10">
            30-second architecture walkthrough
          </p>
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-black" style={{ aspectRatio: "16/9" }}>
            <RemotionPlayer />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
