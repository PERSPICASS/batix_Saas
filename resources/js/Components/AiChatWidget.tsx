import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Loader, Mic, Square } from 'lucide-react';
import axios from 'axios';
import { route } from 'ziggy-js';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AiChatWidgetProps {
    codeUser: string;
    hasAccess: boolean;
}

export default function AiChatWidget({ codeUser, hasAccess }: AiChatWidgetProps) {
    if (!hasAccess) {
        return null;
    }
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                setRecordingStatus(`Erreur: ${event.error}`);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                setRecordingStatus('');
            };
        }
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(
                route('ai.chat', { code_user: codeUser }),
                {
                    message: input,
                    history: messages.slice(-10),
                },
            );

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.data.reply,
            };

            setMessages((prev) => [...prev, assistantMessage]);
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

            const errorMessage: Message = {
                role: 'assistant',
                content: `⚠️ ${errorText}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
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

    return (
        <div className="print:hidden">
            {/* Bouton flottant */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-amber-400 text-slate-950 rounded-full p-3 shadow-lg hover:bg-amber-300 transition-colors"
                    aria-label="Open AI Chat"
                >
                    <Brain size={24} />
                </button>
            )}

            {/* Panneau de chat */}
            {isOpen && (
                <div
                    className={`fixed bottom-20 right-6 z-40 w-80 h-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${
                        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                    }`}
                >
                    {/* En-tête */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white">Assistant Batix</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                            aria-label="Close AI Chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center text-slate-400 text-sm">
                                    <p>Bonjour! Je suis votre assistant IA.</p>
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
                                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-amber-400/20 text-amber-100'
                                            : 'bg-slate-800 text-slate-100'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg flex items-center gap-2">
                                    <Loader size={16} className="animate-spin" />
                                    <span className="text-sm">En cours...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Statut d'enregistrement */}
                    {recordingStatus && (
                        <div className="px-4 py-2 bg-amber-400/10 border-b border-white/10 text-amber-100 text-xs">
                            {recordingStatus}
                        </div>
                    )}

                    {/* Entrée */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Votre question..."
                                disabled={isLoading || isRecording}
                                className="flex-1 bg-slate-800 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:border-amber-400/50 disabled:opacity-50"
                            />
                            <button
                                onClick={toggleRecording}
                                className={`rounded-lg p-2 transition-colors ${
                                    isRecording
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                                title={isRecording ? 'Arrêter' : 'Enregistrer'}
                            >
                                {isRecording ? <Square size={16} /> : <Mic size={16} />}
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-amber-400 text-slate-950 rounded-lg p-2 hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Send message"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
