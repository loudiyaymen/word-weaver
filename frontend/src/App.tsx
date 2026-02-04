import { useState, useEffect, useCallback } from "react";
import { Reader } from "./components/Reader";
import { GlossaryPage } from "./pages/GlossaryPage";

interface ChapterSummary {
  id: number;
  chapterNumber: number;
  status: string;
  progress: number;
}

function App() {
  const [novelId, setNovelId] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [view, setView] = useState<"dashboard" | "glossary" | "reader">(
    "dashboard",
  );

  const fetchChapters = useCallback(async () => {
    if (!novelId) return;
    try {
      const res = await fetch(
        `http://localhost:4000/novels/${novelId}/chapters`,
      );
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } catch (e) {
      console.error("Failed to fetch chapters", e);
    }
  }, [novelId]);

  useEffect(() => {
    let ignore = false;
    if (novelId) {
      const load = async () => {
        const res = await fetch(
          `http://localhost:4000/novels/${novelId}/chapters`,
        );
        const data = await res.json();
        if (!ignore) setChapters(data);
      };
      load();
    }
    return () => {
      ignore = true;
    };
  }, [novelId]);

  const createNovel = async () => {
    const res = await fetch("http://localhost:4000/novels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My New Novel" }),
    });
    const data = await res.json();
    setNovelId(data.id);
  };

  const submitChapter = async () => {
    if (!novelId) return;
    const res = await fetch(
      `http://localhost:4000/novels/${novelId}/chapters`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRaw: rawInput }),
      },
    );
    const chapter = await res.json();
    fetch(`http://localhost:4000/chapters/${chapter.id}/translate`, {
      method: "POST",
    });
    setActiveChapterId(chapter.id);
    setView("reader");
    setRawInput("");
  };

  if (view === "reader" && activeChapterId) {
    return (
      <Reader
        chapterId={activeChapterId}
        onBack={() => {
          setView("dashboard");
          fetchChapters();
        }}
      />
    );
  }

  if (view === "glossary" && novelId) {
    return (
      <GlossaryPage novelId={novelId} onBack={() => setView("dashboard")} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">WordWeaver</h1>
          {!novelId ? (
            <button
              onClick={createNovel}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700"
            >
              Start New Translation Project
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  New Chapter
                </label>
                <button
                  onClick={() => setView("glossary")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Glossary
                </button>
              </div>
              <textarea
                className="w-full h-48 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-serif"
                placeholder="Paste raw text here..."
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
              <button
                onClick={submitChapter}
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800"
              >
                Process Chapter
              </button>
            </div>
          )}
        </div>

        {novelId && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              History
            </h2>
            <div className="space-y-3 max-h-125 overflow-y-auto pr-2">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChapterId(ch.id);
                    setView("reader");
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-700">
                      Chapter {ch.chapterNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ch.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-700"
                      style={{ width: `${ch.progress}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
