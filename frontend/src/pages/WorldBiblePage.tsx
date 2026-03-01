import React, { useEffect, useState, useCallback } from "react";

interface BibleEntry {
  id: number;
  category: string;
  key: string;
  content: string;
}

export const WorldBiblePage = ({
  novelId,
  onBack,
}: {
  novelId: number;
  onBack: () => void;
}) => {
  const [entries, setEntries] = useState<BibleEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    category: "Character",
    key: "",
    content: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBible = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/novels/${novelId}/world-bible`,
      );
      if (res.ok) setEntries(await res.json());
    } catch (e) {
      console.error("Failed to fetch world bible", e);
    }
  }, [novelId]);

  useEffect(() => {
    fetchBible();
  }, [fetchBible]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch(
        `http://localhost:4000/novels/${novelId}/world-bible`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        },
      );
      if (res.ok) {
        setNewEntry({ category: "Character", key: "", content: "" });
        fetchBible();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <button
        onClick={onBack}
        className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">World Bible</h1>
      <p className="text-slate-500 mb-8">
        Add characters, lore, and locations. The Multi-Agent system will
        dynamically retrieve these via vector search during translation.
      </p>
      <form
        onSubmit={addEntry}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-10 flex flex-col gap-4"
      >
        <div className="flex gap-4">
          <select
            className="p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
            value={newEntry.category}
            onChange={(e) =>
              setNewEntry({ ...newEntry, category: e.target.value })
            }
          >
            <option value="Character">Character</option>
            <option value="Location">Location</option>
            <option value="Lore">Lore / History</option>
            <option value="Technique">Technique / Cultivation</option>
          </select>
          <input
            placeholder="Key Name (e.g., Lin Fan)"
            className="flex-1 p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={newEntry.key}
            onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })}
            required
          />
        </div>
        <textarea
          placeholder="Detailed description, personality, tone, physical traits..."
          className="w-full h-32 p-3 border rounded outline-none focus:ring-2 focus:ring-blue-500 font-serif"
          value={newEntry.content}
          onChange={(e) =>
            setNewEntry({ ...newEntry, content: e.target.value })
          }
          required
        />
        <button
          type="submit"
          disabled={isGenerating}
          className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-800 self-end disabled:opacity-50"
        >
          {isGenerating ? "Generating Vector..." : "Add to Bible"}
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{entry.key}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {entry.category}
              </span>
            </div>
            <p className="text-slate-600 text-sm font-serif leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="col-span-2 text-center py-10 text-slate-400 italic">
            The World Bible is empty. Add your first lore entry above.
          </div>
        )}
      </div>
    </div>
  );
};
