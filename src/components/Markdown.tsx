"use client";

import ReactMarkdown from "react-markdown";

// Renders AI markdown (bold, italic, lists, paragraphs) with tidy Tailwind styles.
// Used for coach replies and report text.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 leading-relaxed [&_strong]:font-semibold [&_em]:italic">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          h1: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          h3: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          a: ({ children, href }) => (
            <a href={href} className="text-brand-600 underline" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
