"use client";

import type { Message, ExerciseVideo } from "@/lib/types";

function ExerciseEmbed({ video }: { video: ExerciseVideo }) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-surface">
      {video.thumbnail1 && (
        <div className="relative w-full h-36 bg-surface-alt">
          <img
            src={video.thumbnail1}
            alt={video.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="font-medium text-sm text-text">{video.name}</p>
        {video.category1 && (
          <span className="inline-block mt-1 text-xs bg-accent-light text-accent-dark rounded-full px-2 py-0.5">
            {video.category1}
          </span>
        )}
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isCoach = message.role === "assistant" || message.role === "coach";

  if (isCoach) {
    return (
      <div className="flex items-start gap-3 px-4 py-2 max-w-[85%]">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </div>
        <div>
          <div
            className="coach-message bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-text"
            dangerouslySetInnerHTML={{ __html: message.content_html || message.content }}
          />
          {message.exercise_videos?.map((video) => (
            <ExerciseEmbed key={video.token} video={video} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end px-4 py-2">
      <div className="max-w-[75%] bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
        {message.content}
      </div>
    </div>
  );
}
