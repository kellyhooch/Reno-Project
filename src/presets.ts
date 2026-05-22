/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetPlan } from './types';

export const PRESET_PLANS: PresetPlan[] = [
  {
    id: 'hdb-3-room',
    name: '3-Room HDB Flat',
    type: 'hdb_3',
    sqm: 65,
    layout2D: {
      width: 800,
      height: 500,
      walls: [
        // Exterior Boundary Walls
        { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
        { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
        { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
        { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
        
        // Interior Walls separating rooms
        { x1: 400, y1: 50, x2: 400, y2: 450, type: 'interior' }, // Main vertical partition
        { x1: 50, y1: 250, x2: 400, y2: 250, type: 'interior' },  // Living/Kitchen horizontal partition
        { x1: 400, y1: 220, x2: 750, y2: 220, type: 'interior' }, // Master/Bedroom 2 horizontal partition
        { x1: 250, y1: 250, x2: 250, y2: 450, type: 'interior' }, // Kitchen/household shelter partition
        { x1: 550, y1: 220, x2: 550, y2: 450, type: 'interior' }, // Toilets partition
      ],
      furniture: [
        // Living Room Furniture
        { id: 'l1', type: 'sofa', x: 120, y: 120, w: 140, h: 55, rotation: 0, label: '3-Seater Sofa' },
        { id: 'l2', type: 'tv_console', x: 350, y: 120, w: 20, h: 100, rotation: 0, label: 'TV Feature Wall' },
        { id: 'l3', type: 'plant', x: 70, y: 80, w: 30, h: 30, rotation: 0, label: 'Fiddle Leaf Fig' },

        // Kitchen/Dining Furniture
        { id: 'k1', type: 'kitchen_counter', x: 100, y: 380, w: 130, h: 50, rotation: 0, label: 'Kitchen Counter & Hob' },
        { id: 'k2', type: 'sink', x: 160, y: 380, w: 40, h: 35, rotation: 0, label: 'Sink' },
        { id: 'd1', type: 'dining', x: 320, y: 330, w: 80, h: 60, rotation: 0, label: 'Dining Table' },

        // Master Bedroom
        { id: 'm1', type: 'bed', x: 620, y: 110, w: 140, h: 120, rotation: 90, label: 'Queen Bed' },
        { id: 'm2', type: 'wardrobe', x: 480, y: 130, w: 40, h: 90, rotation: 0, label: 'Built-in Closet' },

        // Common Bedroom (Bedroom 2)
        { id: 'b1', type: 'bed', x: 680, y: 300, w: 100, h: 120, rotation: 90, label: 'Single Bed' },
        { id: 'b2', type: 'desk', x: 450, y: 300, w: 80, h: 45, rotation: 90, label: 'Study Table' },
      ],
      roomLabels: [
        { text: 'LIVING ROOM', x: 200, y: 150 },
        { text: 'DINING AREA', x: 320, y: 280 },
        { text: 'KITCHEN', x: 140, y: 330 },
        { text: 'MASTER BEDROOM', x: 580, y: 150 },
        { text: 'BEDROOM 2', x: 580, y: 350 },
        { text: 'BATHROOM', x: 480, y: 400 },
      ]
    }
  },
  {
    id: 'hdb-4-room',
    name: '4-Room HDB Flat',
    type: 'hdb_4',
    sqm: 90,
    layout2D: {
      width: 800,
      height: 500,
      walls: [
        // Exterior Boundary
        { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
        { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
        { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
        { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
        
        // Room partitions
        { x1: 300, y1: 50, x2: 300, y2: 450, type: 'interior' }, // Living divide from Bed 2 & 3
        { x1: 50, y1: 220, x2: 300, y2: 220, type: 'interior' },  // Living vs Kitchen
        { x1: 300, y1: 180, x2: 750, y2: 180, type: 'interior' }, // Bedrooms split from corridor
        { x1: 520, y1: 180, x2: 520, y2: 450, type: 'interior' }, // Bed 2 vs Master Bed
        { x1: 520, y1: 320, x2: 750, y2: 320, type: 'interior' }, // Master Toilet boundaries
        { x1: 180, y1: 220, x2: 180, y2: 450, type: 'interior' }, // Service Yard box
      ],
      furniture: [
        // Living
        { id: 'l1', type: 'sofa', x: 100, y: 110, w: 160, h: 60, rotation: 0, label: 'L-Shape Lounge' },
        { id: 'l2', type: 'tv_console', x: 260, y: 110, w: 20, h: 100, rotation: 0, label: 'Wall Mount TV' },
        
        // Dining
        { id: 'd1', type: 'dining', x: 180, y: 160, w: 90, h: 50, rotation: 90, label: 'Dining Set' },

        // Kitchen
        { id: 'k1', type: 'kitchen_counter', x: 100, y: 350, w: 180, h: 50, rotation: 0, label: 'Prep Counter with Ovens' },
        { id: 'k2', type: 'sink', x: 200, y: 350, w: 45, h: 35, rotation: 0, label: 'Double Sink' },

        // Master Bed
        { id: 'm1', type: 'bed', x: 620, y: 240, w: 150, h: 140, rotation: 90, label: 'King Size Bed' },
        { id: 'm2', type: 'wardrobe', x: 700, y: 100, w: 35, h: 150, rotation: 90, label: 'Walk-in Fit Closet' },

        // Bed 2
        { id: 'b2_1', type: 'bed', x: 410, y: 240, w: 140, h: 100, rotation: 180, label: 'Queen Bed' },
        { id: 'b2_2', type: 'desk', x: 340, y: 380, w: 90, h: 45, rotation: 0, label: 'Corner Workdesk' },

        // Bed 3/Study
        { id: 'b3_1', type: 'bed', x: 410, y: 100, w: 140, h: 100, rotation: 0, label: 'Single Daybed' },
        { id: 'b3_2', type: 'desk', x: 320, y: 140, w: 70, h: 45, rotation: 90, label: 'Study Nook Desk' }
      ],
      roomLabels: [
        { text: 'LIVING ROOM', x: 130, y: 80 },
        { text: 'DINING AREA', x: 240, y: 180 },
        { text: 'KITCHEN / DRY ZONE', x: 130, y: 280 },
        { text: 'MASTER SUITE', x: 640, y: 280 },
        { text: 'BEDROOM 2', x: 410, y: 330 },
        { text: 'BEDROOM 3', x: 410, y: 110 },
        { text: 'MASTER SHOWER', x: 620, y: 400 },
        { text: 'COMMON TOILET', x: 240, y: 410 },
      ]
    }
  },
  {
    id: 'hdb-5-room',
    name: '5-Room HDB Flat',
    type: 'hdb_5',
    sqm: 110,
    layout2D: {
      width: 800,
      height: 500,
      walls: [
        // Exterior Boundary
        { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
        { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
        { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
        { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
        
        // Partition columns
        { x1: 340, y1: 50, x2: 340, y2: 450, type: 'interior' }, // Living dividing wall
        { x1: 50, y1: 200, x2: 340, y2: 200, type: 'interior' },  // Living vs kitchen/service
        { x1: 340, y1: 240, x2: 750, y2: 240, type: 'interior' }, // Room main partition row
        { x1: 540, y1: 240, x2: 540, y2: 450, type: 'interior' }, // Bed 2 vs Master Bed
        { x1: 540, y1: 120, x2: 750, y2: 120, type: 'interior' }, // Bed 3 dividers
        { x1: 200, y1: 200, x2: 200, y2: 450, type: 'interior' }, // Toilet/Yard layout
      ],
      furniture: [
        // Living & Large Dining
        { id: 'l1', type: 'sofa', x: 120, y: 110, w: 180, h: 65, rotation: 0, label: 'Large Sectional' },
        { id: 'l2', type: 'tv_console', x: 300, y: 115, w: 20, h: 110, rotation: 0, label: 'Custom TV Media Hub' },
        { id: 'd1', type: 'dining', x: 230, y: 160, w: 100, h: 70, rotation: 90, label: '6-Seater Family Dining' },

        // Kitchen & Island counter
        { id: 'k1', type: 'kitchen_counter', x: 90, y: 320, w: 200, h: 50, rotation: 0, label: 'Linear Kitchen Run' },
        { id: 'ki', type: 'kitchen_counter', x: 180, y: 260, w: 80, h: 40, rotation: 0, label: 'Premium Kitchen Island' },

        // Bedrooms
        { id: 'm1', type: 'bed', x: 630, y: 340, w: 170, h: 150, rotation: 90, label: 'King Deluxe Bed' },
        { id: 'm2', type: 'wardrobe', x: 680, y: 200, w: 40, h: 100, rotation: 0, label: 'Slide Wardrobe' },
        { id: 'b2_1', type: 'bed', x: 440, y: 350, w: 140, h: 120, rotation: 180, label: 'Double Bed' },
        { id: 'b3_1', type: 'bed', x: 440, y: 130, w: 140, h: 100, rotation: 0, label: 'Study Room Daybed' }
      ],
      roomLabels: [
        { text: 'GRAND LIVING ROOM', x: 140, y: 70 },
        { text: 'DINING AREA', x: 240, y: 140 },
        { text: 'KITCHEN & Island', x: 110, y: 240 },
        { text: 'MASTER SUITE', x: 640, y: 380 },
        { text: 'BEDROOM 2 (CHILDS)', x: 440, y: 390 },
        { text: 'BEDROOM 3 (WORKSTUDY)', x: 440, y: 100 },
        { text: 'UTILITY YARD', x: 120, y: 410 },
      ]
    }
  }
];
