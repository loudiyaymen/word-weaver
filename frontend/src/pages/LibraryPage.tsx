interface Novel {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

export const LibraryPage = ({
  novels,
  onSelect,
  onAdd,
}: {
  novels: Novel[];
  onSelect: (id: number) => void;
  onAdd: () => void;
}) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Library
        </h1>
        <button
          onClick={onAdd}
          className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
        >
          + Add Novel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {novels.map((novel) => (
          <div
            key={novel.id}
            onClick={() => onSelect(novel.id)}
            className="group cursor-pointer"
          >
            <div className="aspect-2/3 bg-slate-200 rounded-lg mb-3 overflow-hidden shadow-md group-hover:shadow-xl transition-shadow border border-slate-100">
              {novel.coverUrl ? (
                <img
                  src={novel.coverUrl}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-center p-4">
                  {novel.title}
                </div>
              )}
            </div>
            <h3 className="font-bold text-slate-900 truncate">{novel.title}</h3>
            <p className="text-sm text-slate-500">
              {novel.author || "Unknown Author"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
