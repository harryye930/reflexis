import React, { useEffect, useMemo, useState, useCallback, useContext, createContext } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { appId } from '../constants/appId.js';
import { FirebaseServiceFactory } from '../services/api/firebase/index.js';
import 'reactflow/dist/style.css';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

// React Flow requires window; use dynamic import to avoid SSR issues
const ReactFlow = dynamic(() => import('reactflow').then(m => m.default || m), { ssr: false });
const Background = dynamic(() => import('reactflow').then(m => m.Background), { ssr: false });
const Controls = dynamic(() => import('reactflow').then(m => m.Controls), { ssr: false });
const MiniMap = dynamic(() => import('reactflow').then(m => m.MiniMap), { ssr: false });
const Handle = dynamic(() => import('reactflow').then(m => m.Handle), { ssr: false });

// Layout constants
const NODE_WIDTH = 260;
const X_GAP = NODE_WIDTH + 20;
const Y_GAP = 200;
const ZOOM_THRESHOLD = 0.75;

// Provide zoom value to custom nodes for level-of-detail rendering
const ZoomContext = createContext(1);

// Helper functions
const getTimestamp = (entry) => entry.timestamp?.toMillis?.() || +new Date(entry.timestamp);
const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();
const getCodeLabel = (entry, codeInfo) => 
  codeInfo.label || entry?.changes?.label?.to || entry?.changes?.sourceCode?.label || entry?.codeLabel || entry.codeId;

// Custom node component with zoom-aware rendering
const HistoryNode = ({ data, selected }) => {
  const zoom = useContext(ZoomContext);
  const zoomedOut = zoom < ZOOM_THRESHOLD;

  const display = zoomedOut ? (
    <div className="font-semibold text-[14px] sm:text-[16px] tracking-wide">
      {data.action}
    </div>
  ) : (
    <div className="whitespace-pre-line">
      <div className="text-[11px] text-gray-700/80">{data.timestampText}</div>
      <div className="uppercase tracking-wide">{data.action}</div>
      <div className="font-semibold">{data.codeLabel}</div>
      {data.description && <div className="mt-1">{data.description}</div>}
    </div>
  );

  return (
    <div
      className={`${data.className} ${selected ? 'ring-2 ring-blue-400' : ''} ${zoomedOut ? 'py-3' : ''}`}
      style={data.style}
    >
  {/* Explicit handle IDs so edges can target left/right intentionally */}
  <Handle type="target" position="left" id="target-left" style={{ background: '#555' }} />
  <Handle type="target" position="right" id="target-right" style={{ background: '#555' }} />
      {display}
  <Handle type="source" position="right" id="source-right" style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = { historyNode: HistoryNode };

// Build a time-vs-code waterfall layout graph
function buildGraph(historyEntries, codesMap) {
  const entries = [...historyEntries].sort((a, b) => getTimestamp(a) - getTimestamp(b));

  // Determine code creation order
  const codeFirstTime = new Map();
  entries.forEach(e => {
    const t = getTimestamp(e);
    if (!codeFirstTime.has(e.codeId)) codeFirstTime.set(e.codeId, t);
  });

  const orderedCodes = Array.from(codeFirstTime.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([codeId]) => codeId);

  const yIndex = new Map();
  orderedCodes.forEach((codeId, idx) => yIndex.set(codeId, idx));

  // Create time buckets (minute-level granularity)
  const bucketKey = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  };

  const bucketOrder = new Map();
  const bucketFirstTs = new Map();
  let bucketCounter = 0;

  entries.forEach(e => {
    const t = getTimestamp(e);
    const key = bucketKey(t);
    if (!bucketOrder.has(key)) {
      bucketOrder.set(key, bucketCounter++);
      bucketFirstTs.set(key, t);
    }
  });

  const nodes = [];
  const edges = [];
  const lastNodePerCode = new Map();
  const positionTracker = new Map(); // Track occupied positions for collision detection

  // Build history nodes
  entries.forEach(entry => {
    const id = `${entry.id}`;
    const codeId = entry.codeId;
    const codeInfo = codesMap.get(codeId) || {};
    const label = getCodeLabel(entry, codeInfo);
    const t = getTimestamp(entry);
    
    let x = (bucketOrder.get(bucketKey(t)) || 0) * X_GAP;
    let y = (yIndex.get(codeId) || 0) * Y_GAP;

    // Check for position collision and apply slight offset if needed
    const posKey = `${Math.round(x)},${Math.round(y)}`;
    if (positionTracker.has(posKey)) {
      // Apply small offset to avoid overlap - shift right and slightly down
      const offsetCount = positionTracker.get(posKey);
      x += offsetCount * 15; // 15px right shift per collision
      y += offsetCount * 8;  // 8px down shift per collision
      positionTracker.set(posKey, offsetCount + 1);
    } else {
      positionTracker.set(posKey, 1);
    }

    // Styling based on deletion status
    const isDeleted = codeInfo.isDeleted === true;
    const bgClass = isDeleted ? 'bg-gray-200' : (codeInfo.color || 'bg-amber-300');
    const textClass = isDeleted ? 'text-gray-800' : (codeInfo.textColor || 'text-gray-800');

  nodes.push({
      id,
      type: 'historyNode',
      position: { x, y },
      data: {
        action: (entry.type || '').replace(/_/g, ' ').toUpperCase(),
        timestampText: formatTimestamp(t),
        codeLabel: label,
        description: entry.description || '',
        className: `code-palette-unified ${bgClass} ${textClass} text-[12px] leading-snug p-2 rounded-md border border-gray-200`,
        style: { width: NODE_WIDTH },
      },
      draggable: true,
    });

    // Chain nodes within same code
    const prevId = lastNodePerCode.get(codeId);
    if (prevId) {
      edges.push({ 
        id: `${codeId}-${prevId}->${id}`, 
        source: prevId, 
        target: id, 
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        style: {
          strokeWidth: 1.5
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#6B7280',
          width: 15,
          height: 15
        },
        animated: true 
      });
    }
    lastNodePerCode.set(codeId, id);

    // Store merge/split info for post-processing
  if ((entry.type === 'merge' || entry.type === 'merge_and_delete') && entry.changes?.sourceCodeIds) {
      entry._mergeNodeId = id;
      entry._mergeSourceIds = entry.changes.sourceCodeIds;
    }
  if ((entry.type === 'split' || entry.type === 'split_and_delete') && entry.changes?.targetCodes?.length) {
      entry._splitNodeId = id;
    }
  });

  // Create merge connections
  entries
  .filter(e => (e.type === 'merge' || e.type === 'merge_and_delete') && e._mergeSourceIds?.length)
    .forEach(mergeEntry => {
      const mergeNodeId = mergeEntry._mergeNodeId;
      if (!mergeNodeId) return;

      mergeEntry._mergeSourceIds.forEach(srcId => {
        if (srcId === mergeEntry.codeId) return;
        const sourceLastNode = lastNodePerCode.get(srcId);
        if (sourceLastNode) {
          edges.push({ 
            id: `merge-${srcId}->${mergeNodeId}`, 
            source: sourceLastNode, 
            target: mergeNodeId, 
            sourceHandle: 'source-right',
            targetHandle: 'target-right',
            label: 'MERGE INTO',
            labelStyle: { 
              fontSize: '10px', 
              fontWeight: 'bold', 
              fill: '#7C3AED',
              backgroundColor: 'white',
              padding: '2px 4px',
              borderRadius: '3px',
              border: '1px solid #7C3AED'
            },
            labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
            style: { 
              stroke: '#7C3AED',
              strokeWidth: 2
            },
            animated: true
          });
        }
      });
    });

  // Create split connections  
  entries
  .filter(e => (e.type === 'split' || e.type === 'split_and_delete') && e.changes?.targetCodes?.length)
    .forEach(splitEntry => {
      const splitNodeId = splitEntry._splitNodeId;
      if (!splitNodeId) return;

    splitEntry.changes.targetCodes.forEach(tCode => {
        const targetSplitEntries = entries.filter(e => 
          e.codeId === tCode.id && 
      (e.type === 'create' || e.type === 'split' || e.type === 'split_and_delete' || 
           (e.description && e.description.toLowerCase().includes('split')))
        );
        
        const splitTime = getTimestamp(splitEntry);
        for (const targetEntry of targetSplitEntries) {
          const targetTime = getTimestamp(targetEntry);
          if (targetTime >= splitTime) {
            edges.push({ 
              id: `split-${splitNodeId}->${targetEntry.id}`, 
              source: splitNodeId, 
              target: `${targetEntry.id}`, 
              sourceHandle: 'source-right',
              targetHandle: 'target-right',
              label: 'SPLIT INTO',
              labelStyle: { 
                fontSize: '10px', 
                fontWeight: 'bold', 
                fill: '#EA580C',
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid #EA580C'
              },
              labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
              style: { 
                stroke: '#EA580C',
                strokeWidth: 2
              },
              animated: true
            });
            break;
          }
        }
      });
    });

  // Add axis labels
  const sortedBuckets = Array.from(bucketOrder.entries()).sort((a, b) => a[1] - b[1]);
  
  // X-axis time labels
  sortedBuckets.forEach(([key, idx]) => {
    const ts = bucketFirstTs.get(key);
    nodes.push({
      id: `axis-x-${idx}`,
      type: 'default',
      position: { x: idx * X_GAP, y: -80 },
      data: { label: formatTimestamp(ts) },
      className: 'bg-white text-gray-700 text-[11px] px-2 py-1 rounded border border-gray-200 shadow-sm',
      style: { width: NODE_WIDTH, minWidth: NODE_WIDTH, maxWidth: NODE_WIDTH },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });
  });

  // Y-axis code labels
  orderedCodes.forEach(codeId => {
    const info = codesMap.get(codeId) || {};
    const label = `${info.label || codeId}${info.isDeleted ? ' (deleted)' : ''}`;
    nodes.push({
      id: `axis-y-${codeId}`,
      type: 'default',
      position: { x: -260, y: (yIndex.get(codeId) || 0) * Y_GAP },
      data: { label },
      className: 'bg-white text-gray-800 text-[12px] px-2 py-1 rounded border border-gray-200 shadow-sm font-semibold',
      style: { width: 240 },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });
  });

  return { nodes, edges };
}

export default function CodeHistoryGraphPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codesMap, setCodesMap] = useState(new Map());
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const factory = new FirebaseServiceFactory(appId);
    let unsub, unsubCodes;

    (async () => {
      try {
        const res = await factory.getAllHistory();
        if (res.success) setHistory(res.data);
        unsub = factory.onAllHistorySnapshot(setHistory);

        unsubCodes = factory.codes.onCodesSnapshot((codes) => {
          const m = new Map();
          codes.forEach((c) => {
            m.set(c.id, { 
              label: c.label, 
              color: c.color, 
              textColor: c.textColor, 
              isDeleted: !!c.isDeleted 
            });
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
      unsub?.();
      unsubCodes?.();
    };
  }, []);

  const graph = useMemo(() => buildGraph(history, codesMap), [history, codesMap]);

  // Preserve user-dragged positions when graph updates
  useEffect(() => {
    if (!graph) return;
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return graph.nodes.map((n) => {
        const before = prevById.get(n.id);
        return before?.position ? {
          ...n,
          position: before.position,
          positionAbsolute: before.positionAbsolute || n.positionAbsolute,
          selected: before.selected || false,
        } : n;
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
          <ZoomAwareFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </div>
      )}
    </div>
  );
}

// Wrapper component to capture zoom and provide it to nodes
function ZoomAwareFlow({ nodes, edges, nodeTypes, onNodesChange, onEdgesChange }) {
  const [zoom, setZoom] = useState(1);

  const handleMove = useCallback((_, viewport) => {
    if (viewport?.zoom != null) setZoom(viewport.zoom);
  }, []);

  const handleInit = useCallback((instance) => {
    try {
      const z = instance.getZoom?.();
      if (typeof z === 'number') setZoom(z);
    } catch (e) {
      // Ignore initialization errors
    }
  }, []);

  return (
    <ZoomContext.Provider value={zoom}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        selectionOnDrag={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleMove}
        onInit={handleInit}
        minZoom={0.1}
        maxZoom={2}
      >
        <MiniMap />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </ZoomContext.Provider>
  );
}
