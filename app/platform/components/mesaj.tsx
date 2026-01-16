'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import icon from '../../icon.svg';
import ReportCard from './rapor';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'report';
    reportDate?: string;
}

interface MesajProps {
    msg: Message;
}

export default function Mesaj({ msg }: MesajProps) {
    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.type === 'report' ? 'justify-center w-full' : 'justify-start')}`}>
            <div
                className={`${msg.type === 'report' ? 'w-full flex justify-center' : 'max-w-[85%]'} ${msg.role === 'user'
                    ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-br-sm px-3 py-2'
                    : 'bg-transparent text-gray-800 px-0'
                    }`}
            >
                {msg.role === 'assistant' && msg.type !== 'report' && (
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <Image
                                src={icon}
                                alt="AI"
                                className="w-full h-full"
                            />
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Derece Koçu</span>
                    </div>
                )}

                {msg.type === 'report' ? (
                    <ReportCard date={msg.reportDate} />
                ) : (
                    <div className="leading-relaxed text-xs break-words prose prose-sm max-w-none prose-p:my-3 prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-2 prose-li:my-1 prose-ul:my-4 prose-ol:my-4">
                        {msg.role === 'assistant' ? (
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-2 last:mb-0" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="mb-4 list-disc pl-4" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="mb-4 list-decimal pl-4" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-3 mt-4" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-2 mt-3" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                }}
                            >
                                {msg.content.replace(/([^\n])\n([^\n])/g, '$1\n\n$2')}
                            </ReactMarkdown>
                        ) : (
                            msg.content
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
