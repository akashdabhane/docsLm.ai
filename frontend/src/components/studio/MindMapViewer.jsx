'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Sparkles, Loader2, ChevronRight, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

// Custom Mind Map Node Component with Collapse/Expand Controls
function MindMapNode({ data }) {
  const { id, label, isRoot, hasChildren, childCount, isCollapsed, onToggleExpand } = data;

  return (
    <div
      onClick={(e) => {
        if (hasChildren) {
          e.stopPropagation();
          onToggleExpand(id);
        }
      }}
      className={`px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold max-w-[240px] transition-all flex items-center justify-between gap-2.5 ${
        hasChildren ? 'cursor-pointer select-none' : ''
      } ${
        isRoot
          ? 'bg-blue-600 border-blue-400 text-white text-sm shadow-blue-500/20'
          : isCollapsed
          ? 'bg-slate-900 border-blue-500/70 text-blue-300 hover:border-blue-400 ring-1 ring-blue-500/30'
          : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-blue-400'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />

      <div className="flex items-center gap-1.5 truncate">
        {isRoot && <Sparkles className="h-3.5 w-3.5 text-blue-200 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>

      {hasChildren && (
        <span
          className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 shrink-0 transition ${
            isCollapsed
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title={isCollapsed ? 'Click to expand sub-nodes' : 'Click to collapse sub-nodes'}
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[9px] font-mono px-0.5">+{childCount}</span>
            </>
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      )}

      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { mindMapNode: MindMapNode };

export default function MindMapViewer({ mindMapData, onGenerate, generating }) {
  const [collapsedNodeIds, setCollapsedNodeIds] = useState(() => new Set());

  const handleToggleExpand = useCallback((nodeId) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const { nodes, edges, allParentIds } = useMemo(() => {
    if (!mindMapData || !mindMapData.root) {
      return { nodes: [], edges: [], allParentIds: [] };
    }

    const rawNodes = [];
    const childrenMap = {}; // parentId -> [childId1, ...]
    const parentMap = {};   // childId -> parentId
    const parentsSet = new Set();
    let counter = 1;

    const rootId = 'node_root';
    rawNodes.push({
      id: rootId,
      label: mindMapData.root,
      isRoot: true,
      parentId: null,
      level: 0,
    });
    childrenMap[rootId] = [];

    function traverse(children, parentId, level) {
      if (!children || children.length === 0) return;
      parentsSet.add(parentId);

      children.forEach((child) => {
        const childId = `node_${counter++}`;
        rawNodes.push({
          id: childId,
          label: child.title || child.label,
          isRoot: false,
          parentId,
          level,
        });
        parentMap[childId] = parentId;
        if (!childrenMap[parentId]) childrenMap[parentId] = [];
        childrenMap[parentId].push(childId);
        childrenMap[childId] = [];

        if (child.children && child.children.length > 0) {
          traverse(child.children, childId, level + 1);
        }
      });
    }

    if (mindMapData.children && mindMapData.children.length > 0) {
      traverse(mindMapData.children, rootId, 1);
    }

    // Helper: is node hidden due to any ancestor being collapsed?
    function isHidden(nodeId) {
      let p = parentMap[nodeId];
      while (p) {
        if (collapsedNodeIds.has(p)) return true;
        p = parentMap[p];
      }
      return false;
    }

    // Filter visible nodes
    const visibleNodes = rawNodes.filter((n) => !isHidden(n.id));
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    // Compute coordinates for visible nodes dynamically
    const nodePositions = {};
    nodePositions[rootId] = { x: 50, y: 250 };

    const levelXOffset = 260;
    const itemYSpacing = 90;

    function positionChildrenOf(parentId) {
      const parentPos = nodePositions[parentId];
      if (!parentPos) return;

      const directVisChildren = (childrenMap[parentId] || []).filter((id) => visibleNodeIds.has(id));
      if (directVisChildren.length === 0) return;

      const total = directVisChildren.length;
      const startY = parentPos.y - ((total - 1) * itemYSpacing) / 2;

      directVisChildren.forEach((childId, idx) => {
        const x = parentPos.x + levelXOffset;
        const y = startY + idx * itemYSpacing;
        nodePositions[childId] = { x, y };

        positionChildrenOf(childId);
      });
    }

    positionChildrenOf(rootId);

    // Create React Flow node objects
    const generatedNodes = visibleNodes.map((n) => {
      const pos = nodePositions[n.id] || { x: 50 + n.level * levelXOffset, y: 250 };
      const childCount = (childrenMap[n.id] || []).length;
      const hasChildren = childCount > 0;
      const isCollapsed = collapsedNodeIds.has(n.id);

      return {
        id: n.id,
        type: 'mindMapNode',
        data: {
          id: n.id,
          label: n.label,
          isRoot: n.isRoot,
          hasChildren,
          childCount,
          isCollapsed,
          onToggleExpand: handleToggleExpand,
        },
        position: pos,
      };
    });

    const generatedEdges = [];
    visibleNodes.forEach((n) => {
      if (n.parentId && visibleNodeIds.has(n.parentId)) {
        generatedEdges.push({
          id: `edge_${n.parentId}_${n.id}`,
          source: n.parentId,
          target: n.id,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        });
      }
    });

    return {
      nodes: generatedNodes,
      edges: generatedEdges,
      allParentIds: Array.from(parentsSet),
    };
  }, [mindMapData, collapsedNodeIds, handleToggleExpand]);

  const handleExpandAll = () => setCollapsedNodeIds(new Set());
  const handleCollapseAll = () => setCollapsedNodeIds(new Set(allParentIds));

  if (generating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-white">Synthesizing Mind Map...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Synthesizing document concepts into an interactive hierarchical topic graph using React Flow.
        </p>
      </div>
    );
  }

  if (!mindMapData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <Network className="h-10 w-10 text-blue-400 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Generate Mind Map</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5">
          Synthesize document concepts into a structured hierarchical topic graph using React Flow.
        </p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Mind Map
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[450px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner flex flex-col">
      {/* Top Toolbar for Expand/Collapse All */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold text-white">Interactive Concept Graph</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
            {nodes.length} nodes visible
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExpandAll}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
            title="Expand all nodes"
          >
            <Maximize2 className="h-3 w-3" /> Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
            title="Collapse all nodes"
          >
            <Minimize2 className="h-3 w-3" /> Collapse All
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative">
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
    </div>
  );
}
