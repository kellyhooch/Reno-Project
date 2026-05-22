/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wall, Furniture, RoomLabel, RenderLayout } from '../types';

interface FloorPlanCanvasProps {
  layout: RenderLayout;
  onSelectFurniture?: (furniture: Furniture) => void;
  highlightedWalls?: Array<{ x1: number; y1: number; x2: number; y2: number; type: string }>;
  hoveredFurnitureId?: string | null;
  setHoveredFurnitureId?: (id: string | null) => void;
  currentTier?: 'free' | 'standard' | 'premium';
}

export default function FloorPlanCanvas({
  layout,
  onSelectFurniture,
  highlightedWalls,
  hoveredFurnitureId,
  setHoveredFurnitureId,
  currentTier = 'standard'
}: FloorPlanCanvasProps) {
  const { width = 800, height = 500, walls = [], furniture = [], roomLabels = [] } = layout;

  // Render a specific furniture piece inside SVG
  const renderFurnitureItem = (f: Furniture) => {
    const isHovered = hoveredFurnitureId === f.id;
    const color = isHovered 
      ? 'fill-amber-100 stroke-amber-600' 
      : 'fill-blue-50/70 stroke-blue-800';

    return (
      <g
        key={f.id}
        transform={`translate(${f.x}, ${f.y}) rotate(${f.rotation || 0})`}
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => setHoveredFurnitureId?.(f.id)}
        onMouseLeave={() => setHoveredFurnitureId?.(null)}
        onClick={() => onSelectFurniture?.(f)}
      >
        {/* Draw specific SVG shapes depending on type */}
        {f.type === 'bed' && (
          <g>
            {/* Frame */}
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={4} className={`${color} stroke-[1.5]`} />
            {/* Pillows */}
            <rect x={-f.w / 2 + 10} y={-f.h / 2 + 10} width={25} height={f.h - 20} rx={2} className="fill-white stroke-blue-800 stroke-[1]" />
            {/* Blanket sheet fold */}
            <path d={`M ${-f.w / 2 + 45} ${-f.h / 2} L ${-f.w / 2 + 45} ${f.h / 2}`} className="stroke-blue-800 stroke-[1] stroke-dasharray-[2]" />
          </g>
        )}

        {f.type === 'sofa' && (
          <g>
            {/* Main body */}
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={6} className={`${color} stroke-[1.5]`} />
            {/* Backrest cushioning */}
            <rect x={-f.w / 2} y={f.h / 2 - 12} width={f.w} height={12} rx={2} className="fill-blue-100/50 stroke-blue-800 stroke-[1]" />
            {/* Armrests */}
            <rect x={-f.w / 2} y={-f.h / 2} width={10} height={f.h} rx={2} className="fill-blue-100/50 stroke-blue-800 stroke-[1]" />
            <rect x={f.w / 2 - 10} y={-f.h / 2} width={10} height={f.h} rx={2} className="fill-blue-100/50 stroke-blue-800 stroke-[1]" />
          </g>
        )}

        {f.type === 'tv_console' && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            {/* TV Screen representation line */}
            <line x1={-f.w / 2 + 15} y1={0} x2={f.w / 2 - 15} y2={0} className="stroke-slate-800 stroke-[3]" />
          </g>
        )}

        {f.type === 'dining' && (
          <g>
            {/* Dining Table */}
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            {/* Chairs */}
            <circle cx={-f.w / 2 - 8} cy={-15} r={8} className="fill-blue-100 stroke-blue-800" />
            <circle cx={-f.w / 2 - 8} cy={15} r={8} className="fill-blue-100 stroke-blue-800" />
            <circle cx={f.w / 2 + 8} cy={-15} r={8} className="fill-blue-100 stroke-blue-800" />
            <circle cx={f.w / 2 + 8} cy={15} r={8} className="fill-blue-100 stroke-blue-800" />
          </g>
        )}

        {f.type === 'kitchen_counter' && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            {/* Overlays representing sink/counter details */}
            <rect x={-f.w / 2 + 15} y={-10} width={25} height={20} rx={1} className="fill-none stroke-blue-800 stroke-[1]" />
            <circle cx={f.w / 2 - 25} cy={-5} r={6} className="fill-none stroke-blue-800 stroke-[1]" />
            <circle cx={f.w / 2 - 25} cy={10} r={6} className="fill-none stroke-blue-800 stroke-[1]" />
          </g>
        )}

        {f.type === 'wardrobe' && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            <line x1={-f.w / 2} y1={-f.h / 2} x2={f.w / 2} y2={f.h / 2} className="stroke-blue-800 stroke-[0.5]" />
            <line x1={-f.w / 2} y1={f.h / 2} x2={f.w / 2} y2={-f.h / 2} className="stroke-blue-800 stroke-[0.5]" />
          </g>
        )}

        {f.type === 'desk' && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            {/* Laptop outline */}
            <rect x={-15} y={-8} width={30} height={16} rx={1} className="fill-white stroke-blue-800 stroke-[1]" />
            <line x1={-15} y1={0} x2={15} y2={0} className="stroke-blue-800 stroke-[1]" />
          </g>
        )}

        {f.type === 'plant' && (
          <g>
            {/* Pot */}
            <circle cx={0} cy={0} r={12} className={`${color} stroke-[1.5]`} />
            {/* Foliage */}
            <path d="M 0 -10 C -5 -25 5 -25 0 -10 Z" className="fill-blue-600 stroke-blue-900 stroke-[0.5]" />
            <path d="M -8 2 C -20 12 -25 0 -8 2 Z" className="fill-blue-600 stroke-blue-900 stroke-[0.5]" />
            <path d="M 8 2 C 20 12 25 0 8 2 Z" className="fill-blue-600 stroke-blue-900 stroke-[0.5]" />
          </g>
        )}

        {f.type === 'sink' && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={4} className={`${color} stroke-[1.5]`} />
            <rect x={-f.w / 2 + 5} y={-f.h / 2 + 5} width={f.w - 10} height={f.h - 10} rx={2} className="fill-blue-50/50 stroke-blue-800 stroke-[1]" />
            <circle cx={0} cy={-f.h / 2 + 5} r={2} className="fill-slate-800" />
          </g>
        )}

        {/* Fallback box */}
        {!['bed', 'sofa', 'tv_console', 'dining', 'kitchen_counter', 'wardrobe', 'desk', 'plant', 'sink'].includes(f.type) && (
          <g>
            <rect x={-f.w / 2} y={-f.h / 2} width={f.w} height={f.h} rx={2} className={`${color} stroke-[1.5]`} />
            <text x={0} y={4} textAnchor="middle" className="font-mono text-[9px] fill-blue-950 font-medium">
              {f.label.slice(0, 3)}
            </text>
          </g>
        )}

        {/* Floating tooltip on hover */}
        {isHovered && (
          <g transform={`translate(0, ${-f.h / 2 - 15})`} className="pointer-events-none">
            {/* Dialog shape background */}
            <rect x={-60} y={-10} width={120} height={18} rx={4} className="fill-slate-900 border border-slate-750" />
            <text x={0} y={2} textAnchor="middle" className="fill-white font-sans text-[10px] font-medium tracking-tight">
              {f.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full aspect-[8/5] bg-amber-50/20 border border-orange-100 rounded-2xl overflow-hidden p-2">
      <svg
        id="floorplan-svg"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full text-slate-800"
      >
        <defs>
          {/* Subtle architectural grid pattern */}
          <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-stone-200/50 stroke-[0.5]" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#arch-grid)" rx={12} className="fill-stone-50/80" />

        {/* Hacking / Renovation Plan Background Colorations if any */}
        {/* Draw Highlighted or Hacked Wall zones */}
        {highlightedWalls && highlightedWalls.length > 0 && highlightedWalls.map((wall, index) => (
          <g key={`highlight-${index}`}>
            <line
              x1={wall.x1}
              y1={wall.y1}
              x2={wall.x2}
              y2={wall.y2}
              className={`stroke-[10] stroke-linecap-round opacity-20 ${
                wall.type === 'demolished' ? 'stroke-red-500' : 'stroke-cyan-500'
              }`}
            />
          </g>
        ))}

        {/* Render base structural layout walls */}
        {walls.map((wall, index) => {
          let strokeClass = 'stroke-stone-700 stroke-[5]'; // structural load bearing

          if (wall.type === 'interior') {
            strokeClass = 'stroke-stone-400 stroke-[4]'; // drywall or standard partition
          } else if (wall.type === 'demolished') {
            strokeClass = 'stroke-rose-500 stroke-[3] stroke-dasharray-[6,4]'; // wall to remove
          } else if (wall.type === 'new') {
            strokeClass = 'stroke-cyan-500 stroke-[4.5]'; // newly built drywall
          }

          return (
            <g key={`wall-${index}`}>
              <line
                x1={wall.x1}
                y1={wall.y1}
                x2={wall.x2}
                y2={wall.y2}
                className={`${strokeClass} stroke-linecap-round`}
              />
              
              {/* If it is a demolished wall, render a little scissors symbol indicating hacking */}
              {wall.type === 'demolished' && (
                <text
                  x={(wall.x1 + wall.x2) / 2}
                  y={(wall.y1 + wall.y2) / 2 - 6}
                  textAnchor="middle"
                  className="fill-rose-600 text-[10px] font-bold select-none cursor-default"
                >
                  ✂ HACKING WALL
                </text>
              )}

              {/* If it is a new drywall partition */}
              {wall.type === 'new' && (
                <text
                  x={(wall.x1 + wall.x2) / 2}
                  y={(wall.y1 + wall.y2) / 2 - 6}
                  textAnchor="middle"
                  className="fill-cyan-700 text-[9px] tracking-wider font-semibold select-none cursor-default"
                >
                  ★ NEW DRYWALL
                </text>
              )}
            </g>
          );
        })}

        {/* Render all furniture layout designs */}
        {(currentTier === 'free' 
          ? furniture.filter((f) => ['bed', 'sofa', 'dining'].includes(f.type)) // Only show structural main elements as a "Sample"
          : furniture
        ).map((f) => renderFurnitureItem(f))}

        {/* Floating sample watermark banner if user is on free tier */}
        {currentTier === 'free' && (
          <g transform={`translate(${width / 2}, ${height / 2})`} className="pointer-events-none select-none">
            <rect
              x={-240}
              y={-30}
              width={480}
              height={60}
              rx={12}
              className="fill-rose-900/90 stroke-rose-600 stroke-[1.5] backdrop-blur-md"
            />
            <text x={0} y={-4} textAnchor="middle" className="fill-white font-sans text-xs font-bold uppercase tracking-widest leading-none">
              🔒 Simplified Sample Blueprint
            </text>
            <text x={0} y={15} textAnchor="middle" className="fill-rose-200 font-sans text-[10px] tracking-tight leading-none">
              Upgrade to Standard/Premium to unlock all custom structural layout elements!
            </text>
          </g>
        )}

        {/* Render Clean Room Labels */}
        {roomLabels.map((lbl, idx) => (
          <g key={`lbl-${idx}`} className="select-none pointer-events-none">
            <rect
              x={lbl.x - 65}
              y={lbl.y - 12}
              width={130}
              height={22}
              rx={4}
              className="fill-stone-100/90 stroke-stone-300 stroke-[0.5]"
            />
            <text
              x={lbl.x}
              y={lbl.y + 3}
              textAnchor="middle"
              className="fill-stone-600 font-sans text-[9px] font-semibold tracking-widest"
            >
              {lbl.text}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend overlays */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] space-y-1 shadow-sm border border-stone-100 font-sans text-stone-600">
        <div className="font-semibold text-stone-800 border-b border-stone-100 pb-0.5 mb-1">Floor Plan Legend</div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-stone-700 rounded-sm"></span> Structural Concrete
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-stone-400 rounded-sm"></span> Demountable drywall
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-red-500 border-t border-dashed border-white rounded-sm"></span> Hacking permitted wall
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-cyan-500 rounded-sm"></span> Proposed new design partition
        </div>
      </div>
    </div>
  );
}
