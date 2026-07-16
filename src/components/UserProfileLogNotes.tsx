import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, PlusCircle, Trash2, XCircle } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface LogNote {
  id: string;
  author: string;
  date: string;
  text: string;
}

function ExpandableNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [text]);

  const clampStyle = expanded ? {} : {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden'
  };

  const handleShowLess = () => {
    setExpanded(false);
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 10);
  };

  return (
    <div ref={containerRef} className="bg-[#F8F9FC] rounded-lg p-3.5 text-sm text-gray-600 leading-relaxed border border-gray-50 flex flex-col items-start">
      <div ref={textRef} style={clampStyle} className="w-full whitespace-pre-wrap">
        {text}
      </div>
      {isTruncated && !expanded && (
        <button 
          onClick={() => setExpanded(true)}
          className="text-[#1BAA04] hover:underline mt-2 text-xs font-semibold cursor-pointer"
        >
          Read more
        </button>
      )}
      {expanded && (
        <button 
          onClick={handleShowLess}
          className="text-[#1BAA04] hover:underline mt-2 text-xs font-semibold cursor-pointer"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export function UserProfileLogNotes({ userId }: { userId: string }) {
  const currentUser = useCurrentUser();
  const userRole = currentUser?.role === 'super_admin' ? 'Super Admin' : 
                   currentUser?.role === 'csr-admin' ? 'CSR Admin' : 
                   currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Admin';

  const [notes, setNotes] = useState<LogNote[]>([
    {
      id: "1",
      author: userRole,
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
    {
      id: "2",
      author: userRole,
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
    {
      id: "3",
      author: userRole,
      date: "2nd april, 2025",
      text: "This user has been a consistent player and also and we are to reward the user with a ₦ 500 free bet ....",
    },
  ]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
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

  const wordCount = newNoteText.trim() ? newNoteText.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 1000;

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
            <button 
              onClick={() => {
                setIsAddingNote(true);
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add a note
            </button>
            {currentUser?.role === 'super_admin' && (
              <>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Delete a note
                </button>
                <button 
                  onClick={() => {
                    setNotes([]);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Clear all note
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar space-y-5 pr-2">
          {isAddingNote && (
            <div className="space-y-2 group bg-[#F8F9FC] rounded-lg p-3.5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm">{userRole}</span>
                <span className="text-gray-400 text-xs">Now</span>
              </div>
              <textarea 
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-white rounded-lg p-3 text-sm text-gray-600 border border-gray-200 focus:border-[#1BAA04] focus:ring-1 focus:ring-[#1BAA04] outline-none min-h-[150px] resize-y"
                placeholder="Type your note here..."
                autoFocus
              />
              <div className="flex justify-end">
                <span className={`text-[8px] ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {wordCount} / 1,000
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  onClick={() => { setIsAddingNote(false); setNewNoteText(""); }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (!newNoteText.trim() || isOverLimit) return;
                    setNotes([{
                      id: Date.now().toString(),
                      author: userRole,
                      date: new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
                      text: newNoteText
                    }, ...notes]);
                    setIsAddingNote(false);
                    setNewNoteText("");
                  }}
                  disabled={isOverLimit}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1BAA04] text-white rounded hover:bg-[#158903] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add note
                </button>
              </div>
          </div>
          )}

          {notes.map((note, index) => (
          <div key={note.id} className="space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{note.author}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{note.date}</span>
                {/* Show trash icon on hover only for super admin */}
                {currentUser?.role === 'super_admin' && (
                  <button 
                    onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ExpandableNote text={note.text} />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
