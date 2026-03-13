'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

const CodeBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof children === 'string' ? children : String(children);
    navigator.clipboard.writeText(text.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper group">
      <button
        onClick={handleCopy}
        className="code-copy-btn opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
        ) : (
          <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
        )}
      </button>
      <pre className="markdown-pre">
        <code className="markdown-code-block" {...props}>{children}</code>
      </pre>
    </div>
  );
};

const MarkdownMessage = ({ content }) => {
  return (
    <div id="response" className="markdown-content w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-paragraph" {...props} />,
          ul: ({ node, ...props }) => <ul className="markdown-list" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-list ordered" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-list-item" {...props} />,
          strong: ({ node, ...props }) => <strong className="markdown-bold" {...props} />,
          em: ({ node, ...props }) => <em className="markdown-italic" {...props} />,
          code: ({ node, ...props }) => (
            <code className="markdown-inline-code" {...props} />
          ),
          pre: ({ node, children, ...props }) => (
            <CodeBlock>{children}</CodeBlock>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="markdown-blockquote" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6" style={{ borderColor: 'var(--border)' }} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="markdown-link"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2.5 text-left text-sm font-semibold" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
