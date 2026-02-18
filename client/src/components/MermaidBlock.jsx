import { useEffect, useRef, useState } from 'react';

let mermaidModule = null;
let initPromise = null;

function getMermaid() {
  if (!initPromise) {
    initPromise = import('mermaid').then(m => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        flowchart: { curve: 'basis', padding: 12 },
        themeVariables: {
          primaryColor: '#dbeafe',
          primaryBorderColor: '#3b82f6',
          primaryTextColor: '#1e293b',
          secondaryColor: '#dcfce7',
          secondaryBorderColor: '#22c55e',
          tertiaryColor: '#fef3c7',
          lineColor: '#94a3b8',
          fontSize: '14px',
        },
      });
      mermaidModule = m.default;
      return mermaidModule;
    });
  }
  return initPromise;
}

let counter = 0;

export default function MermaidBlock({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const idRef = useRef(`mmd-${Date.now()}-${counter++}`);

  useEffect(() => {
    let cancelled = false;

    getMermaid().then(async (mermaid) => {
      if (cancelled) return;
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    });

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <pre className="text-xs text-red-400 bg-red-50 p-3 rounded-lg overflow-auto">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="my-4 flex justify-center [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
