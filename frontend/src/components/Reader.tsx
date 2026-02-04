import { useEffect, useState } from "react";

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
  contentRaw: string;
  contentTranslated: string | null;
  status: "pending" | "translating" | "completed" | "failed";
}

export const Reader = ({
  chapterId,
  onBack,
}: {
  chapterId: number;
  onBack: () => void;
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const fetchChapter = async () => {
      try {
        const res = await fetch(`http://localhost:4000/chapters/${chapterId}`);
        if (!res.ok) return;

        const data = await res.json();
        setChapter(data);

        if (data.status !== "completed" && data.status !== "failed") {
          timer = setTimeout(fetchChapter, 2000);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    fetchChapter();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [chapterId]);

  if (!chapter)
    return <div className="p-8 text-center">Loading chapter...</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 text-sm"
          >
            ← Exit Reader
          </button>
          <h1 className="font-bold text-slate-800">
            Chapter {chapter.chapterNumber}: {chapter.title || "Untitled"}
          </h1>
        </div>
        <span
          className={`text-xs font-bold uppercase px-2 py-1 rounded-sm ${
            chapter.status === "completed"
              ? "bg-green-100 text-green-700"
              : chapter.status === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {chapter.status}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-8 border-r border-slate-100 font-serif text-lg leading-relaxed text-slate-700">
          <div className="max-w-2xl mx-auto whitespace-pre-wrap">
            {chapter.contentRaw}
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto p-8 bg-slate-50 font-serif text-lg leading-relaxed text-slate-800">
          <div className="max-w-2xl mx-auto whitespace-pre-wrap">
            {chapter.contentTranslated || (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                {chapter.status === "translating" ? (
                  <div className="animate-pulse">
                    Ollama is translating using Qwen...
                  </div>
                ) : (
                  "Awaiting translation..."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
