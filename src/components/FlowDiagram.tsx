/**
 * FlowDiagram — renders a vertical sequence of tiers connected by arrows.
 *
 * Each tier has a label, an optional narrative annotation, and a row of
 * FlowNode cards. CSS handles the vertical connector lines between tiers.
 */

import type { ReactNode } from 'react';

export interface FlowTier {
  id: string;
  label: string;
  annotation?: string;        // explanatory text shown above the tier's nodes
  nodes: ReactNode;           // one or more <FlowNode> elements (or any JSX)
}

interface FlowDiagramProps {
  tiers: FlowTier[];
}

export default function FlowDiagram({ tiers }: FlowDiagramProps) {
  return (
    <div className="flow-diagram">
      {tiers.map((tier, i) => (
        <div key={tier.id} className="flow-tier-wrapper">
          {/* Connector arrow between tiers */}
          {i > 0 && (
            <div className="flow-connector">
              <div className="flow-connector__line" />
              <div className="flow-connector__arrow" />
            </div>
          )}

          {/* Annotation text between tiers */}
          {tier.annotation && (
            <p className="flow-tier-annotation">{tier.annotation}</p>
          )}

          {/* Tier header + nodes */}
          <div className="flow-tier">
            <div className="flow-tier__label">{tier.label}</div>
            <div className="flow-tier__nodes">{tier.nodes}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
