import React, { useEffect, useState, useCallback } from "react";

interface GlossaryTerm {
  id: number;
  chineseTerm: string;
  englishTerm: string;
  notes: string | null;
}

export const GlossaryPage = ({
  novelId,
  onBack,
}: {
  novelId: number;
  onBack: () => void;
}) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [newTerm, setNewTerm] = useState({
    chineseTerm: "",
    englishTerm: "",
    notes: "",
  });

  // Keep this as a stable reference for the 'addTerm' function to use
  const fetchGlossary = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/novels/${novelId}/glossary`,
      );
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (e) {
      console.error("Failed to fetch glossary", e);
    }
  }, [novelId]);

  // Use the effect to trigger the fetch on mount/id change
  useEffect(() => {
    let ignore = false;

    async function startFetching() {
      const res = await fetch(
        `http://localhost:4000/novels/${novelId}/glossary`,
      );
      const data = await res.json();
      if (!ignore) {
        setTerms(data);
      }
    }

    startFetching();

    return () => {
      ignore = true;
    };
  }, [novelId]); // Depend on novelId directly to satisfy "synchronous" check

  const addTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(
      `http://localhost:4000/novels/${novelId}/glossary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTerm),
      },
    );

    if (res.ok) {
      setNewTerm({ chineseTerm: "", englishTerm: "", notes: "" });
      fetchGlossary(); // Refresh after adding
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <button
        onClick={onBack}
        className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Glossary Manager
      </h1>

      <form
        onSubmit={addTerm}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-10"
      >
        <input
          placeholder="Chinese (e.g. 林凡)"
          className="p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
          value={newTerm.chineseTerm}
          onChange={(e) =>
            setNewTerm({ ...newTerm, chineseTerm: e.target.value })
          }
          required
        />
        <input
          placeholder="English (e.g. Lin Fan)"
          className="p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
          value={newTerm.englishTerm}
          onChange={(e) =>
            setNewTerm({ ...newTerm, englishTerm: e.target.value })
          }
          required
        />
        <div className="flex gap-2">
          <input
            placeholder="Notes"
            className="flex-1 p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={newTerm.notes}
            onChange={(e) => setNewTerm({ ...newTerm, notes: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Source (CN)
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Target (EN)
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {terms.map((term) => (
              <tr key={term.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {term.chineseTerm}
                </td>
                <td className="px-6 py-4 text-slate-700">{term.englishTerm}</td>
                <td className="px-6 py-4 text-slate-500 text-sm italic">
                  {term.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
