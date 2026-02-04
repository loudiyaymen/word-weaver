import { useState } from "react";
import { Reader } from "./components/Reader";
import { GlossaryPage } from "./pages/GlossaryPage";

function App() {
  const [novelId, setNovelId] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [view, setView] = useState<"dashboard" | "glossary" | "reader">(
    "dashboard",
  );

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
  };

  // View Logic
  if (view === "reader" && activeChapterId) {
    return (
      <Reader chapterId={activeChapterId} onBack={() => setView("dashboard")} />
    );
  }

  if (view === "glossary" && novelId) {
    return (
      <GlossaryPage novelId={novelId} onBack={() => setView("dashboard")} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">WordWeaver</h1>

        {!novelId ? (
          <button
            onClick={createNovel}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Translation Project
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-600 uppercase tracking-wider">
                Paste Chinese Content
              </label>
              <button
                onClick={() => setView("glossary")}
                className="text-sm text-blue-600 hover:underline"
              >
                Manage Glossary
              </button>
            </div>

            <textarea
              className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-serif"
              placeholder="Paste raw text here..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />

            <button
              onClick={submitChapter}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Process Chapter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
