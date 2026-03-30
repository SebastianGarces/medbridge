"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { ExercisesPageData, ProgramExercise, ExerciseVideo } from "@/lib/types";

function ProgramExerciseCard({
  exercise,
  onComplete,
}: {
  exercise: ProgramExercise;
  onComplete: (id: string) => void;
}) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await apiPost(`/api/patient/exercises/${exercise.exercise_id}/complete`);
      onComplete(exercise.exercise_id);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
      {exercise.thumbnail1 && (
        <a
          href={exercise.video_embed_url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-video bg-surface-alt block cursor-pointer group"
        >
          <img
            src={exercise.thumbnail1}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
          {exercise.completed_today ? (
            <div className="absolute inset-0 bg-success/10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </a>
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-text mb-1 line-clamp-1">
          {exercise.name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-accent-light text-accent-dark rounded-full px-2 py-0.5">
            {exercise.category1}
          </span>
          <span className="text-xs text-text-faint">
            {exercise.sets} x {exercise.reps}
          </span>
        </div>
        {exercise.completed_today ? (
          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Completed today
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {completing ? "Saving..." : "Mark Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

function BrowseExerciseCard({ video }: { video: ExerciseVideo }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
      {video.thumbnail1 && (
        <a
          href={video.video_embed_url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-video bg-surface-alt block cursor-pointer group"
        >
          <img
            src={video.thumbnail1}
            alt={video.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>
      )}
      <div className="p-3">
        <h3 className="text-sm font-medium text-text mb-1 line-clamp-1">
          {video.name}
        </h3>
        {video.category1 && (
          <span className="text-xs bg-surface text-text-muted rounded-full px-2 py-0.5">
            {video.category1}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  const [data, setData] = useState<ExercisesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    apiGet<ExercisesPageData>("/api/patient/exercises")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredVideos = useMemo(() => {
    if (!data) return [];
    if (activeCategory === "All") return data.all_videos;
    return data.all_videos.filter(
      (v) => v.category1 === activeCategory || v.category2 === activeCategory
    );
  }, [data, activeCategory]);

  const handleComplete = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      program_videos: data.program_videos.map((ex) =>
        ex.exercise_id === id ? { ...ex, completed_today: true } : ex
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark">
            <path d="M14.4 14.4 9.6 9.6" />
            <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
            <path d="m5.343 2.515a2 2 0 0 1 2.829 2.828l1.767-1.768a2 2 0 0 1 2.829 2.829L6.404 12.768a2 2 0 0 1-2.829-2.829l1.768-1.767a2 2 0 0 1-2.828-2.829z" />
          </svg>
        </div>
        <h2 className="font-semibold text-text mb-1">No Exercises Available</h2>
        <p className="text-sm text-text-muted">
          Your care team will assign exercises to your program
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-text mb-1">Exercises</h1>
      <p className="text-sm text-text-muted mb-8">
        Complete your daily exercises and browse the library
      </p>

      {/* Your Program */}
      {data.program_videos.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">Your Program</h2>
            <span className="text-xs text-text-faint">
              {data.program_videos.filter((e) => e.completed_today).length} of{" "}
              {data.program_videos.length} completed today
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.program_videos.map((exercise) => (
              <ProgramExerciseCard
                key={exercise.exercise_id}
                exercise={exercise}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Browse All */}
      {data.all_videos.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text mb-4">Browse All</h2>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === "All"
                  ? "bg-primary text-white"
                  : "bg-surface text-text-muted hover:bg-surface-alt"
              }`}
            >
              All
            </button>
            {data.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-surface text-text-muted hover:bg-surface-alt"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <BrowseExerciseCard key={video.token} video={video} />
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">
                No exercises found in this category
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
