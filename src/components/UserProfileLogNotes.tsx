import { useState, useRef, useEffect, useMemo } from "react";
import { MoreHorizontal, PlusCircle, Trash2, XCircle, Loader2 } from "lucide-react";
import { useCurrentUser, useHasPermission } from "../hooks/useCurrentUser";
import { userService } from "../lib/users";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LogNote {
  id: string;
  author: string;
  authorEmail?: string;
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
    // Scroll the entire note into view, centered, after the DOM updates
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
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
  const canAddLogNote = useHasPermission("create_log_note");
  const queryClient = useQueryClient();
  const userRole = currentUser?.role === 'super_admin' ? 'Super Admin' : 
                   currentUser?.role === 'csr-admin' ? 'CSR Admin' : 
                   currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Admin';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, type: 'single' | 'all', noteId?: string }>({ isOpen: false, type: 'single' });
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: rawNotes, isLoading } = useQuery({
    queryKey: ["user-log-notes", userId],
    queryFn: async () => {
      const res = await userService.getUserLogNotes(userId);
      if (!res.success) throw new Error(res.error || "Failed to fetch log notes");
      return res.data || [];
    },
    enabled: !!userId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await userService.createUserLogNote(userId, text);
      if (!res.success) throw new Error(res.error || "Failed to add log note");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-log-notes", userId] });
      setNewNoteText("");
      setIsAddingNote(false);
      toast.success("Log note added successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await userService.deleteUserLogNote(noteId);
      if (!res.success) throw new Error(res.error || "Failed to delete log note");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-log-notes", userId] });
      toast.success("Log note deleted successfully");
      setDeleteModal({ isOpen: false, type: 'single' });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const handleDeleteConfirm = async () => {
    if (deleteModal.type === 'single' && deleteModal.noteId) {
      deleteNoteMutation.mutate(deleteModal.noteId);
    } else if (deleteModal.type === 'all') {
      setIsDeletingAll(true);
      try {
        const res = await userService.deleteAllUserLogNotes(userId);
        if (!res.success) throw new Error(res.error || "Failed to clear all log notes");
        queryClient.invalidateQueries({ queryKey: ["user-log-notes", userId] });
        toast.success("All log notes deleted successfully");
        setDeleteModal({ isOpen: false, type: 'single' });
      } catch (err: any) {
        toast.error(err.message || "Failed to clear all log notes");
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  const notes: LogNote[] = useMemo(() => {
    console.log("UserProfileLogNotes rawNotes:", rawNotes);
    if (!rawNotes) return [];
    
    const notesArray = Array.isArray(rawNotes)
      ? rawNotes
      : (rawNotes && typeof rawNotes === 'object')
        ? ((rawNotes as any).logNotes || (rawNotes as any).notes || (rawNotes as any).data || [])
        : [];

    return notesArray
      .filter((note: any) => note)
      .map((note: any) => {
        const formatWithOrdinal = (dateString: string) => {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          const day = date.getDate();
          const month = date.toLocaleDateString("en-US", { month: "long" }).toLowerCase();
          const year = date.getFullYear();
          const suffix = (day % 10 === 1 && day !== 11) ? "st" :
                         (day % 10 === 2 && day !== 12) ? "nd" :
                         (day % 10 === 3 && day !== 13) ? "rd" : "th";
          return `${day}${suffix} ${month}, ${year}`;
        };

        const role = note.adminRole === 'super_admin' ? 'Super Admin' : 
                     note.adminRole === 'csr-admin' ? 'CSR Admin' : 
                     note.adminRole ? note.adminRole.charAt(0).toUpperCase() + note.adminRole.slice(1) : 'Admin';

        return {
          id: note.id || String(Math.random()),
          author: note.adminName || note.admin?.name || role,
          authorEmail: note.adminEmail || note.admin?.email || role,
          date: note.createdAt ? formatWithOrdinal(note.createdAt) : "",
          text: note.note || note.text || "",
        };
      });
  }, [rawNotes]);

  const wordCount = newNoteText.trim() ? newNoteText.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 1000;

  const handleAddNote = () => {
    if (!newNoteText.trim() || isOverLimit) return;
    addNoteMutation.mutate(newNoteText.trim());
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 relative flex-shrink-0" ref={menuRef}>
        <h4 className="font-bold text-xl text-gray-900">Log Note</h4>
       {canAddLogNote && <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>}

        {isMenuOpen && canAddLogNote && (
          <div className="absolute right-0 top-8 z-10 w-48 bg-white rounded-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.1)] border border-gray-100 py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
              Log note Menu Options
            </div>
            {canAddLogNote && (
              <button 
                onClick={() => {
                  setIsAddingNote(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add a note
              </button>
            )}
            {currentUser?.role === 'super_admin' && (
              <>
                {/* <button 
                  onClick={() => {
                    toast.info("Hover over a note and click delete");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete a notes
                </button> */}
                <button 
                  onClick={() => {
                    setDeleteModal({ isOpen: true, type: 'all' });
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
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-gray-400 text-sm">Loading log notes...</span>
            </div>
          ) : (
            <>
              {isAddingNote && (
                <div className="space-y-2 group bg-[#F8F9FC] rounded-lg p-3.5 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">{userRole}</span>
                      {currentUser?.email && <span className="text-gray-500 text-[10px] mt-0.5">{currentUser.email}</span>}
                    </div>
                    <span className="text-gray-400 text-xs mt-0.5">Now</span>
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
                      disabled={addNoteMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddNote}
                      disabled={isOverLimit || addNoteMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium bg-[#1BAA04] text-white rounded hover:bg-[#158903] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {addNoteMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        
                        </>
                      ) : (
                        "Add note"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {notes.length === 0 && !isAddingNote ? (
                <div className="flex flex-col items-center justify-center h-48 py-8 text-center border-2 border-dashed border-gray-100 rounded-xl my-auto">
                
                  <p className="text-sm font-semibold text-gray-700">No log notes found</p>
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="text-xs font-medium text-[#1BAA04] hover:underline mt-1.5 cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Click here to add a log note
                  </button>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="space-y-2 group">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{note.author}</span>
                        {note.authorEmail && <span className="text-gray-500 text-[10px] mt-0.5">{note.authorEmail}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-400 text-xs">{note.date}</span>
                        {currentUser?.role === 'super_admin' && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, type: 'single', noteId: note.id })}
                            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <ExpandableNote text={note.text} />
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {deleteModal.type === 'single' ? 'Delete log note?' : 'Clear all log notes?'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to {deleteModal.type === 'single' ? 'delete this note' : 'clear all log notes'}? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
                  disabled={deleteNoteMutation.isPending || isDeletingAll}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteNoteMutation.isPending || isDeletingAll}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(deleteNoteMutation.isPending || isDeletingAll) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                     
                    </>
                  ) : (
                    "Yes, delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
