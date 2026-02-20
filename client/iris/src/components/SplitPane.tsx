'use client';

import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { ChatPanel } from './ChatPanel';
import { VisualizationPanel } from './VisualizationPanel';

/**
 * SplitPane Component
 * Main container with resizable split-pane layout
 * Left: Chat interface for capturing user intent
 * Right: Live visualization and agent status
 */
export function SplitPane() {
  return (
    <div className="h-full w-full">
      <Allotment defaultSizes={[45, 55]}>
        {/* Left Pane: Chat Interface */}
        <Allotment.Pane minSize={350} preferredSize="45%">
          <div className="h-full bg-[#111113] border-r border-[#27272a]">
            <ChatPanel />
          </div>
        </Allotment.Pane>

        {/* Right Pane: Visualization */}
        <Allotment.Pane minSize={400} preferredSize="55%">
          <div className="h-full bg-[#09090b]">
            <VisualizationPanel />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default SplitPane;
