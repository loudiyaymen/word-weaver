import { useState, useEffect, useCallback } from "react";
import { Reader } from "./components/Reader";
import { GlossaryPage } from "./pages/GlossaryPage";

interface Novel {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  description: string | null;
}

interface ChapterSummary {
  id: number;
  chapterNumber: number;
  title: string | null;
  status: string;
  progress: number;
}

function App() {
  // Navigation & Core State (might change to react router)
  const [view, setView] = useState<
    "library" | "dashboard" | "glossary" | "reader"
  >("library");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);

  const [showNovelModal, setShowNovelModal] = useState(false);
  const [newNovel, setNewNovel] = useState({
    title: "",
    author: "",
    coverUrl: "",
  });
  const [rawInput, setRawInput] = useState("");
  const [chapterNum, setChapterNum] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState("");

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4000/novels");
      if (res.ok) {
        const data = await res.json();
        setNovels(data);
      }
    } catch (e) {
      console.error("Library fetch failed", e);
    }
  }, []);

  const fetchChapters = useCallback(async (id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/novels/${id}/chapters`);
      if (res.ok) {
        const data: ChapterSummary[] = await res.json();
        setChapters(data);
        if (data.length > 0) {
          const maxNum = Math.max(
            ...data.map((c: ChapterSummary) => c.chapterNumber),
          );
          setChapterNum(maxNum + 1);
        } else {
          setChapterNum(1);
        }
      }
    } catch (e) {
      console.error("Chapters fetch failed", e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (view === "library") {
      const load = async () => {
        const res = await fetch("http://localhost:4000/novels");
        const data = await res.json();
        if (!ignore) setNovels(data);
      };
      load();
    }
    return () => {
      ignore = true;
    };
  }, [view]);

  useEffect(() => {
    let ignore = false;
    if (selectedNovel) {
      const load = async () => {
        const res = await fetch(
          `http://localhost:4000/novels/${selectedNovel.id}/chapters`,
        );
        const data = await res.json();
        if (!ignore) {
          setChapters(data);
          if (data.length > 0) {
            const maxNum = Math.max(
              ...data.map((c: ChapterSummary) => c.chapterNumber),
            );
            setChapterNum(maxNum + 1);
          }
        }
      };
      load();
    }
    return () => {
      ignore = true;
    };
  }, [selectedNovel]);

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://localhost:4000/novels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNovel),
    });
    if (res.ok) {
      setShowNovelModal(false);
      setNewNovel({ title: "", author: "", coverUrl: "" });
      fetchLibrary();
    }
  };

  const handleSubmitChapter = async () => {
    if (!selectedNovel) return;
    const res = await fetch(
      `http://localhost:4000/novels/${selectedNovel.id}/chapters`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentRaw: rawInput,
          chapterNumber: chapterNum,
          title: chapterTitle,
        }),
      },
    );
    const chapter = await res.json();
    fetch(`http://localhost:4000/chapters/${chapter.id}/translate`, {
      method: "POST",
    });

    setActiveChapterId(chapter.id);
    setView("reader");
    setRawInput("");
    setChapterTitle("");
  };

  if (view === "reader" && activeChapterId) {
    return (
      <Reader
        chapterId={activeChapterId}
        onBack={() => {
          setView("dashboard");
          if (selectedNovel) fetchChapters(selectedNovel.id);
        }}
      />
    );
  }

  if (view === "glossary" && selectedNovel) {
    return (
      <GlossaryPage
        novelId={selectedNovel.id}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "library") {
    return (
      <div className="min-h-screen bg-slate-50 p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Library
            </h1>
            <button
              onClick={() => setShowNovelModal(true)}
              className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              + Add Novel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {novels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => {
                  setSelectedNovel(novel);
                  setView("dashboard");
                }}
                className="group cursor-pointer"
              >
                <div className="aspect-2/3 bg-white rounded-xl mb-3 overflow-hidden shadow-sm group-hover:shadow-xl transition-all border border-slate-200 flex items-center justify-center">
                  {novel.coverUrl ? (
                    <img
                      src={novel.coverUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-300 font-bold p-4 text-center">
                      {novel.title}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 truncate">
                  {novel.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {novel.author || "Unknown Author"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {showNovelModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <form
              onSubmit={handleCreateNovel}
              className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Add New Novel</h2>
              <div className="space-y-4">
                <input
                  placeholder="Novel Title"
                  className="w-full p-2 border rounded"
                  value={newNovel.title}
                  onChange={(e) =>
                    setNewNovel({ ...newNovel, title: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Author"
                  className="w-full p-2 border rounded"
                  value={newNovel.author}
                  onChange={(e) =>
                    setNewNovel({ ...newNovel, author: e.target.value })
                  }
                />
                <input
                  placeholder="Cover Image URL"
                  className="w-full p-2 border rounded"
                  value={newNovel.coverUrl}
                  onChange={(e) =>
                    setNewNovel({ ...newNovel, coverUrl: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNovelModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setView("library")}
          className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"
        >
          Back to Library
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{selectedNovel?.title}</h1>
                <button
                  onClick={() => setView("glossary")}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Glossary
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Number
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={chapterNum}
                    onChange={(e) => setChapterNum(parseInt(e.target.value))}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Chapter Title"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                  />
                </div>
              </div>

              <textarea
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-serif mb-4"
                placeholder="Paste Chinese text here..."
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
              <button
                onClick={handleSubmitChapter}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Translate Chapter
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
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
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-sm">
                      Ch. {ch.chapterNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ch.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${ch.progress}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
