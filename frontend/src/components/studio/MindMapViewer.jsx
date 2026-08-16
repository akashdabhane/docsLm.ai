'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Sparkles } from 'lucide-react';

// Custom Mind Map Node Component
function MindMapNode({ data }) {
  return (
    <div className={`px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold max-w-[220px] transition ${
      data.isRoot
        ? 'bg-blue-600 border-blue-400 text-white text-sm'
        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-blue-400'
    }`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
      <div className="flex items-center gap-1.5">
        {data.isRoot && <Sparkles className="h-3.5 w-3.5 text-blue-200" />}
        <span className="truncate">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { mindMapNode: MindMapNode };

export default function MindMapViewer({ mindMapData }) {
  const { nodes, edges } = useMemo(() => {
    if (!mindMapData || !mindMapData.root) {
      return { nodes: [], edges: [] };
    }

    const generatedNodes = [];
    const generatedEdges = [];
    let nodeIdCounter = 1;

    // Root Node
    const rootId = 'node_root';
    generatedNodes.push({
      id: rootId,
      type: 'mindMapNode',
      data: { label: mindMapData.root, isRoot: true },
      position: { x: 50, y: 250 },
    });

    const levelXOffset = 260;
    const itemYSpacing = 90;

    const processChildren = (children, parentId, level, startY) => {
      children.forEach((child, idx) => {
        const childId = `node_${nodeIdCounter++}`;
        const x = 50 + level * levelXOffset;
        const y = startY + idx * itemYSpacing;

        generatedNodes.push({
          id: childId,
          type: 'mindMapNode',
          data: { label: child.title || child.label, isRoot: false },
          position: { x, y },
        });

        generatedEdges.push({
          id: `edge_${parentId}_${childId}`,
          source: parentId,
          target: childId,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        });

        if (child.children && child.children.length > 0) {
          processChildren(child.children, childId, level + 1, y - (child.children.length * 30));
        }
      });
    };

    if (mindMapData.children) {
      const totalChildren = mindMapData.children.length;
      const startY = 250 - ((totalChildren - 1) * itemYSpacing) / 2;
      processChildren(mindMapData.children, rootId, 1, startY);
    }

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [mindMapData]);

  if (!mindMapData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Network className="h-10 w-10 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300">Generate Mind Map</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Synthesizes document concepts into an interactive hierarchical topic graph using React Flow.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[450px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-slate-900 border-slate-800" />
      </ReactFlow>
    </div>
  );
}
