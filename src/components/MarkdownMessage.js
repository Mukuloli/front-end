import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownMessage = ({ content }) => {
    return (
        <div className="markdown-content w-full">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Main heading (H1)
                    h1: ({ node, ...props }) => (
                        <h1 className="text-2xl sm:text-3xl font-bold mb-4 mt-6 text-gray-900 border-b-2 border-gray-100 pb-2" {...props} />
                    ),

                    // Section heading (H2)
                    h2: ({ node, ...props }) => (
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 mt-5 text-gray-800" {...props} />
                    ),

                    // Subsection heading (H3)
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 mt-4 text-gray-800 bg-gray-50/50 p-2 rounded" {...props} />
                    ),

                    // Paragraphs - with good spacing
                    p: ({ node, ...props }) => (
                        <p className="mb-4 leading-7 text-gray-700 text-sm sm:text-base" {...props} />
                    ),

                    // Unordered lists (bullet points)
                    ul: ({ node, ...props }) => (
                        <ul className="mb-4 ml-6 space-y-2 list-disc" {...props} />
                    ),

                    // Ordered lists (numbered)
                    ol: ({ node, ...props }) => (
                        <ol className="mb-4 ml-6 space-y-2 list-decimal" {...props} />
                    ),

                    // List items
                    li: ({ node, ...props }) => (
                        <li className="leading-7 text-gray-700 pl-1" {...props} />
                    ),

                    // Bold text (like **Key Points**)
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                    ),

                    // Inline code
                    code: ({ node, inline, ...props }) =>
                        inline ? (
                            <code
                                className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-gray-200"
                                {...props}
                            />
                        ) : (
                            <div className="relative group my-4">
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto shadow-sm">
                                    <code className="text-sm font-mono" {...props} />
                                </pre>
                            </div>
                        ),

                    // Block quotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="border-l-4 border-gray-300 pl-4 py-1 my-4 bg-gray-50 italic text-gray-700 rounded-r"
                            {...props}
                        />
                    ),

                    // Horizontal rules
                    hr: ({ node, ...props }) => (
                        <hr className="my-6 border-t border-gray-200" {...props} />
                    ),

                    // Links
                    a: ({ node, ...props }) => (
                        <a
                            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownMessage;
