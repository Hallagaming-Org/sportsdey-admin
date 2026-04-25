import { useState, useEffect } from "react";
import { Extension } from "@tiptap/core";
import { X, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListOrdered, Type } from "lucide-react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			setFontSize: (size: string) => ReturnType;
			unsetFontSize: () => ReturnType;
		};
	}
}

export const FontSize = Extension.create({
	name: "fontSize",
	addOptions() {
		return { types: ["textStyle"] };
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
						renderHTML: (attributes) => {
							if (!attributes.fontSize) {
								return {};
							}
							return { style: `font-size: ${attributes.fontSize}` };
						},
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setFontSize:
				(fontSize) =>
				({ chain }) => {
					return chain().setMark("textStyle", { fontSize }).run();
				},
			unsetFontSize:
				() =>
				({ chain }) => {
					return chain()
						.setMark("textStyle", { fontSize: null })
						.removeEmptyTextStyle()
						.run();
				},
		};
	},
});

export const MenuBar = ({ editor }: { editor: any }) => {
  const [fontSize, setFontSize] = useState("12px");
  const [fontFamily, setFontFamily] = useState("Arial");
  
  // This forces MenuBar to re-render on every editor transaction
  // so isActive() calls return the correct value immediately
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate((n) => n + 1);
    editor.on("transaction", handler);
    return () => editor.off("transaction", handler);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto border-b border-gray-200 bg-white p-2 text-[#11123f] custom-scrollbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`shrink-0 rounded px-2 py-1 cursor-pointer hover:bg-gray-200 ${
          editor.isActive("bold") ? "bg-gray-200" : ""
        }`}
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`shrink-0 rounded px-2 py-1 cursor-pointer hover:bg-gray-200 ${
          editor.isActive("italic") ? "bg-gray-200" : ""
        }`}
      >
        <i className="font-serif">I</i>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`shrink-0 rounded px-2 py-1 cursor-pointer hover:bg-gray-200 ${
          editor.isActive("underline") ? "bg-gray-200" : ""
        }`}
      >
        <u>U</u>
      </button>

      <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />

      <select
        onChange={(e) => {
          setFontFamily(e.target.value);
          if (e.target.value) {
            editor.chain().focus().setFontFamily(e.target.value).run();
          } else {
            editor.chain().focus().unsetFontFamily().run();
          }
        }}
        value={fontFamily}
        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none cursor-pointer"
      >
        <option value="Arial">Arial</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </select>

      <select
        onChange={(e) => {
          setFontSize(e.target.value);
          if (e.target.value) {
            editor.chain().focus().setFontSize(e.target.value).run();
          } else {
            editor.chain().focus().unsetFontSize().run();
          }
        }}
        value={fontSize}
        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none cursor-pointer"
      >
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
      </select>

      <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />

      {/* Text color */}
      <div className="relative flex shrink-0 h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-gray-200" title="Text Color">
        <div className="pointer-events-none flex flex-col items-center justify-center">
          <span className="font-serif text-sm font-bold leading-none" style={{ color: editor.getAttributes("textStyle").color || "#000000" }}>A</span>
          <div className="mt-[2px] h-[3px] w-4 rounded-full border border-gray-100" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }} />
        </div>
        <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} value={editor.getAttributes("textStyle").color || "#000000"} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>

      {/* Highlight color */}
      <div className="flex shrink-0 items-center gap-1">
        <div className="relative flex shrink-0 h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-gray-200" title="Highlight Color">
          <div className="pointer-events-none flex items-center justify-center">
            <span className="font-serif text-sm font-bold leading-none px-0.5 rounded" style={{ backgroundColor: editor.getAttributes("highlight").color || "#ffff00" }}>ab</span>
          </div>
          <input type="color" onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} value={editor.getAttributes("highlight").color || "#ffff00"} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </div>
        <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="shrink-0 rounded px-1 py-1 text-xs cursor-pointer hover:bg-gray-200" title="Clear Highlight">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`shrink-0 rounded px-2 py-1 text-sm cursor-pointer hover:bg-gray-200 ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />

      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive("paragraph") ? "bg-gray-200" : ""}`} title="Paragraph">
        <Type className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}`} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}`} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}`} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`shrink-0 rounded p-1 cursor-pointer hover:bg-gray-200 ${editor.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""}`} title="Justify">
        <AlignJustify className="h-4 w-4" />
      </button>
    </div>
  );
};
