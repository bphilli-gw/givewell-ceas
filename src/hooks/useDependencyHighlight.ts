/**
 * Hook for interactive dependency highlighting in Explore pages.
 *
 * Given a dependency graph and the currently selected node ID,
 * returns a function that computes the highlight state for any node.
 */

import { useState, useMemo, useCallback, type ComponentProps } from 'react';
import type { DependencyGraph } from '../model/dependency-graph';
import { getAncestors, getDependents } from '../model/dependency-graph';
import type FlowNodeComponent from '../components/FlowNode';

export type HighlightRole = 'selected' | 'ancestor' | 'dependent';

export interface NodeHighlight {
  isSelected: boolean;
  isDimmed: boolean;
  highlightRole?: HighlightRole;
}

export function useDependencyHighlight(graph: DependencyGraph) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { ancestors, dependents } = useMemo(() => {
    if (!selectedNodeId) return { ancestors: new Set<string>(), dependents: new Set<string>() };
    return {
      ancestors: getAncestors(graph, selectedNodeId),
      dependents: getDependents(graph, selectedNodeId),
    };
  }, [graph, selectedNodeId]);

  const hasSelection = selectedNodeId !== null;

  const getHighlight = useCallback(
    (nodeId: string): NodeHighlight => {
      if (!hasSelection) return { isSelected: false, isDimmed: false };
      if (nodeId === selectedNodeId) return { isSelected: true, isDimmed: false, highlightRole: 'selected' };
      if (ancestors.has(nodeId)) return { isSelected: false, isDimmed: false, highlightRole: 'ancestor' };
      if (dependents.has(nodeId)) return { isSelected: false, isDimmed: false, highlightRole: 'dependent' };
      return { isSelected: false, isDimmed: true };
    },
    [hasSelection, selectedNodeId, ancestors, dependents],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
    },
    [],
  );

  const clearSelection = useCallback(() => setSelectedNodeId(null), []);

  /** Returns extra props to spread onto a FlowNode to wire up highlighting. */
  const propsFor = useCallback(
    (nodeId: string): Pick<ComponentProps<typeof FlowNodeComponent>, 'nodeId' | 'isSelected' | 'isDimmed' | 'highlightRole' | 'onNodeClick'> => {
      const h = getHighlight(nodeId);
      return {
        nodeId,
        isSelected: h.isSelected,
        isDimmed: h.isDimmed,
        highlightRole: h.highlightRole,
        onNodeClick: handleNodeClick,
      };
    },
    [getHighlight, handleNodeClick],
  );

  return { selectedNodeId, getHighlight, handleNodeClick, clearSelection, hasSelection, propsFor };
}
