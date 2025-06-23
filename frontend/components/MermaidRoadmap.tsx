import React, { useEffect, useRef, useState } from "react";

export default function MermaidRoadmap({ mermaidCode }: { mermaidCode: string }) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mermaidCode) {
      setSvgContent("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadAndRenderMermaid = async () => {
      try {
        // Load Mermaid if not already loaded
        if (!(window as any).mermaid) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
            script.onload = () => {
              (window as any).mermaid.initialize({ 
                startOnLoad: false,
                theme: 'base',
                flowchart: {
                  useMaxWidth: false,
                  htmlLabels: true,
                  curve: 'basis',
                  padding: 20
                },
                themeVariables: {
                  fontSize: '16px',
                  fontFamily: 'Arial, sans-serif',
                  primaryColor: '#4F46E5',
                  primaryTextColor: '#ffffff',
                  primaryBorderColor: '#312E81',
                  lineColor: '#333333',
                  secondaryColor: '#10B981',
                  tertiaryColor: '#F59E0B'
                }
              });
              resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Create a temporary container for rendering
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "-9999px";
        tempContainer.style.width = "1200px"; // Larger width for better quality
        document.body.appendChild(tempContainer);

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await (window as any).mermaid.render(id, mermaidCode);
        
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        setSvgContent(svg);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        console.error("Mermaid code that failed:", mermaidCode);
        setError(`Failed to render diagram: ${err.message}. Please try again.`);
        setIsLoading(false);
      }
    };

    loadAndRenderMermaid();
  }, [mermaidCode]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600 text-lg">Generating beautiful roadmap diagram...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="text-red-600 text-center max-w-md bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="font-medium mb-2 text-lg">Diagram Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return null;
  }

  return (
    <div className="w-full flex justify-center py-8">
      <div 
        ref={containerRef}
        className="max-w-full overflow-x-auto bg-white rounded-lg shadow-lg p-6 border border-slate-200"
        style={{ minHeight: '400px' }}
      >
        <div 
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ 
            transform: 'scale(1.2)', 
            transformOrigin: 'center top',
            marginBottom: '20px'
          }}
        />
      </div>
    </div>
  );
} 