import { useState, useEffect, useCallback } from "react";
import { Reader } from "./components/Reader";
import { GlossaryPage } from "./pages/GlossaryPage";
import { WorldBiblePage } from "./pages/WorldBiblePage";
import { NovelDetail } from "./pages/NovelDetail";

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
  const [view, setView] = useState<
    "library" | "dashboard" | "glossary" | "reader" | "bible"
  >("library");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);

  const [showNovelModal, setShowNovelModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);

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

  const handleBatchTranslate = async () => {
    if (!selectedNovel) return;

    if (
      !window.confirm("Queue all pending chapters for background translation?")
    )
      return;

    const res = await fetch(
      `http://localhost:4000/novels/${selectedNovel.id}/translate-pending`,
      {
        method: "POST",
      },
    );

    if (res.ok) {
      fetchChapters(selectedNovel.id);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (
      !window.confirm("Are you sure you want to delete this chapter forever?")
    )
      return;

    const res = await fetch(`http://localhost:4000/chapters/${id}`, {
      method: "DELETE",
    });
    if (res.ok && selectedNovel) {
      fetchChapters(selectedNovel.id);
    }
  };

  const handleCreateNovel = async (e: React.SubmitEvent<HTMLFormElement>) => {
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

  const handleSubmitChapter = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    if (res.ok) {
      setShowChapterModal(false);
      setRawInput("");
      setChapterTitle("");
      fetchChapters(selectedNovel.id);
    }
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

  if (view === "bible" && selectedNovel) {
    return (
      <WorldBiblePage
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

  if (selectedNovel) {
    return (
      <>
        <NovelDetail
          novel={selectedNovel}
          chapters={chapters}
          onBack={() => setView("library")}
          onTranslate={(id: number) => {
            setActiveChapterId(id);
            setView("reader");
          }}
          onGlossary={() => setView("glossary")}
          onDeleteChapter={handleDeleteChapter}
          onBatchTranslate={handleBatchTranslate}
          onAddChapter={() => setShowChapterModal(true)}
        />

        {showChapterModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleSubmitChapter}
              className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6">Add New Chapter</h2>

              <div className="flex gap-4 mb-4">
                <div className="w-1/4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Number
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={chapterNum}
                    onChange={(e) => setChapterNum(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="e.g. The Awakening"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Raw Chinese Content
                </label>
                <textarea
                  className="w-full flex-1 p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-serif resize-none min-h-50"
                  placeholder="Paste raw text here..."
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="flex-1 px-4 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save as Pending
                </button>
              </div>
            </form>
          </div>
        )}
      </>
    );
  }

  return null;
}

export default App;
