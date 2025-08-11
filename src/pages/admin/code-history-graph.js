import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { appId } from '../../constants/index.js';
import { FirebaseServiceFactory } from '../../services/api/firebase/index.js';
import 'reactflow/dist/style.css';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

// React Flow requires window; use dynamic import to avoid SSR issues
const ReactFlow = dynamic(() => import('reactflow').then(m => m.default || m), { ssr: false });
const Background = dynamic(() => import('reactflow').then(m => m.Background), { ssr: false });
const Controls = dynamic(() => import('reactflow').then(m => m.Controls), { ssr: false });
const MiniMap = dynamic(() => import('reactflow').then(m => m.MiniMap), { ssr: false });
const Handle = dynamic(() => import('reactflow').then(m => m.Handle), { ssr: false });
const Position = dynamic(() => import('reactflow').then(m => m.Position), { ssr: false });

// Custom node component with side handles
const HistoryNode = ({ data, selected }) => {
  return (
    <div 
      className={`${data.className} ${selected ? 'ring-2 ring-blue-400' : ''}`} 
      style={{ ...data.style }}
    >
      <Handle 
        type="target" 
        position="left" 
        style={{ background: '#555' }} 
      />
      <div>{data.label}</div>
      <Handle 
        type="source" 
        position="right" 
        style={{ background: '#555' }} 
      />
    </div>
  );
};

const nodeTypes = {
  historyNode: HistoryNode,
};

// Build a time-vs-code waterfall layout graph, including axis helper nodes
function buildGraph(historyEntries, codesMap) {
  // 1) Sort events ascending by time
  const entries = [...historyEntries].sort(
    (a, b) => (a.timestamp?.toMillis?.() || +new Date(a.timestamp)) - (b.timestamp?.toMillis?.() || +new Date(b.timestamp))
  );

  // 2) Determine each code's creation time (first event or explicit created)
  const codeFirstTime = new Map();
  for (const e of entries) {
    const t = e.timestamp?.toMillis?.() || +new Date(e.timestamp);
    if (!codeFirstTime.has(e.codeId)) codeFirstTime.set(e.codeId, t);
  }

  // 3) Order codes by creation time (earliest on top)
  const orderedCodes = Array.from(codeFirstTime.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([codeId]) => codeId);

  const yIndex = new Map();
  orderedCodes.forEach((codeId, idx) => yIndex.set(codeId, idx));

  // 4) Create time buckets along x-axis (minute-level granularity)
  const bucketKey = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  };
  const bucketOrder = new Map();
  const bucketFirstTs = new Map();
  let bucketCounter = 0;
  for (const e of entries) {
    const t = e.timestamp?.toMillis?.() || +new Date(e.timestamp);
    const key = bucketKey(t);
    if (!bucketOrder.has(key)) {
      bucketOrder.set(key, bucketCounter++);
      bucketFirstTs.set(key, t);
    }
  }

  // 5) Build nodes/edges
  const nodes = [];
  const edges = [];
  const lastNodePerCode = new Map();

  const xGap = 220; // px between consecutive time buckets
  const yGap = 120; // px between codes

  for (const entry of entries) {
    const id = `${entry.id}`;
    const codeId = entry.codeId;
  const codeInfo = codesMap.get(codeId) || {};
    const label = codeInfo.label || entry?.changes?.label?.to || entry?.changes?.sourceCode?.label || entry?.codeLabel || codeId;

    const t = entry.timestamp?.toMillis?.() || +new Date(entry.timestamp);
    const x = (bucketOrder.get(bucketKey(t)) || 0) * xGap;
    const y = (yIndex.get(codeId) || 0) * yGap;

  // Deleted codes: force gray styling for all their nodes
  const isDeleted = codeInfo.isDeleted === true;
  const bgClass = isDeleted ? 'bg-gray-200' : (codeInfo.color || 'bg-amber-300');
  const textClass = isDeleted ? 'text-gray-800' : (codeInfo.textColor || 'text-gray-800');

    nodes.push({
      id,
      type: 'historyNode',
      position: { x, y },
      data: {
        label: `${new Date(t).toLocaleString()}\n${(entry.type || '').toUpperCase()}\n${label}${entry.description ? `\n${entry.description}` : ''}`,
        className: `code-palette-unified ${bgClass} ${textClass} text-[12px] leading-snug p-2 rounded-md border border-gray-200 whitespace-pre-line`,
        style: {
          width: 260,
        },
      },
      draggable: true,
    });

    // Chain within same code
    const prevId = lastNodePerCode.get(codeId);
    if (prevId) {
      edges.push({ 
        id: `${codeId}-${prevId}->${id}`, 
        source: prevId, 
        target: id, 
        sourceHandle: 'right',
        targetHandle: 'left',
        animated: true 
      });
    }
    lastNodePerCode.set(codeId, id);

    // Merge connections: we'll handle this after processing all nodes
    if (entry.type === 'merged' && entry.changes?.sourceCodeIds) {
      // Store merge info for later processing
      entry._mergeNodeId = id;
      entry._mergeSourceIds = entry.changes.sourceCodeIds;
    }

    // Split connections: from this split node to receiver codes that have SPLIT
    if (entry.type === 'split' && entry.changes?.targetCodes?.length) {
      // We'll create connections after all nodes are processed, as target SPLIT nodes may come later
      // Store this split info for later processing
      entry._splitNodeId = id;
    }
  }

  // Post-process merge connections: connect source codes to the receiver code that has MERGE operations
  const mergeEntries = entries.filter(e => e.type === 'merged' && e._mergeSourceIds?.length);
  for (const mergeEntry of mergeEntries) {
    const mergeNodeId = mergeEntry._mergeNodeId;
    if (!mergeNodeId) continue;

    for (const srcId of mergeEntry._mergeSourceIds) {
      if (srcId === mergeEntry.codeId) continue;
      
      // Connect from the last node of the source code to this MERGE node
      const sourceLastNode = lastNodePerCode.get(srcId);
      if (sourceLastNode) {
        edges.push({ 
          id: `merge-${srcId}->${mergeNodeId}`, 
          source: sourceLastNode, 
          target: mergeNodeId, 
          sourceHandle: 'right',
          targetHandle: 'left',
          style: { stroke: '#7C3AED' } 
        });
      }
    }
  }

  // Post-process split connections: connect split nodes to target codes that have SPLIT operations
  const splitEntries = entries.filter(e => e.type === 'split' && e.changes?.targetCodes?.length);
  for (const splitEntry of splitEntries) {
    const splitNodeId = splitEntry._splitNodeId;
    if (!splitNodeId) continue;

    for (const tCode of splitEntry.changes.targetCodes) {
      // Find entries for this target code that indicate a SPLIT operation (could be 'created' from split)
      const targetSplitEntries = entries.filter(e => 
        e.codeId === tCode.id && 
        (e.type === 'created' || e.type === 'split' || (e.description && e.description.toLowerCase().includes('split')))
      );
      
      // Connect to the first relevant target entry for this code
      for (const targetEntry of targetSplitEntries) {
        const targetNodeId = `${targetEntry.id}`;
        // Only connect if this target entry comes after the split
        const splitTime = splitEntry.timestamp?.toMillis?.() || +new Date(splitEntry.timestamp);
        const targetTime = targetEntry.timestamp?.toMillis?.() || +new Date(targetEntry.timestamp);
        
        if (targetTime >= splitTime) {
          edges.push({ 
            id: `split-${splitNodeId}->${targetNodeId}`, 
            source: splitNodeId, 
            target: targetNodeId, 
            sourceHandle: 'right',
            targetHandle: 'left',
            style: { stroke: '#EA580C' } 
          });
          break; // Only connect to the first matching target node per target code
        }
      }
    }
  }

  // 6) Add axis helper nodes

  // X-axis bucket labels (top)
  const sortedBuckets = Array.from(bucketOrder.entries()).sort((a, b) => a[1] - b[1]);
  for (const [key, idx] of sortedBuckets) {
    const ts = bucketFirstTs.get(key);
    const label = new Date(ts).toLocaleString();
    nodes.push({
      id: `axis-x-${idx}`,
      type: 'default',
      position: { x: idx * xGap, y: -80 },
      data: { 
        label,
        className: 'bg-white text-gray-700 text-[11px] px-2 py-1 rounded border border-gray-200 shadow-sm',
        style: { width: 220 }
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });
  }

  // Y-axis code labels (left)
  for (const codeId of orderedCodes) {
    const info = codesMap.get(codeId) || {};
    const label = `${info.label || codeId}${info.isDeleted ? ' (deleted)' : ''}`;
    nodes.push({
      id: `axis-y-${codeId}`,
      type: 'default',
      position: { x: -260, y: (yIndex.get(codeId) || 0) * yGap },
      data: { 
        label,
        className: 'bg-white text-gray-800 text-[12px] px-2 py-1 rounded border border-gray-200 shadow-sm',
        style: { width: 240 }
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });
  }

  return { nodes, edges };
}

export default function CodeHistoryGraphPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codesMap, setCodesMap] = useState(new Map());
  // Controlled React Flow state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const factory = new FirebaseServiceFactory(appId);
    let unsub;
    let unsubCodes;
    (async () => {
      try {
        // Fetch initial data
        const res = await factory.getAllHistory();
        if (res.success) setHistory(res.data);
        // Live updates
        unsub = factory.onAllHistorySnapshot((data) => setHistory(data));

        // Subscribe to codes to obtain colors/labels
    unsubCodes = factory.codes.onCodesSnapshot((codes) => {
          const m = new Map();
          codes.forEach((c) => {
            // Codes store tailwind classes like bg-*-200 and text-*-800
      m.set(c.id, { label: c.label, color: c.color, textColor: c.textColor, isDeleted: !!c.isDeleted });
          });
          setCodesMap(m);
        });
      } catch (e) {
        console.error(e);
        setError('Failed to load code history');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (unsub) unsub();
      if (unsubCodes) unsubCodes();
    };
  }, []);

  const graph = useMemo(() => buildGraph(history, codesMap), [history, codesMap]);

  // Merge new graph with existing node positions so user drags are preserved
  useEffect(() => {
    if (!graph) return;
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return graph.nodes.map((n) => {
        const before = prevById.get(n.id);
        if (before && before.position) {
          // keep user-updated position and dragging-related flags
          return {
            ...n,
            position: before.position,
            positionAbsolute: before.positionAbsolute || n.positionAbsolute,
            selected: before.selected || false,
          };
        }
        return n;
      });
    });
    setEdges(graph.edges);
  }, [graph]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  return (
    <div className="h-screen w-screen">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-blue-600 hover:underline">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="font-semibold">Code History Graph</span>
        </div>
        <div className="text-xs text-gray-500">Events: {history.length}</div>
      </div>
      {loading ? (
        <div className="p-6 text-gray-600">Loading history…</div>
      ) : error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : (
        <div className="h-[calc(100vh-48px)]">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={[1, 2]} // Allow panning with left and middle mouse button
            selectionOnDrag={false} // Prevent selection box when dragging
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
