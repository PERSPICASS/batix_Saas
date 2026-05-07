import { jsxs, jsx } from "react/jsx-runtime";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";
import { Undo, Redo, Bold, Italic, Strikethrough, Code, Heading2, Heading3, List, ListOrdered, Quote, Minus, Link as Link$1, Unlink } from "lucide-react";
function RichEditor({ value, onChange, placeholder = "Rédigez votre contenu ici...", rows = 12 }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false })
    ],
    content: value,
    onUpdate({ editor: editor2 }) {
      onChange(editor2.getHTML());
    }
  });
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);
  if (!editor) return null;
  const setLink = () => {
    const url = window.prompt("URL du lien");
    if (!url) return editor.chain().focus().unsetLink().run();
    editor.chain().focus().setLink({ href: url }).run();
  };
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/30 transition", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-0.5 border-b border-white/10 px-2 py-1.5", children: [
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Undo, { className: "size-3.5" }), title: "Annuler", onClick: () => editor.chain().focus().undo().run(), active: false, disabled: !editor.can().undo() }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Redo, { className: "size-3.5" }), title: "Rétablir", onClick: () => editor.chain().focus().redo().run(), active: false, disabled: !editor.can().redo() }),
      /* @__PURE__ */ jsx(Sep, {}),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Bold, { className: "size-3.5" }), title: "Gras", onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Italic, { className: "size-3.5" }), title: "Italique", onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Strikethrough, { className: "size-3.5" }), title: "Barré", onClick: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Code, { className: "size-3.5" }), title: "Code inline", onClick: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code") }),
      /* @__PURE__ */ jsx(Sep, {}),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Heading2, { className: "size-3.5" }), title: "Titre 2", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Heading3, { className: "size-3.5" }), title: "Titre 3", onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) }),
      /* @__PURE__ */ jsx(Sep, {}),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(List, { className: "size-3.5" }), title: "Liste à puces", onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(ListOrdered, { className: "size-3.5" }), title: "Liste numérotée", onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Quote, { className: "size-3.5" }), title: "Citation", onClick: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Minus, { className: "size-3.5" }), title: "Séparateur", onClick: () => editor.chain().focus().setHorizontalRule().run(), active: false }),
      /* @__PURE__ */ jsx(Sep, {}),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Link$1, { className: "size-3.5" }), title: "Lien", onClick: setLink, active: editor.isActive("link") }),
      /* @__PURE__ */ jsx(ToolBtn, { icon: /* @__PURE__ */ jsx(Unlink, { className: "size-3.5" }), title: "Supprimer lien", onClick: () => editor.chain().focus().unsetLink().run(), active: false, disabled: !editor.isActive("link") })
    ] }),
    /* @__PURE__ */ jsx(
      EditorContent,
      {
        editor,
        className: "rich-editor-content px-4 text-sm text-white/90",
        style: { minHeight: `${rows * 1.6}rem` }
      }
    )
  ] });
}
function ToolBtn({ icon, title, onClick, active, disabled = false }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      title,
      onClick,
      disabled,
      className: `rounded p-1.5 transition ${active ? "bg-amber-400 text-slate-900" : "text-white/50 hover:bg-white/10 hover:text-white"} disabled:opacity-30 disabled:cursor-not-allowed`,
      children: icon
    }
  );
}
function Sep() {
  return /* @__PURE__ */ jsx("div", { className: "mx-1 h-4 w-px bg-white/10" });
}
export {
  RichEditor as R
};
