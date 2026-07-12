import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, PlusCircle, Trash2, XCircle } from "lucide-react";

interface LogNote {
  id: string;
  author: string;
  date: string;
  text: string;
}

export function UserProfileLogNotes({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<LogNote[]>([
    {
      id: "1",
      author: "Support admin",
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
    {
      id: "2",
      author: "Support admin",
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
    {
      id: "3",
      author: "Support admin",
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
  ]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 relative flex-shrink-0" ref={menuRef}>
        <h4 className="font-bold text-xl text-gray-900">Log Note</h4>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-8 z-10 w-48 bg-white rounded-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.1)] border border-gray-100 py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
              Log note Menu Options
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <PlusCircle className="w-4 h-4" /> Add a note
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" /> Delete a note
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <XCircle className="w-4 h-4" /> Clear all note
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar space-y-5 pr-2">
          {notes.map((note, index) => (
          <div key={note.id} className="space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{note.author}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{note.date}</span>
                {/* Show trash icon on hover, or always for the 2nd item based on mockup */}
                <button className={`text-gray-400 hover:text-red-500 transition-colors cursor-pointer ${index === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="bg-[#F8F9FC] rounded-lg p-3.5 text-sm text-gray-600 leading-relaxed border border-gray-50">
              {note.text}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
