import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownMessage = ({ content }) => {
    return (
        <div id="response" className="markdown-content w-full">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Main heading (H1)
                    h1: ({ node, ...props }) => (
                        <h1 className="markdown-h1" {...props} />
                    ),

                    // Section heading (H2)
                    h2: ({ node, ...props }) => (
                        <h2 className="markdown-h2" {...props} />
                    ),

                    // Subsection heading (H3)
                    h3: ({ node, ...props }) => (
                        <h3 className="markdown-h3" {...props} />
                    ),

                    // Paragraphs
                    p: ({ node, ...props }) => (
                        <p className="markdown-paragraph" {...props} />
                    ),

                    // Unordered lists (bullet points)
                    ul: ({ node, ...props }) => (
                        <ul className="markdown-list" {...props} />
                    ),

                    // Ordered lists (numbered)
                    ol: ({ node, ...props }) => (
                        <ol className="markdown-list ordered" {...props} />
                    ),

                    // List items
                    li: ({ node, ...props }) => (
                        <li className="markdown-list-item" {...props} />
                    ),

                    // Bold text
                    strong: ({ node, ...props }) => (
                        <strong className="markdown-bold" {...props} />
                    ),

                    // Italic text
                    em: ({ node, ...props }) => (
                        <em className="markdown-italic" {...props} />
                    ),

                    // Inline code
                    code: ({ node, inline, ...props }) =>
                        inline ? (
                            <code
                                className="markdown-inline-code"
                                {...props}
                            />
                        ) : (
                            <div className="relative group my-4">
                                <pre className="markdown-pre">
                                    <code className="markdown-code-block" {...props} />
                                </pre>
                            </div>
                        ),

                    // Block quotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="markdown-blockquote"
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
                            className="markdown-link"
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
