import { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, X, Send, Loader, Mic, Square, Plus, Trash2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { loadAiChatSession, saveAiChatSession } from '@/utils/aiChatSession';
import { linkify } from '@/utils/linkify';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Conversation {
    id: number;
    title: string;
    last_message_at: string | null;
}

interface AiChatWidgetProps {
    codeUser: string;
    hasAccess: boolean;
}

/**
 * Portail d'accès. Ce composant ne déclare AUCUN hook — c'est ce qui rend son retour
 * anticipé conforme aux règles des hooks, et ce qui fait qu'une bascule de `hasAccess`
 * monte ou démonte le panneau d'un bloc au lieu de changer le nombre de hooks rendus.
 */
export default function AiChatWidget({ codeUser, hasAccess }: AiChatWidgetProps) {
    if (!hasAccess) {
        return null;
    }

    return <AiChatPanel codeUser={codeUser} />;
}

function AiChatPanel({ codeUser }: { codeUser: string }) {
    const page = usePage();
    const userId = (page.props.auth as { user?: { id?: number } } | undefined)?.user?.id ?? null;
    const shopId = (page.props.activeShop as { id?: number } | null | undefined)?.id ?? null;

    // Départ fermé, restauration APRÈS le montage : l'application est rendue en SSR, où
    // sessionStorage n'existe pas. Lire le stockage pendant le rendu ferait diverger le
    // HTML serveur du premier rendu client — une erreur d'hydratation qui fait
    // disparaître toute la page, pas seulement le widget.
    const [isOpen, setIsOpen] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const skipFirstSave = useRef(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = useCallback(async () => {
        try {
            const { data } = await axios.get(route('ai.conversations', { code_user: codeUser }));
            setConversations(data.conversations ?? []);
        } catch {
            // La liste est un confort : son échec ne doit pas empêcher de discuter.
            setConversations([]);
        }
    }, [codeUser]);

    const openConversation = useCallback(
        async (id: number) => {
            setIsLoadingThread(true);
            try {
                const { data } = await axios.get(route('ai.conversation', { code_user: codeUser, conversation: id }));
                setConversationId(data.id);
                setMessages(data.messages ?? []);
            } catch {
                // Conversation purgée ou supprimée ailleurs : on repart d'un fil neuf
                // plutôt que de laisser un écran vide sans explication.
                setConversationId(null);
                setMessages([]);
            } finally {
                setIsLoadingThread(false);
            }
        },
        [codeUser],
    );

    // Restauration du pointeur (panneau ouvert, conversation affichée) après le montage.
    useEffect(() => {
        skipFirstSave.current = true;

        const stored = loadAiChatSession(userId, shopId);
        setIsOpen(stored.isOpen);
        setConversationId(stored.conversationId);
        setMessages([]);

        if (stored.isOpen) {
            void loadConversations();
            if (stored.conversationId !== null) {
                void openConversation(stored.conversationId);
            }
        }
    }, [userId, shopId, loadConversations, openConversation]);

    useEffect(() => {
        // Le premier passage porte encore l'état du montage : sauvegarder ici écraserait
        // le pointeur que l'effet de restauration vient de relire.
        if (skipFirstSave.current) {
            skipFirstSave.current = false;
            return;
        }
        saveAiChatSession(userId, shopId, { isOpen, conversationId });
    }, [userId, shopId, isOpen, conversationId]);

    // Échap ferme la modale : attendu de toute boîte de dialogue, et seule sortie au
    // clavier pour qui n'utilise pas la souris.
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'fr-FR';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onstart = () => {
                setIsRecording(true);
                setRecordingStatus('Écoute en cours...');
            };

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        setInput((prev) => prev + transcript);
                    } else {
                        interimTranscript += transcript;
                    }
                }
                if (interimTranscript) {
                    setRecordingStatus(`Reconnaissance: ${interimTranscript}`);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                setRecordingStatus(`Erreur: ${event.error}`);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                setRecordingStatus('');
            };
        }
    }, []);

    const openPanel = () => {
        setIsOpen(true);
        void loadConversations();
        if (conversationId !== null && messages.length === 0) {
            void openConversation(conversationId);
        }
    };

    const startNewConversation = () => {
        setConversationId(null);
        setMessages([]);
        setInput('');
    };

    const deleteConversation = async (id: number) => {
        try {
            await axios.delete(route('ai.conversation.destroy', { code_user: codeUser, conversation: id }));
        } catch {
            return;
        }

        setConversations((prev) => prev.filter((c) => c.id !== id));

        // Le fil supprimé était affiché : on repart d'une conversation vierge plutôt que
        // de continuer à écrire dans quelque chose qui n'existe plus.
        if (id === conversationId) {
            startNewConversation();
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(route('ai.chat', { code_user: codeUser }), {
                message: userMessage.content,
                conversation_id: conversationId,
            });

            setMessages((prev) => [...prev, { role: 'assistant', content: response.data.reply }]);

            // Le serveur fait autorité sur l'identité du fil : il en ouvre un au premier
            // message, et c'est lui qui en donne le titre.
            if (response.data.conversation_id) {
                setConversationId(response.data.conversation_id);
                void loadConversations();
            }
        } catch (error) {
            console.error('Chat error:', error);

            let errorText = 'Désolé, une erreur est survenue. Veuillez réessayer.';

            if (axios.isAxiosError(error)) {
                if (error.response?.data?.error) {
                    errorText = error.response.data.error;
                } else if (error.message) {
                    errorText = error.message;
                }
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errorText}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            setRecordingStatus('La reconnaissance vocale n\'est pas supportée');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setInput('');
            recognitionRef.current.start();
        }
    };

    const formatDate = (value: string | null) => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="print:hidden">
            {!isOpen && (
                <button
                    onClick={openPanel}
                    className="fixed bottom-6 right-6 z-40 rounded-full bg-amber-400 p-3 text-slate-950 shadow-lg transition-colors hover:bg-amber-300"
                    aria-label="Ouvrir l'assistant IA"
                >
                    <Brain size={24} />
                </button>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    // Clic sur le fond = fermeture, mais uniquement sur le fond lui-même :
                    // sans ce test, un clic relâché dans le panneau fermerait la modale.
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Assistant IA"
                        className="flex h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                    >
                        {/* Liste des conversations — masquée sur petit écran, où la place
                            manque pour deux colonnes. */}
                        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950/40 sm:flex">
                            <div className="p-3">
                                <button
                                    onClick={startNewConversation}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                                >
                                    <Plus size={16} />
                                    Nouvelle conversation
                                </button>
                            </div>

                            <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                                {conversations.length === 0 && (
                                    <p className="px-2 py-4 text-center text-xs text-slate-500">
                                        Aucune conversation pour le moment.
                                    </p>
                                )}

                                {conversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition ${
                                            conversation.id === conversationId
                                                ? 'bg-amber-400/15 text-amber-100'
                                                : 'text-slate-300 hover:bg-white/5'
                                        }`}
                                    >
                                        <button
                                            onClick={() => openConversation(conversation.id)}
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                        >
                                            <MessageSquare size={14} className="shrink-0 opacity-60" />
                                            <span className="truncate">{conversation.title}</span>
                                        </button>
                                        <span className="shrink-0 text-[10px] text-slate-500 group-hover:hidden">
                                            {formatDate(conversation.last_message_at)}
                                        </span>
                                        <button
                                            onClick={() => deleteConversation(conversation.id)}
                                            className="hidden shrink-0 text-slate-500 transition hover:text-rose-300 group-hover:block"
                                            aria-label={`Supprimer la conversation ${conversation.title}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* Fil de discussion */}
                        <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center justify-between border-b border-white/10 p-4">
                                <div className="flex items-center gap-2">
                                    <Brain size={18} className="text-amber-300" />
                                    <h3 className="text-sm font-semibold text-white">Assistant BATIX PRO</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={startNewConversation}
                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white sm:hidden"
                                        aria-label="Nouvelle conversation"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                        aria-label="Fermer l'assistant"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                                {isLoadingThread && (
                                    <div className="flex h-full items-center justify-center text-slate-400">
                                        <Loader size={20} className="animate-spin" />
                                    </div>
                                )}

                                {!isLoadingThread && messages.length === 0 && (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="text-center text-sm text-slate-400">
                                            <p>Bonjour ! Je suis votre assistant IA.</p>
                                            <p className="mt-2">Posez-moi une question sur votre boutique.</p>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-amber-400/20 text-amber-100'
                                                    : 'bg-slate-800 text-slate-100'
                                            }`}
                                        >
                                            {linkify(msg.content)}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-slate-100">
                                            <Loader size={16} className="animate-spin" />
                                            <span className="text-sm">En cours...</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {recordingStatus && (
                                <div className="border-t border-white/10 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
                                    {recordingStatus}
                                </div>
                            )}

                            <div className="border-t border-white/10 p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Votre question..."
                                        disabled={isLoading || isRecording}
                                        className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400/50 focus:outline-none disabled:opacity-50"
                                    />
                                    <button
                                        onClick={toggleRecording}
                                        className={`rounded-lg p-2 transition-colors ${
                                            isRecording
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                                        title={isRecording ? 'Arrêter' : 'Enregistrer'}
                                    >
                                        {isRecording ? <Square size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !input.trim()}
                                        className="rounded-lg bg-amber-400 p-2 text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Envoyer le message"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
