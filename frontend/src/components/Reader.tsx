import { useEffect, useState, useRef, useCallback } from "react";

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
  contentRaw: string;
  contentTranslated: string | null;
  status: "pending" | "translating" | "completed" | "failed";
  progress: number;
}

export const Reader = ({
  chapterId,
  onBack,
}: {
  chapterId: number;
  onBack: () => void;
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const fetchChapter = async () => {
      try {
        const res = await fetch(`http://localhost:4000/chapters/${chapterId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (!isMounted) return;

        setChapter((prev) => {
          if (!prev && data.progress > 0 && scrollRef.current) {
            const el = scrollRef.current;
            setTimeout(() => {
              el.scrollTop =
                (data.progress / 100) * (el.scrollHeight - el.clientHeight);
            }, 150);
          }
          return data;
        });

        if (data.status !== "completed" && data.status !== "failed") {
          pollTimer = setTimeout(fetchChapter, 2000);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    fetchChapter();
    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [chapterId]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;

    const progress = Math.round(
      (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100,
    );

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`http://localhost:4000/chapters/${chapterId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
    }, 1500);
  }, [chapterId]);

  if (!chapter)
    return (
      <div className="p-8 text-center text-slate-400 italic">
        Opening the Weaver's scroll...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 text-sm font-medium"
          >
            ← Dashboard
          </button>
          <h1 className="font-bold text-slate-800 underline decoration-blue-200">
            Chapter {chapter.chapterNumber}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-slate-400">
            {chapter.progress}% Read
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm ${
              chapter.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {chapter.status}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-12 border-r border-slate-50 font-serif text-lg leading-relaxed text-slate-700/80">
          <div className="max-w-2xl mx-auto whitespace-pre-wrap">
            {chapter.contentRaw}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-1/2 overflow-y-auto p-12 bg-slate-50/50 font-serif text-xl leading-relaxed text-slate-900 selection:bg-blue-100"
        >
          <div className="max-w-2xl mx-auto whitespace-pre-wrap">
            {chapter.contentTranslated || (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                <div className="animate-pulse mb-4">
                  Translating with intent...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
