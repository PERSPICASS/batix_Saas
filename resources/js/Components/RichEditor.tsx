import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
    Bold, Italic, Strikethrough, Code, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon, Unlink,
} from 'lucide-react';

interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    rows?: number;
}

export default function RichEditor({ value, onChange, placeholder = 'Rédigez votre contenu ici...', rows = 12 }: RichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false }),
        ],
        content: value,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    // sync external value reset (ex: form reset)
    useEffect(() => {
        if (!editor) return;
        if (editor.getHTML() !== value) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) return null;

    const btn = (active: boolean) =>
        `rounded p-1.5 transition ${active ? 'bg-amber-400 text-slate-900' : 'text-white/50 hover:bg-white/10 hover:text-white'}`;

    const setLink = () => {
        const url = window.prompt('URL du lien');
        if (!url) return editor.chain().focus().unsetLink().run();
        editor.chain().focus().setLink({ href: url }).run();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/30 transition">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-2 py-1.5">
                <ToolBtn icon={<Undo className="size-3.5" />} title="Annuler" onClick={() => editor.chain().focus().undo().run()} active={false} disabled={!editor.can().undo()} />
                <ToolBtn icon={<Redo className="size-3.5" />} title="Rétablir" onClick={() => editor.chain().focus().redo().run()} active={false} disabled={!editor.can().redo()} />

                <Sep />

                <ToolBtn icon={<Bold className="size-3.5" />} title="Gras" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
                <ToolBtn icon={<Italic className="size-3.5" />} title="Italique" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
                <ToolBtn icon={<Strikethrough className="size-3.5" />} title="Barré" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} />
                <ToolBtn icon={<Code className="size-3.5" />} title="Code inline" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} />

                <Sep />

                <ToolBtn icon={<Heading2 className="size-3.5" />} title="Titre 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} />
                <ToolBtn icon={<Heading3 className="size-3.5" />} title="Titre 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} />

                <Sep />

                <ToolBtn icon={<List className="size-3.5" />} title="Liste à puces" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} />
                <ToolBtn icon={<ListOrdered className="size-3.5" />} title="Liste numérotée" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} />
                <ToolBtn icon={<Quote className="size-3.5" />} title="Citation" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} />
                <ToolBtn icon={<Minus className="size-3.5" />} title="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} />

                <Sep />

                <ToolBtn icon={<LinkIcon className="size-3.5" />} title="Lien" onClick={setLink} active={editor.isActive('link')} />
                <ToolBtn icon={<Unlink className="size-3.5" />} title="Supprimer lien" onClick={() => editor.chain().focus().unsetLink().run()} active={false} disabled={!editor.isActive('link')} />
            </div>

            {/* Zone de saisie */}
            <EditorContent
                editor={editor}
                className="rich-editor-content px-4 text-sm text-white/90"
                style={{ minHeight: `${rows * 1.6}rem` }}
            />
        </div>
    );
}

function ToolBtn({ icon, title, onClick, active, disabled = false }: {
    icon: React.ReactNode; title: string; onClick: () => void; active: boolean; disabled?: boolean;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`rounded p-1.5 transition ${active ? 'bg-amber-400 text-slate-900' : 'text-white/50 hover:bg-white/10 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
            {icon}
        </button>
    );
}

function Sep() {
    return <div className="mx-1 h-4 w-px bg-white/10" />;
}
