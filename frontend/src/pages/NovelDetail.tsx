import { useState } from "react";

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string | null;
  status: string;
  progress: number;
}

interface Novel {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
}

interface NovelDetailProps {
  novel: Novel;
  chapters: Chapter[];
  onBack: () => void;
  onTranslate: (id: number) => void;
  onGlossary: () => void;
  onDeleteChapter: (id: number) => void;
  onBatchTranslate: () => void;
  onAddChapter: () => void;
}

export const NovelDetail: React.FC<NovelDetailProps> = ({
  novel,
  chapters,
  onBack,
  onTranslate,
  onGlossary,
  onDeleteChapter,
  onBatchTranslate,
  onAddChapter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChapters = chapters.filter(
    (ch) =>
      ch.chapterNumber.toString().includes(searchTerm) ||
      (ch.title && ch.title.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <button
        onClick={onBack}
        className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"
      >
        ← Back to Library
      </button>

      <div className="flex flex-col md:flex-row gap-10 mb-12">
        <div className="w-full md:w-64 shrink-0">
          <div className="aspect-2/3 bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 flex items-center justify-center">
            {novel.coverUrl ? (
              <img
                src={novel.coverUrl}
                className="w-full h-full object-cover"
                alt={`${novel.title} Cover`}
              />
            ) : (
              <div className="p-10 text-center text-slate-400 font-bold">
                {novel.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-slate-900">{novel.title}</h1>
            <div className="flex gap-2">
              <button
                onClick={onGlossary}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                Glossary
              </button>
            </div>
          </div>
          <p className="text-xl text-slate-500 mb-6">
            {novel.author || "Unknown Author"}
          </p>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed shadow-sm min-h-30">
            {novel.description || "No description provided yet."}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Chapters</h2>
          <p className="text-slate-400 text-sm">
            {chapters.length} chapters total
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onAddChapter}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Add Chapter
          </button>

          <button
            onClick={onBatchTranslate}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Batch Translate Pending
          </button>

          <input
            type="text"
            placeholder="Search chapters..."
            className="p-2 px-4 border rounded-xl w-full md:w-64 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredChapters.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-slate-400 italic"
                >
                  No chapters found. Click "+ Add Chapter" to get started.
                </td>
              </tr>
            ) : (
              filteredChapters.map((ch) => (
                <tr
                  key={ch.id}
                  className="hover:bg-slate-50 group transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-700">
                    Ch. {ch.chapterNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {ch.title || "---"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ch.status === "completed"
                            ? "bg-green-500"
                            : ch.status === "translating"
                              ? "bg-blue-500 animate-pulse"
                              : ch.status === "queued"
                                ? "bg-orange-400"
                                : ch.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-slate-300"
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {ch.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onTranslate(ch.id)}
                        className="px-3 py-1 bg-slate-900 text-white text-xs rounded-md font-bold hover:bg-slate-800 transition-colors"
                      >
                        {ch.status === "pending" || ch.status === "failed"
                          ? "Translate"
                          : "Read"}
                      </button>
                      <button
                        onClick={() => onDeleteChapter(ch.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-md font-bold hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
