/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RenderLayout, Furniture } from '../types';

interface IsometricRendererProps {
  layout: RenderLayout;
  hoveredFurnitureId?: string | null;
  setHoveredFurnitureId?: (id: string | null) => void;
  styleMode?: 'Open' | 'MaxStorage';
}

export default function IsometricRenderer({
  layout,
  hoveredFurnitureId,
  setHoveredFurnitureId,
  styleMode = 'Open'
}: IsometricRendererProps) {
  const { width = 800, height = 500, walls = [], furniture = [] } = layout;

  // Isometric Projection Parameters
  const scale = 0.65; // overall coordinate scaling to fit view box
  const cX = 400;     // Center X of canvas
  const cY = 160;     // Center Y of canvas

  // Isometric Projection Function
  // Math: 
  // isoX = cX + (x - y) * cos(30) * scale
  // isoY = cY + (x + y) * sin(30) * scale - z * scale
  const project = (x: number, y: number, z = 0) => {
    // Translate relative to center of standard floor plans
    const relativeX = x - 400;
    const relativeY = y - 250;
    
    const isoX = cX + (relativeX - relativeY) * 0.866 * scale;
    const isoY = cY + (relativeX + relativeY) * 0.5 * scale - z * scale;
    return { x: isoX, y: isoY };
  };

  // Render an isometric cuboid box representing furniture or walls
  const renderBox = (
    key: string,
    x: number,    // Center X
    y: number,    // Center Y
    z: number,    // Floor height Z
    w: number,    // Width along X-axis
    l: number,    // Length along Y-axis
    h: number,    // Extrusion height
    colors: { top: string; left: string; right: string; stroke: string },
    label?: string,
    isHovered = false
  ) => {
    // Get bottom vertex coordinates
    // Vertices at base of the cuboid on ground plane (z)
    const p1 = project(x - w / 2, y - l / 2, z); // Back point
    const p2 = project(x + w / 2, y - l / 2, z); // Right point
    const p3 = project(x + w / 2, y + l / 2, z); // Front point
    const p4 = project(x - w / 2, y + l / 2, z); // Left point

    // Vertices at the top of the cuboid (z + h)
    const t1 = project(x - w / 2, y - l / 2, z + h);
    const t2 = project(x + w / 2, y - l / 2, z + h);
    const t3 = project(x + w / 2, y + l / 2, z + h);
    const t4 = project(x - w / 2, y + l / 2, z + h);

    // Left wall polygon is formed by p4, p3, t3, t4
    const leftFacePoints = `${p4.x},${p4.y} ${p3.x},${p3.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`;
    // Right wall polygon is formed by p3, p2, t2, t3
    const rightFacePoints = `${p3.x},${p3.y} ${p2.x},${p2.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`;
    // Top face is formed by t1, t2, t3, t4
    const topFacePoints = `${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`;

    const hoverScale = isHovered ? 'scale-105 pointer-events-none' : '';

    return (
      <g 
        key={key} 
        className={`transition-all duration-300 transform origin-center ${hoverScale}`}
        onMouseEnter={() => setHoveredFurnitureId?.(key)}
        onMouseLeave={() => setHoveredFurnitureId?.(null)}
      >
        {/* Left Side Face */}
        <polygon
          points={leftFacePoints}
          className={`${colors.left} transition-colors duration-200`}
          stroke={colors.stroke}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {/* Right Side Face */}
        <polygon
          points={rightFacePoints}
          className={`${colors.right} transition-colors duration-200`}
          stroke={colors.stroke}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {/* Top Face */}
        <polygon
          points={topFacePoints}
          className={`${colors.top} transition-colors duration-200`}
          stroke={colors.stroke}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />

        {/* Small readable labels floating over major items in 3D */}
        {label && h > 20 && !key.startsWith('wall-') && (
          <text
            x={t3.x}
            y={t3.y - 8}
            textAnchor="middle"
            className="fill-slate-700 font-sans text-[9px] font-semibold bg-white px-1 select-none pointer-events-none"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  // Theme colors for furniture based on Option view style
  const getFurnitureColors = (type: string, isHovered: boolean) => {
    // Elegant warm peachy colors & timber vibes
    if (isHovered) {
      return {
        top: 'fill-amber-300',
        left: 'fill-amber-400',
        right: 'fill-amber-500',
        stroke: 'stroke-amber-800'
      };
    }

    switch (type) {
      case 'bed':
        return {
          top: 'fill-stone-100',
          left: 'fill-orange-200', // peachy
          right: 'fill-orange-300',
          stroke: 'stroke-orange-850/60'
        };
      case 'sofa':
        return {
          top: 'fill-teal-100',
          left: 'fill-teal-600', // beautiful calm teal
          right: 'fill-teal-700',
          stroke: 'stroke-teal-900/40'
        };
      case 'dining':
        return {
          top: 'fill-amber-100',
          left: 'fill-amber-650', // wood tones
          right: 'fill-amber-700',
          stroke: 'stroke-amber-900/50'
        };
      case 'plant':
        return {
          top: 'fill-emerald-400',
          left: 'fill-emerald-700',
          right: 'fill-emerald-800',
          stroke: 'stroke-emerald-950/30'
        };
      case 'tv_console':
      case 'desk':
        return {
          top: 'fill-slate-100',
          left: 'fill-slate-500',
          right: 'fill-slate-650',
          stroke: 'stroke-slate-900/30'
        };
      case 'wardrobe':
        return {
          top: 'fill-orange-50',
          left: 'fill-orange-100',
          right: 'fill-orange-200',
          stroke: 'stroke-orange-800/40'
        };
      default:
        return {
          top: 'fill-amber-50',
          left: 'fill-amber-200',
          right: 'fill-amber-300',
          stroke: 'stroke-amber-800/40'
        };
    }
  };

  // Draw 3D floor boundary
  const renderFloor = () => {
    const corners = [
      project(50, 50, 0),
      project(750, 50, 0),
      project(750, 450, 0),
      project(50, 450, 0)
    ];
    return (
      <polygon
        points={corners.map(c => `${c.x},${c.y}`).join(' ')}
        className="fill-stone-100/90 stroke-stone-300 stroke-[1.5]"
      />
    );
  };

  // Filter and prioritize partition walls
  const wallHeight = 70; // wall height coordinate
  const boundaryColor = {
    top: 'fill-stone-350',
    left: 'fill-stone-300',
    right: 'fill-stone-400',
    stroke: 'stroke-stone-500'
  };

  const newWallColor = {
    top: 'fill-cyan-100',
    left: 'fill-cyan-500',
    right: 'fill-cyan-600',
    stroke: 'stroke-cyan-800'
  };

  const demoWallColor = {
    top: 'fill-red-100/40',
    left: 'fill-red-400/20',
    right: 'fill-red-500/20',
    stroke: 'stroke-red-550/40'
  };

  return (
    <div className="relative w-full aspect-[8/5] bg-radial from-amber-50/40 to-stone-100 border border-orange-100 rounded-2xl overflow-hidden p-2">
      
      {/* Visual orientation info top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/85 px-2 py-1 rounded-md text-[9px] font-mono font-medium text-stone-500 shadow-sm border border-stone-100">
        <span>🎥 ISOMETRIC 3D SIMULATOR [30° VIEW]</span>
      </div>

      <svg
        id="isometric-svg"
        viewBox="0 0 800 500"
        className="w-full h-full text-slate-800"
      >
        <g id="isometric-group">
          
          {/* Floor boundary polygon */}
          {renderFloor()}

          {/* Render Demolished / Hacked walls first as flat guides, or semi-transparent ghost structures */}
          {styleMode === 'Open' && walls
            .filter(w => w.type === 'demolished')
            .map((wall, idx) => {
              const xCenter = (wall.x1 + wall.x2) / 2;
              const yCenter = (wall.y1 + wall.y2) / 2;
              const isVert = Math.abs(wall.x1 - wall.x2) < 5;
              const wallW = isVert ? 6 : Math.abs(wall.x1 - wall.x2);
              const wallL = isVert ? Math.abs(wall.y1 - wall.y2) : 6;
              // semi-permeable red boundary to show what is hacked away!
              return renderBox(
                `wall-demo-${idx}`,
                xCenter,
                yCenter,
                0,
                wallW,
                wallL,
                wallHeight,
                demoWallColor,
                "DEMOLISHED ZONE"
              );
            })}

          {/* Render actual Solid Concrete Structural walls next */}
          {walls
            .filter(w => w.type === 'exterior')
            .map((wall, idx) => {
              const xCenter = (wall.x1 + wall.x2) / 2;
              const yCenter = (wall.y1 + wall.y2) / 2;
              const isVert = Math.abs(wall.x1 - wall.x2) < 5;
              const wallW = isVert ? 8 : Math.abs(wall.x1 - wall.x2);
              const wallL = isVert ? Math.abs(wall.y1 - wall.y2) : 8;
              return renderBox(
                `wall-ext-${idx}`,
                xCenter,
                yCenter,
                0,
                wallW,
                wallL,
                wallHeight,
                boundaryColor
              );
            })}

          {/* Render Interior standard boundaries that remain */}
          {walls
            .filter(w => w.type === 'interior')
            .map((wall, idx) => {
              const xCenter = (wall.x1 + wall.x2) / 2;
              const yCenter = (wall.y1 + wall.y2) / 2;
              const isVert = Math.abs(wall.x1 - wall.x2) < 5;
              const wallW = isVert ? 6 : Math.abs(wall.x1 - wall.x2);
              const wallL = isVert ? Math.abs(wall.y1 - wall.y2) : 6;
              return renderBox(
                `wall-int-${idx}`,
                xCenter,
                yCenter,
                0,
                wallW,
                wallL,
                wallHeight - 15, // slightly lower partition height
                {
                  top: 'fill-stone-250',
                  left: 'fill-stone-200',
                  right: 'fill-stone-300',
                  stroke: 'stroke-stone-400'
                }
              );
            })}

          {/* Render Proposals / New Partition drywalls if style is MaxStorage */}
          {styleMode === 'MaxStorage' && walls
            .filter(w => w.type === 'new')
            .map((wall, idx) => {
              const xCenter = (wall.x1 + wall.x2) / 2;
              const yCenter = (wall.y1 + wall.y2) / 2;
              const isVert = Math.abs(wall.x1 - wall.x2) < 5;
              const wallW = isVert ? 6 : Math.abs(wall.x1 - wall.x2);
              const wallL = isVert ? Math.abs(wall.y1 - wall.y2) : 6;
              return renderBox(
                `wall-new-${idx}`,
                xCenter,
                yCenter,
                0,
                wallW,
                wallL,
                wallHeight,
                newWallColor,
                "Proposed Drywall"
              );
            })}

          {/* Render the actual Furniture blocks projected into 3D isometric cuboids! */}
          {furniture.map((f) => {
            const isHovered = hoveredFurnitureId === f.id;
            const colors = getFurnitureColors(f.type, isHovered);

            // Furniture block standard projection measurements based on type
            let blockHeight = 25;
            if (f.type === 'wardrobe') blockHeight = 65;
            if (f.type === 'tv_console') blockHeight = 35;
            if (f.type === 'plant') blockHeight = 40;
            if (f.type === 'bed') blockHeight = 18;

            return renderBox(
              f.id,
              f.x,
              f.y,
              0, // ground floor
              f.w,
              f.h,
              blockHeight,
              colors,
              f.label,
              isHovered
            );
          })}

        </g>
      </svg>

      {/* 3D specific legend */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] space-y-1 shadow-sm border border-stone-100 font-sans text-stone-600">
        <div className="font-semibold text-stone-800">Isometric Visual Codes</div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3 bg-stone-300 border border-stone-400 rounded-sm"></span> External Boundary Concrete
        </div>
        {styleMode === 'Open' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 bg-rose-200 border border-rose-400 rounded-sm"></span> Demolished walls (Spacious layout)
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 bg-cyan-200 border border-cyan-400 rounded-sm"></span> Proposed new partitions (Storage layout)
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-3.5 h-3 bg-teal-500 rounded-sm"></span> Sofa &nbsp;
          <span className="w-3.5 h-3 bg-orange-100 rounded-sm"></span> Beds &nbsp;
          <span className="w-3.5 h-3 bg-amber-500 rounded-sm"></span> Timber tables
        </div>
      </div>
    </div>
  );
}
