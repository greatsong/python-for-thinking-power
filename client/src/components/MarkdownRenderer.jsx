import { lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';

const MermaidBlock = lazy(() => import('./MermaidBlock.jsx'));

const components = {
  code({ className, children, ...props }) {
    const lang = /language-(\w+)/.exec(className || '')?.[1];

    // Mermaid 다이어그램 렌더링
    if (lang === 'mermaid') {
      return (
        <span data-mermaid="true">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            }
          >
            <MermaidBlock chart={String(children).trim()} />
          </Suspense>
        </span>
      );
    }

    // 일반 코드 블록
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },

  // pre 태그: mermaid일 경우 래핑 제거
  pre({ children, ...props }) {
    if (children?.props?.['data-mermaid']) {
      return children;
    }
    return <pre {...props}>{children}</pre>;
  },
};

export default function MarkdownRenderer({ children, className = '' }) {
  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
