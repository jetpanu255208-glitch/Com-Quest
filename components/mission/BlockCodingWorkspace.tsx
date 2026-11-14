'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BLOCK_CATEGORIES,
  BlockCategory,
  BlockTemplate,
  LessonBlockConfig,
  WorkspaceBlock,
  createBlockInstance,
  cloneWorkspaceBlocks,
  compileBlocksToHtml,
} from '@/lib/constants/mission-blocks';
import {
  Play,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Code2,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Layers,
  Eye,
  BookOpen,
  RotateCcw,
  GripVertical,
  Wand2,
  Laptop,
  Puzzle,
} from 'lucide-react';
import {
  getSoundVolume,
  isSoundMuted,
  playClearSound,
  playHurtSound,
} from '@/lib/sound/sound-manager';

interface CriteriaResultItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

interface BlockCodingWorkspaceProps {
  lessonNumber: number;
  blockConfig: LessonBlockConfig;
  criteriaResults: CriteriaResultItem[];
  allPassed: boolean;
  hasRun: boolean;
  runSuccess: boolean;
  previewHtml: string;
  onCodeChange: (newHtml: string) => void;
  onRunCode: (overrideHtml?: string) => void;
  onStopCode: () => void;
  onShowSolutionModal: () => void;
  externalAssembleTrigger?: number;
}

// ============================================================================
// WEB AUDIO SYNTHESIZER FOR TACTILE LEGO-CLICK SOUND EFFECTS
// ============================================================================
function playBlockTone(type: 'snap' | 'delete' | 'step') {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const volume = getSoundVolume();
  if (volume <= 0) return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const scaledVol = Math.min(0.25, volume * 0.25);

    if (type === 'snap') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.065);
      gain.gain.setValueAtTime(scaledVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.085);
    } else if (type === 'delete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);
      gain.gain.setValueAtTime(scaledVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
      gain.gain.setValueAtTime(scaledVol * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.065);
    }
  } catch {
    // Ignore audio context errors if blocked by browser
  }
}

// Category color styling map (LEGO SPIKE vibrant block palette)
const CATEGORY_STYLES: Record<
  BlockCategory,
  {
    bg: string;
    border: string;
    spineBg: string;
    badgeBg: string;
    shadow: string;
    hex: string;
  }
> = {
  events: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    spineBg: 'bg-amber-600',
    badgeBg: 'bg-amber-700/80 text-amber-100',
    shadow: 'shadow-[0_4px_0_#b45309]',
    hex: '#f59e0b',
  },
  structure: {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    spineBg: 'bg-orange-600',
    badgeBg: 'bg-orange-800/80 text-orange-100',
    shadow: 'shadow-[0_4px_0_#c2410c]',
    hex: '#f97316',
  },
  text: {
    bg: 'bg-[#0284c7]',
    border: 'border-[#0369a1]',
    spineBg: 'bg-[#0369a1]',
    badgeBg: 'bg-sky-950/75 text-sky-100',
    shadow: 'shadow-[0_4px_0_#075985]',
    hex: '#0284c7',
  },
  format: {
    bg: 'bg-violet-600',
    border: 'border-violet-700',
    spineBg: 'bg-violet-700',
    badgeBg: 'bg-violet-950/75 text-violet-100',
    shadow: 'shadow-[0_4px_0_#5b21b6]',
    hex: '#7c3aed',
  },
  media: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-700',
    spineBg: 'bg-emerald-700',
    badgeBg: 'bg-emerald-950/75 text-emerald-100',
    shadow: 'shadow-[0_4px_0_#065f46]',
    hex: '#059669',
  },
  form: {
    bg: 'bg-rose-600',
    border: 'border-rose-700',
    spineBg: 'bg-rose-700',
    badgeBg: 'bg-rose-950/75 text-rose-100',
    shadow: 'shadow-[0_4px_0_#9f1239]',
    hex: '#e11d48',
  },
};

export function BlockCodingWorkspace({
  lessonNumber,
  blockConfig,
  criteriaResults,
  allPassed,
  hasRun,
  runSuccess,
  previewHtml,
  onCodeChange,
  onRunCode,
  onStopCode,
  onShowSolutionModal,
  externalAssembleTrigger,
}: BlockCodingWorkspaceProps) {
  // Template lookup map
  const templateMap = useMemo(() => {
    const map: Record<string, BlockTemplate> = {};
    for (const t of blockConfig.templates) {
      map[t.typeId] = t;
    }
    return map;
  }, [blockConfig.templates]);

  // Workspace Block Tree State + Undo/Redo History
  const [blocks, setBlocks] = useState<WorkspaceBlock[]>(() =>
    cloneWorkspaceBlocks(blockConfig.initialWorkspace)
  );
  const [history, setHistory] = useState<WorkspaceBlock[][]>(() => [
    cloneWorkspaceBlocks(blockConfig.initialWorkspace),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Active category filter on left rail ('all' or specific category)
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all'>('all');

  // Right floating panel state: 'lesson' | 'preview' | 'checklist'
  const [rightTab, setRightTab] = useState<'lesson' | 'preview' | 'checklist'>('lesson');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  // Toggle live HTML code peek drawer at bottom of canvas
  const [showCodePeek, setShowCodePeek] = useState<boolean>(false);

  // Drag & Drop state
  const [draggedPayload, setDraggedPayload] = useState<
    | { source: 'palette'; typeId: string }
    | { source: 'canvas'; instanceId: string }
    | null
  >(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [recentlySnappedId, setRecentlySnappedId] = useState<string | null>(null);

  // Categories actually used in this lesson
  const availableCategories = useMemo(() => {
    const usedSet = new Set(blockConfig.templates.map((t) => t.category));
    return BLOCK_CATEGORIES.filter((c) => usedSet.has(c.id));
  }, [blockConfig.templates]);

  // Compile blocks to HTML and notify parent only when compiledHtml actually changes
  const compiledHtml = useMemo(() => {
    return compileBlocksToHtml(blocks, templateMap, 0);
  }, [blocks, templateMap]);

  const onCodeChangeRef = React.useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  useEffect(() => {
    onCodeChangeRef.current(compiledHtml);
  }, [compiledHtml]);

  // Switch right panel to 'preview' automatically when code runs
  useEffect(() => {
    if (hasRun) {
      setRightTab('preview');
    }
  }, [hasRun, runSuccess]);

  // Handle external trigger to auto-assemble solution blocks
  useEffect(() => {
    if (externalAssembleTrigger && externalAssembleTrigger > 0) {
      const solutionClone = cloneWorkspaceBlocks(blockConfig.solutionWorkspace);
      pushWorkspaceState(solutionClone);
      playBlockTone('snap');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAssembleTrigger]);

  // Push new workspace state to undo/redo history
  const pushWorkspaceState = useCallback(
    (nextBlocks: WorkspaceBlock[]) => {
      setBlocks(nextBlocks);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced.slice(-25), cloneWorkspaceBlocks(nextBlocks)];
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 25));
    },
    [historyIndex]
  );

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setBlocks(cloneWorkspaceBlocks(history[nextIdx]));
      playBlockTone('step');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(cloneWorkspaceBlocks(history[nextIdx]));
      playBlockTone('step');
    }
  };

  // Highlight newly snapped block briefly
  const flashBlock = (instanceId: string) => {
    setRecentlySnappedId(instanceId);
    setTimeout(() => {
      setRecentlySnappedId((prev) => (prev === instanceId ? null : prev));
    }, 650);
  };

  // Smart insert block from palette (either into preferred C-block container or root)
  const handleAddBlockFromPalette = (typeId: string, targetContainerId?: string | null) => {
    const template = templateMap[typeId];
    if (!template) return;

    const newBlock = createBlockInstance(template);
    playBlockTone('snap');
    flashBlock(newBlock.instanceId);

    // 1. If explicit target container ID was specified
    if (targetContainerId && targetContainerId !== 'root') {
      const updated = insertIntoContainer(blocks, targetContainerId, newBlock);
      pushWorkspaceState(updated);
      return;
    }

    // 2. If user clicked a block in palette, check if it has preferredParentTypes (e.g. <li> prefers <ul>, <input> prefers <form>)
    if (!targetContainerId && template.preferredParentTypes && template.preferredParentTypes.length > 0) {
      // Check if selectedContainerId matches or if there's an existing container of that type on canvas
      const matchingContainer = findMatchingContainer(
        blocks,
        template.preferredParentTypes,
        selectedContainerId
      );
      if (matchingContainer) {
        const updated = insertIntoContainer(blocks, matchingContainer.instanceId, newBlock);
        pushWorkspaceState(updated);
        return;
      }
    }

    // 3. Otherwise append to root canvas
    const nextBlocks = [...blocks, newBlock];
    if (template.shape === 'c-block') {
      setSelectedContainerId(newBlock.instanceId);
    }
    pushWorkspaceState(nextBlocks);
  };

  // Helper: Find a matching C-block container in workspace
  function findMatchingContainer(
    list: WorkspaceBlock[],
    preferredTypes: string[],
    preferredInstanceId: string | null
  ): WorkspaceBlock | null {
    if (preferredInstanceId) {
      for (const b of list) {
        if (b.instanceId === preferredInstanceId && preferredTypes.includes(b.typeId)) {
          return b;
        }
      }
    }
    // Search from bottom-most container up so it snaps into the latest matching container
    for (let i = list.length - 1; i >= 0; i--) {
      if (preferredTypes.includes(list[i].typeId)) {
        return list[i];
      }
    }
    return null;
  }

  // Helper: Insert block into a specific C-block container
  function insertIntoContainer(
    list: WorkspaceBlock[],
    containerId: string,
    newBlock: WorkspaceBlock
  ): WorkspaceBlock[] {
    return list.map((b) => {
      if (b.instanceId === containerId) {
        return {
          ...b,
          children: [...b.children, newBlock],
        };
      }
      if (b.children.length > 0) {
        return {
          ...b,
          children: insertIntoContainer(b.children, containerId, newBlock),
        };
      }
      return b;
    });
  }

  // Helper: Remove a block by instanceId and return [remainingTree, removedBlock]
  function removeBlockById(
    list: WorkspaceBlock[],
    instanceId: string
  ): { updated: WorkspaceBlock[]; removed: WorkspaceBlock | null } {
    let removed: WorkspaceBlock | null = null;
    const updated: WorkspaceBlock[] = [];

    for (const b of list) {
      if (b.instanceId === instanceId) {
        removed = b;
        continue;
      }
      if (b.children.length > 0) {
        const childRes = removeBlockById(b.children, instanceId);
        if (childRes.removed) {
          removed = childRes.removed;
          updated.push({ ...b, children: childRes.updated });
          continue;
        }
      }
      updated.push(b);
    }

    return { updated, removed };
  }

  // Update slot value inside a block
  const handleSlotChange = (instanceId: string, slotId: string, value: string) => {
    const updateTree = (list: WorkspaceBlock[]): WorkspaceBlock[] =>
      list.map((b) => {
        if (b.instanceId === instanceId) {
          return {
            ...b,
            slotValues: {
              ...b.slotValues,
              [slotId]: value,
            },
          };
        }
        if (b.children.length > 0) {
          return {
            ...b,
            children: updateTree(b.children),
          };
        }
        return b;
      });

    const next = updateTree(blocks);
    setBlocks(next);
  };

  // Delete block from canvas
  const handleRemoveBlock = (instanceId: string) => {
    const { updated } = removeBlockById(blocks, instanceId);
    playBlockTone('delete');
    pushWorkspaceState(updated);
  };

  // Move block up or down within its sibling list
  const handleMoveBlock = (instanceId: string, direction: 'up' | 'down') => {
    const moveInList = (list: WorkspaceBlock[]): WorkspaceBlock[] => {
      const idx = list.findIndex((b) => b.instanceId === instanceId);
      if (idx !== -1) {
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= list.length) return list;
        const copy = [...list];
        const [item] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, item);
        return copy;
      }
      return list.map((b) =>
        b.children.length > 0 ? { ...b, children: moveInList(b.children) } : b
      );
    };

    const next = moveInList(blocks);
    playBlockTone('snap');
    flashBlock(instanceId);
    pushWorkspaceState(next);
  };

  // Handle Drag & Drop onto root or C-block container or before/after specific block
  const handleDropOnTarget = (targetType: 'root' | 'container' | 'before', targetId?: string) => {
    setActiveDropTarget(null);
    if (!draggedPayload) return;

    if (draggedPayload.source === 'palette') {
      const template = templateMap[draggedPayload.typeId];
      if (!template) return;
      const newBlock = createBlockInstance(template);
      playBlockTone('snap');
      flashBlock(newBlock.instanceId);

      if (targetType === 'container' && targetId) {
        pushWorkspaceState(insertIntoContainer(blocks, targetId, newBlock));
      } else if (targetType === 'before' && targetId) {
        pushWorkspaceState(insertBeforeBlock(blocks, targetId, newBlock));
      } else {
        pushWorkspaceState([...blocks, newBlock]);
      }
    } else if (draggedPayload.source === 'canvas') {
      if (draggedPayload.instanceId === targetId) return;
      const { updated, removed } = removeBlockById(blocks, draggedPayload.instanceId);
      if (!removed) return;
      playBlockTone('snap');
      flashBlock(removed.instanceId);

      if (targetType === 'container' && targetId) {
        pushWorkspaceState(insertIntoContainer(updated, targetId, removed));
      } else if (targetType === 'before' && targetId) {
        pushWorkspaceState(insertBeforeBlock(updated, targetId, removed));
      } else {
        pushWorkspaceState([...updated, removed]);
      }
    }

    setDraggedPayload(null);
  };

  function insertBeforeBlock(
    list: WorkspaceBlock[],
    targetId: string,
    blockToInsert: WorkspaceBlock
  ): WorkspaceBlock[] {
    const idx = list.findIndex((b) => b.instanceId === targetId);
    if (idx !== -1) {
      const copy = [...list];
      copy.splice(idx, 0, blockToInsert);
      return copy;
    }
    return list.map((b) =>
      b.children.length > 0
        ? { ...b, children: insertBeforeBlock(b.children, targetId, blockToInsert) }
        : b
    );
  }

  // Auto-assemble complete solution blocks onto the canvas
  const handleAutoAssembleSolution = () => {
    const solutionClone = cloneWorkspaceBlocks(blockConfig.solutionWorkspace);
    pushWorkspaceState(solutionClone);
    playBlockTone('snap');
  };

  // Clear canvas back to empty
  const handleClearCanvas = () => {
    playBlockTone('delete');
    pushWorkspaceState([]);
    onStopCode();
  };

  // Handle Play Button Click
  const handlePlayClick = () => {
    const currentHtml = compileBlocksToHtml(blocks, templateMap, 0);
    onRunCode(currentHtml);
    setRightTab('preview');
    if (allPassed) {
      playClearSound();
    } else {
      playHurtSound();
    }
  };

  // Count total blocks on canvas (including nested children)
  const totalCanvasBlocks = useMemo(() => {
    const countNodes = (list: WorkspaceBlock[]): number =>
      list.reduce((acc, b) => acc + 1 + countNodes(b.children), 0);
    return countNodes(blocks);
  }, [blocks]);

  // Filtered palette templates
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return blockConfig.templates;
    return blockConfig.templates.filter((t) => t.category === activeCategory);
  }, [activeCategory, blockConfig.templates]);

  // Current active step guide
  const currentStep = blockConfig.steps[currentStepIdx] || blockConfig.steps[0];
  const totalSteps = blockConfig.steps.length;
  const passedCriteriaCount = criteriaResults.filter((c) => c.passed).length;

  // Render an individual block's segments (labels + interactive white pill inputs)
  const renderBlockSegments = (
    template: BlockTemplate,
    slotValues: Record<string, string>,
    instanceId?: string,
    isPalettePreview = false
  ) => {
    const slotsById = Object.fromEntries(template.slots.map((s) => [s.id, s]));

    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-[13px] font-thai font-bold text-white leading-snug">
        {template.segments.map((seg, idx) => {
          if (seg.type === 'label') {
            return (
              <span key={idx} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] select-none">
                {seg.text}
              </span>
            );
          }

          if (seg.type === 'slot' && seg.slotId) {
            const slotDef = slotsById[seg.slotId];
            if (!slotDef) return null;
            const val = slotValues[seg.slotId] ?? slotDef.defaultValue;

            if (isPalettePreview) {
              return (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-white/95 text-slate-900 font-mono text-[11px] font-extrabold shadow-inner border border-black/15 truncate max-w-[140px]"
                >
                  {val}
                </span>
              );
            }

            if (slotDef.type === 'select' && slotDef.options) {
              return (
                <select
                  key={idx}
                  value={val}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (instanceId) {
                      handleSlotChange(instanceId, slotDef.id, e.target.value);
                    }
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-mono text-xs font-extrabold shadow-inner border-2 border-white/80 focus:border-amber-300 focus:outline-none cursor-pointer"
                >
                  {slotDef.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              );
            }

            return (
              <input
                key={idx}
                type="text"
                value={val}
                placeholder={slotDef.placeholder || '...'}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (instanceId) {
                    handleSlotChange(instanceId, slotDef.id, e.target.value);
                  }
                }}
                style={{
                  width: `${Math.max(val.length * 8 + 28, 90)}px`,
                  maxWidth: '240px',
                }}
                className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-mono text-xs font-extrabold shadow-inner border-2 border-white/90 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/50 focus:outline-none transition-all"
              />
            );
          }

          return null;
        })}
      </div>
    );
  };

  // Recursive Renderer for Canvas Workspace Blocks
  const renderWorkspaceBlock = (
    block: WorkspaceBlock,
    idx: number,
    siblingCount: number,
    depth = 0
  ) => {
    const template = templateMap[block.typeId];
    if (!template) return null;

    const style = CATEGORY_STYLES[template.category];
    const isCBlock = template.shape === 'c-block';
    const isSnappedAnim = recentlySnappedId === block.instanceId;
    const isDropBefore = activeDropTarget === `before_${block.instanceId}`;
    const isDropInside = activeDropTarget === `inside_${block.instanceId}`;
    const isSelectedContainer = selectedContainerId === block.instanceId;

    return (
      <div
        key={block.instanceId}
        className={`relative select-none transition-transform duration-200 ${
          isSnappedAnim ? 'scale-[1.03]' : ''
        }`}
      >
        {/* Drop Indicator Before This Block */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveDropTarget(`before_${block.instanceId}`);
          }}
          onDragLeave={() => {
            if (activeDropTarget === `before_${block.instanceId}`) {
              setActiveDropTarget(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDropOnTarget('before', block.instanceId);
          }}
          className={`h-2 -my-1 relative z-20 transition-all rounded-full ${
            isDropBefore
              ? 'h-4 my-0.5 bg-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.9)]'
              : 'hover:bg-sky-400/30'
          }`}
        />

        {/* MAIN BLOCK BODY */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedPayload({ source: 'canvas', instanceId: block.instanceId });
          }}
          onDragEnd={() => {
            setDraggedPayload(null);
            setActiveDropTarget(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isCBlock) {
              setSelectedContainerId(block.instanceId);
            }
          }}
          className="group relative"
        >
          {/* Top Bar of the Block */}
          <div
            className={`relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border-2 ${
              style.bg
            } ${style.border} ${style.shadow} text-white cursor-grab active:cursor-grabbing ${
              isSelectedContainer ? 'ring-2 ring-amber-300' : ''
            }`}
          >
            {/* Top Puzzle Notch Tab (Interlocking connector) */}
            <div
              className={`absolute -top-2 left-6 w-7 h-2 rounded-t-md ${style.bg} border-t-2 border-x-2 ${style.border} pointer-events-none`}
            />

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Left Circular Icon Medallion (LEGO SPIKE style) */}
              <div className="w-7 h-7 rounded-full bg-black/25 border border-white/30 flex items-center justify-center shrink-0 font-mono text-[10px] font-extrabold text-white shadow-inner">
                {template.tagBadge.replace(/[<>]/g, '').slice(0, 4)}
              </div>

              {/* Interactive Segments (Labels + White Pill Inputs) */}
              {renderBlockSegments(template, block.slotValues, block.instanceId, false)}
            </div>

            {/* Right Action Controls (Reorder Up/Down & Remove) */}
            <div className="flex items-center gap-1 shrink-0 opacity-90 sm:opacity-75 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                title="ขยับขึ้น"
                disabled={idx === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveBlock(block.instanceId, 'up');
                }}
                className="w-6 h-6 rounded-md bg-black/25 hover:bg-black/45 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="ขยับลง"
                disabled={idx === siblingCount - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveBlock(block.instanceId, 'down');
                }}
                className="w-6 h-6 rounded-md bg-black/25 hover:bg-black/45 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="ลบบล็อกนี้"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBlock(block.instanceId);
                }}
                className="w-6 h-6 rounded-md bg-black/30 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* C-BLOCK CAVITY (If this block is a container like <p>, <ul>, <table>, <form>, <main>) */}
          {isCBlock && (
            <div className="flex flex-col">
              {/* Middle Spine + Inner Drop Slot */}
              <div className="flex items-stretch">
                {/* Left Colored C-Block Spine */}
                <div
                  className={`w-5 ${style.spineBg} border-l-2 ${style.border} shrink-0 rounded-bl-sm`}
                />

                {/* Inner Children Container */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveDropTarget(`inside_${block.instanceId}`);
                  }}
                  onDragLeave={() => {
                    if (activeDropTarget === `inside_${block.instanceId}`) {
                      setActiveDropTarget(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropOnTarget('container', block.instanceId);
                  }}
                  className={`flex-1 min-h-[54px] p-2 my-1 rounded-r-xl border-2 border-dashed transition-all space-y-1.5 ${
                    isDropInside
                      ? 'border-amber-400 bg-amber-400/20 shadow-[inset_0_0_15px_rgba(251,191,36,0.35)]'
                      : isSelectedContainer
                      ? 'border-sky-400/60 bg-sky-500/10'
                      : 'border-slate-400/40 dark:border-slate-700 bg-black/10'
                  }`}
                >
                  {block.children.length === 0 ? (
                    <div className="h-full min-h-[38px] flex items-center justify-between px-3 py-1.5 text-[11px] font-thai text-slate-500 dark:text-slate-400">
                      <span>
                        ↳ {template.dropZoneHint || 'ลากบล็อกลูกมาวางในนี้ หรือคลิกบล็อกฝั่งซ้าย'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 text-amber-300">
                        ช่องใส่บล็อกลูก
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {block.children.map((child, cIdx) =>
                        renderWorkspaceBlock(child, cIdx, block.children.length, depth + 1)
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* C-Block Bottom Closing Arm */}
              <div
                className={`px-3 py-1.5 rounded-b-xl rounded-tr-xl border-2 ${style.bg} ${style.border} ${style.shadow} text-white text-xs font-mono font-bold flex items-center justify-between`}
              >
                <span>{template.closingTagLabel || `ปิดบล็อก`}</span>
                <span className="text-[10px] opacity-75 font-thai">
                  ({block.children.length} บล็อกด้านใน)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isRecommendedInStep = (typeId: string) =>
    currentStep?.recommendedBlockIds?.includes(typeId) ?? false;

  return (
    <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-[#0b1120] shadow-xl flex flex-col">
      {/* ====================================================================
          TOP LEGO SPIKE-INSPIRED GAME HEADER BAR
          ==================================================================== */}
      <div className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white flex flex-wrap items-center justify-between gap-2 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                COM QUEST BLOCK BUILDER
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-300 text-slate-950 uppercase">
                LESSON 0{lessonNumber} MINI-GAME
              </span>
            </div>
            <p className="text-[11px] font-thai text-sky-100 hidden sm:block">
              คลิกหรือลากบล็อกคำสั่ง HTML จากฝั่งซ้าย มาต่อเข้าด้วยกันบนกระดาน แล้วกดปุ่ม ▶ Play มุมขวาล่าง
            </p>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoAssembleSolution}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-thai font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>ต่อบล็อกเฉลยให้ดู</span>
          </button>

          <button
            type="button"
            onClick={onShowSolutionModal}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white font-thai font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">คำอธิบายโค้ด</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          3-PANE LEGO SPIKE WORKSPACE (PALETTE | SNAP CANVAS | LESSON & OUTPUT CARD)
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] relative">
        {/* ------------------------------------------------------------------
            1. LEFT PANE: CATEGORY RAIL + BLOCK PALETTE (4 COLS ON LG)
            ------------------------------------------------------------------ */}
        <div className="lg:col-span-4 flex border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
          {/* Vertical Category Rail (Motors / Events style circles) */}
          <div className="w-16 sm:w-20 py-3 px-1.5 bg-slate-100 dark:bg-slate-950/90 border-r border-slate-200 dark:border-slate-800/80 flex flex-col items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`w-full py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/50 text-sky-600 dark:text-sky-300 font-bold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-900'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-sky-500 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
                ★
              </span>
              <span className="text-[10px] font-cyber uppercase tracking-tight">ทั้งหมด</span>
            </button>

            {availableCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-200/90 dark:bg-slate-800/90 border border-slate-400/50 dark:border-slate-600 font-bold shadow-sm'
                      : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-sm border border-black/10"
                    style={{ backgroundColor: cat.colorHex }}
                  />
                  <span className="text-[10px] font-thai text-slate-700 dark:text-slate-300 text-center leading-tight">
                    {cat.thaiLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Block Toolbox List */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[420px] lg:max-h-[620px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cyber font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                คลังบล็อกคำสั่ง (คลิกหรือลาก)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredTemplates.length} บล็อก
              </span>
            </div>

            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const style = CATEGORY_STYLES[template.category];
                const isRecommended = isRecommendedInStep(template.typeId);
                const defaultSlots: Record<string, string> = {};
                for (const s of template.slots) {
                  defaultSlots[s.id] = s.defaultValue;
                }

                return (
                  <div
                    key={template.typeId}
                    draggable
                    onDragStart={() => {
                      setDraggedPayload({ source: 'palette', typeId: template.typeId });
                    }}
                    onDragEnd={() => {
                      setDraggedPayload(null);
                      setActiveDropTarget(null);
                    }}
                    onClick={() => handleAddBlockFromPalette(template.typeId)}
                    className={`group relative rounded-xl p-2.5 border-2 ${style.bg} ${
                      style.border
                    } ${
                      style.shadow
                    } text-white cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all select-none ${
                      isRecommended ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900' : ''
                    }`}
                  >
                    {/* Top puzzle tab visual */}
                    <div
                      className={`absolute -top-1.5 left-5 w-6 h-1.5 rounded-t ${style.bg} border-t border-x ${style.border}`}
                    />

                    {/* Step Recommendation Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${style.badgeBg}`}
                      >
                        {template.tagBadge} • {template.title}
                      </span>

                      {isRecommended ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-950 font-thai font-extrabold text-[10px] flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>แนะนำขั้นตอนนี้</span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-black/25 group-hover:bg-white group-hover:text-slate-900 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Block Preview Content */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-white/70 shrink-0" />
                      {renderBlockSegments(template, defaultSlots, undefined, true)}
                    </div>

                    {template.shape === 'c-block' && (
                      <div className="mt-1.5 pl-3 py-1 rounded bg-black/20 border-l-4 border-white/50 text-[10px] font-thai text-white/90">
                        ↳ บล็อกครอบ (ใส่บล็อกลูกด้านในได้)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            2. CENTER PANE: DOTTED SNAP CANVAS (4 COLS ON LG)
            ------------------------------------------------------------------ */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!activeDropTarget) setActiveDropTarget('root_canvas');
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDropOnTarget('root');
          }}
          className="lg:col-span-4 flex flex-col justify-between relative bg-[#f8fafc] dark:bg-[#080d1a] min-h-[460px] lg:min-h-[620px] overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(rgba(148, 163, 184, 0.35) 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Top Canvas Status Pill (Like LEGO SPIKE's Yellow Connect Badge) */}
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 shadow-sm">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs ${
                  allPassed ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              >
                {allPassed ? '✓' : '⚡'}
              </span>
              <div className="text-left">
                <div className="text-[11px] font-cyber font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {allPassed ? 'พร้อมรันแสดงผล (READY!)' : 'กระดานต่อบล็อก (CANVAS)'}
                </div>
                <div className="text-[10px] font-thai text-slate-500 dark:text-slate-400">
                  ต่อบล็อกแล้ว {totalCanvasBlocks} ชิ้น • ผ่าน {passedCriteriaCount}/{criteriaResults.length} เงื่อนไข
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCodePeek((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showCodePeek
                  ? 'bg-sky-500 text-white border-sky-600 shadow'
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showCodePeek ? 'ซ่อน HTML' : 'ดู HTML'}</span>
            </button>
          </div>

          {/* Main Block Stack Assembly Area */}
          <div className="flex-1 px-4 sm:px-6 py-2 overflow-y-auto space-y-1">
            {/* HAT BLOCK: Always at the top of the program (like "when program starts" in LEGO SPIKE) */}
            <div className="relative select-none max-w-md">
              <div className="w-36 h-4 rounded-t-full bg-amber-500 border-t-2 border-x-2 border-amber-600 ml-3 -mb-1" />
              <div className="px-4 py-3 rounded-2xl bg-amber-500 border-2 border-amber-600 shadow-[0_4px_0_#b45309] text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-white/90 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </span>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-950">
                    เมื่อเปิดหน้าเว็บ HTML (&lt;body&gt;)
                  </div>
                  <div className="text-[10px] font-mono text-amber-950/80">
                    when webpage starts • จุดเริ่มต้นโปรแกรม
                  </div>
                </div>
              </div>
            </div>

            {/* CONNECTED WORKSPACE BLOCKS */}
            <div className="pl-2 sm:pl-3 max-w-xl space-y-1.5 pt-1">
              {blocks.map((block, idx) =>
                renderWorkspaceBlock(block, idx, blocks.length, 0)
              )}

              {/* Bottom Magnetic Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveDropTarget('root_bottom');
                }}
                onDragLeave={() => {
                  if (activeDropTarget === 'root_bottom') setActiveDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDropOnTarget('root');
                }}
                className={`mt-2 p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-thai ${
                  activeDropTarget === 'root_bottom' || activeDropTarget === 'root_canvas'
                    ? 'border-amber-400 bg-amber-400/20 text-amber-700 dark:text-amber-200 font-bold scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Plus className="w-4 h-4 text-sky-500" />
                <span>
                  {blocks.length === 0
                    ? 'คลิกหรือลากบล็อกจากฝั่งซ้ายมาต่อที่นี่!'
                    : 'ลากบล็อกมาต่อท้าย หรือคลิกบล็อกฝั่งซ้ายเพื่อเพิ่ม'}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Live Generated HTML Code Peek Drawer */}
          {showCodePeek && (
            <div className="mx-3 mb-2 p-3 rounded-xl bg-slate-950 border border-sky-500/40 text-cyan-200 font-mono text-xs max-h-36 overflow-y-auto shadow-lg">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-slate-800">
                <span>โค้ด HTML ที่สร้างจากบล็อกของคุณอัตโนมัติ:</span>
                <span className="text-emerald-400">LIVE SYNC</span>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                {compiledHtml || '<!-- ยังไม่มีบล็อกบนกระดาน -->'}
              </pre>
            </div>
          )}

          {/* Bottom Canvas Controls Bar (Undo, Redo, Reset - LEGO SPIKE Bottom Bar Style) */}
          <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="ย้อนกลับ (Undo)"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="ทำซ้ำ (Redo)"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClearCanvas}
                title="ล้างกระดาน"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-400 text-xs font-thai flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เริ่มใหม่</span>
              </button>
            </div>

            <div className="text-[11px] font-thai text-slate-500 dark:text-slate-400 hidden sm:block">
              คลิกช่องสีขาวในบล็อกเพื่อแก้ข้อความได้
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            3. RIGHT PANE: FLOATING LESSON CARD (01/03) + LIVE OUTPUT + PLAY/STOP (4 COLS)
            ------------------------------------------------------------------ */}
        <div className="lg:col-span-4 p-3 sm:p-4 bg-slate-200/70 dark:bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-300 dark:border-slate-800 flex flex-col justify-between gap-4">
          {/* Floating White/Glass Card (Styled after LEGO SPIKE "Lesson 04/07" card) */}
          <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/90 shadow-lg flex flex-col overflow-hidden">
            {/* Card Header Tabs */}
            <div className="p-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setRightTab('lesson')}
                className={`py-1.5 px-2 rounded-xl text-xs font-thai font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'lesson'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ขั้นตอน ({currentStepIdx + 1}/{totalSteps})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('preview')}
                className={`py-1.5 px-2 rounded-xl text-xs font-thai font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'preview'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>ผลลัพธ์เว็บ</span>
                {runSuccess && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRightTab('checklist')}
                className={`py-1.5 px-2 rounded-xl text-xs font-thai font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'checklist'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  เงื่อนไข ({passedCriteriaCount}/{criteriaResults.length})
                </span>
              </button>
            </div>

            {/* TAB 1: LEGO SPIKE-STYLE LESSON STEP CARD (01 / 03) */}
            {rightTab === 'lesson' && currentStep && (
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Giant Number Counter like "04 / 07" in screenshot */}
                  <div className="flex items-baseline justify-between">
                    <div className="font-cyber font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
                      0{currentStep.stepNumber}
                      <span className="text-lg sm:text-xl text-slate-400 font-bold ml-1">
                        / 0{totalSteps}
                      </span>
                    </div>

                    {currentStep.criteriaId && (
                      <div>
                        {criteriaResults.find((c) => c.id === currentStep.criteriaId)?.passed ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-thai font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ผ่านขั้นตอนนี้แล้ว!</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-thai font-bold">
                            กำลังทำขั้นตอนนี้
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-thai font-bold text-slate-900 dark:text-white">
                    {currentStep.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-thai text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentStep.instruction}
                  </p>

                  {/* Recommended Blocks Quick-Add Box inside Step Card */}
                  {currentStep.recommendedBlockIds.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-thai font-bold text-slate-500 dark:text-slate-400">
                        บล็อกที่ใช้ในขั้นตอนนี้ (กดเพื่อวางลงกระดานได้ทันที):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentStep.recommendedBlockIds.map((recId) => {
                          const t = templateMap[recId];
                          if (!t) return null;
                          const st = CATEGORY_STYLES[t.category];
                          return (
                            <button
                              key={recId}
                              type="button"
                              onClick={() => handleAddBlockFromPalette(recId)}
                              className={`px-3 py-1.5 rounded-lg ${st.bg} text-white font-thai font-bold text-xs flex items-center gap-1.5 shadow hover:scale-105 transition-transform cursor-pointer`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.tagBadge}</span>
                              <span className="opacity-90">({t.title})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Live Checklist Summary inside Card */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-thai">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      ความคืบหน้าภารกิจ:
                    </span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {passedCriteriaCount} / {criteriaResults.length} ข้อ
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(passedCriteriaCount / Math.max(criteriaResults.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Step Navigation Arrows (< and > like LEGO SPIKE) */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={currentStepIdx === 0}
                    onClick={() => {
                      setCurrentStepIdx((i) => Math.max(0, i - 1));
                      playBlockTone('step');
                    }}
                    className="w-10 h-10 rounded-full border-2 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-thai text-slate-500">
                    เลื่อนดูขั้นตอนถัดไป
                  </span>

                  <button
                    type="button"
                    disabled={currentStepIdx >= totalSteps - 1}
                    onClick={() => {
                      setCurrentStepIdx((i) => Math.min(totalSteps - 1, i + 1));
                      playBlockTone('step');
                    }}
                    className="w-10 h-10 rounded-full border-2 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE BROWSER OUTPUT PREVIEW */}
            {rightTab === 'preview' && (
              <div className="flex-1 flex flex-col">
                <div className="px-3 py-1.5 bg-slate-800 text-slate-200 text-[11px] font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        runSuccess ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>http://localhost/block-output.html</span>
                  </span>
                  <span>{runSuccess ? '200 OK' : 'WAITING'}</span>
                </div>

                {!hasRun ? (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-slate-900">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-500 flex items-center justify-center">
                      <Play className="w-7 h-7 fill-current ml-0.5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-thai font-bold text-slate-800 dark:text-white">
                        พร้อมรันบล็อกโค้ดของคุณแล้ว!
                      </h4>
                      <p className="text-xs font-thai text-slate-500 dark:text-slate-400">
                        เมื่อต่อบล็อกครบตามต้องการ กดปุ่มกลมสีเขียว <strong>▶ Play</strong> ด้านล่างเพื่อดูหน้าเว็บผลลัพธ์
                      </p>
                    </div>
                  </div>
                ) : !runSuccess ? (
                  <div className="flex-1 p-5 flex flex-col items-center justify-center text-center space-y-3 bg-rose-950/20">
                    <XCircle className="w-10 h-10 text-rose-500" />
                    <h4 className="text-sm font-thai font-bold text-rose-500 dark:text-rose-300">
                      บล็อกยังไม่ครบตามเงื่อนไขภารกิจ
                    </h4>
                    <div className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-950 border border-rose-500/30 space-y-1.5">
                      {criteriaResults
                        .filter((c) => !c.passed)
                        .map((c) => (
                          <div
                            key={c.id}
                            className="text-xs font-thai text-slate-700 dark:text-slate-300 flex items-start gap-1.5"
                          >
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{c.label}</span>
                          </div>
                        ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoAssembleSolution}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-thai font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>ช่วยต่อบล็อกที่ถูกต้องให้ฉัน</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-white min-h-[290px]">
                    <iframe
                      srcDoc={previewHtml}
                      title="Block HTML Live Preview"
                      sandbox="allow-scripts"
                      className="w-full h-full min-h-[290px] border-0 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FULL CHECKLIST */}
            {rightTab === 'checklist' && (
              <div className="flex-1 p-4 space-y-2.5 overflow-y-auto">
                <div className="text-xs font-thai font-bold text-slate-500 dark:text-slate-400">
                  เงื่อนไขการผ่านภารกิจทั้งหมด:
                </div>
                {criteriaResults.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      c.passed
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-200'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-thai font-bold">{c.label}</div>
                      <div className="text-[11px] font-thai opacity-80">{c.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================
              BOTTOM-RIGHT BIG CIRCULAR STOP & PLAY BUTTONS (LEGO SPIKE STYLE)
              ================================================================ */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs font-thai">
              {runSuccess && allPassed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>รันสำเร็จ! ปลดล็อกควิซแล้ว</span>
                </span>
              ) : allPassed ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                  บล็อกครบแล้ว! กดปุ่ม ▶ สีเขียวเลย
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  ต่อบล็อกแล้วกดปุ่ม ▶ เพื่อรัน
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Circular STOP Button */}
              <button
                type="button"
                onClick={onStopCode}
                title="หยุดการแสดงผล (Stop)"
                className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>

              {/* Giant Circular PLAY Button */}
              <button
                type="button"
                onClick={handlePlayClick}
                title="รันบล็อกโค้ด (Run Program)"
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  allPassed
                    ? 'bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.7)] ring-4 ring-emerald-400/30'
                    : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                }`}
              >
                <Play className="w-7 h-7 fill-current ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

