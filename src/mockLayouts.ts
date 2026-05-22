/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutOption } from './types';

export const getOptionsForPreset = (presetId: string): { optionA: LayoutOption; optionB: LayoutOption } => {
  if (presetId === 'hdb-3-room') {
    return {
      optionA: {
        id: 'option-a',
        name: 'Option A — Open Flow',
        tagline: 'Modern Loft Sanctuary',
        description: 'Optimizes social connection and breeze flow. We demolish the horizontal masonry wall between the kitchen and living area, introducing an elegant, wide-open dual-zone quartz island for integrated cooking and dining. By aligning the master entrance, air moves continuously from the south window run, creating a cooling draft perfect for hot tropical afternoons.',
        budgetEstimate: 38500,
        budgetStatus: 'met',
        budgetFeedback: 'Comfortably within standard 3-Room limits. Savings achieved by choosing loose designer furniture sets over heavy fixed woodworking, and keeping the bathroom wet-zone plumbing intact.',
        legalStatus: 'met',
        legalFeedback: 'HDB Hacking Approval required for kitchen-living boundary wall. Fully complies with HDB structural rules: no columns touched, dry-zone boundary retained.',
        climateStatus: 'met',
        climateFeedback: 'Significantly enhanced cross-ventilation. Moisture-controlled vinyl flooring recommended for the open kitchen run to handle high-humidity cooking vapor.',
        fengshuiStatus: 'met',
        fengshuiFeedback: 'Main door does not immediately face any bedroom entrance. Favorable energy flow. Recommended to place a leafy plant at the living room transition.',
        highlights: [
          'Hacked non-bearing vertical partition wall for open-concept kitchen entry',
          'Sited 1.8m premium quartz kitchen island with integrated under-counter fridge',
          'Aligned primary bedroom access paths to form natural wind tunnel corridor',
          'Selected loose timber sideboard and modular sofas instead of heavy built-ins'
        ],
        layout2D: {
          width: 800,
          height: 500,
          walls: [
            // Structural Boundary
            { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
            { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
            { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
            { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
            // Interior walls remaining (Living/Kitchen vertical wall is HACKED in 2D layout!)
            { x1: 400, y1: 50, x2: 400, y2: 450, type: 'interior' }, 
            { x1: 50, y1: 250, x2: 400, y2: 250, type: 'demolished' },  // Show wall as Demolished!
            { x1: 400, y1: 220, x2: 750, y2: 220, type: 'interior' }, 
            { x1: 250, y1: 250, x2: 250, y2: 450, type: 'interior' }, 
            { x1: 550, y1: 220, x2: 550, y2: 450, type: 'interior' }, 
          ],
          furniture: [
            { id: 'l1', type: 'sofa', x: 120, y: 120, w: 140, h: 55, rotation: 0, label: '3-Seater Sofa' },
            { id: 'l2', type: 'tv_console', x: 350, y: 120, w: 20, h: 100, rotation: 0, label: 'TV Feature Wall' },
            { id: 'l3', type: 'plant', x: 70, y: 80, w: 30, h: 30, rotation: 0, label: 'Fiddle Leaf Fig' },
            // Replaced traditional dining with island + high stool
            { id: 'ki', type: 'kitchen_counter', x: 200, y: 250, w: 110, h: 45, rotation: 0, label: 'Dual-Zone Quartz Island' },
            { id: 'k1', type: 'kitchen_counter', x: 100, y: 380, w: 130, h: 50, rotation: 0, label: 'Prep Counter' },
            { id: 'k2', type: 'sink', x: 160, y: 380, w: 40, h: 35, rotation: 0, label: 'Sink' },
            { id: 'm1', type: 'bed', x: 620, y: 110, w: 140, h: 120, rotation: 90, label: 'Queen Bed' },
            { id: 'm2', type: 'wardrobe', x: 480, y: 130, w: 40, h: 90, rotation: 0, label: 'Built-in Closet' },
            { id: 'b1', type: 'bed', x: 680, y: 300, w: 100, h: 120, rotation: 90, label: 'Single Bed' },
            { id: 'b2', type: 'desk', x: 450, y: 300, w: 80, h: 45, rotation: 90, label: 'Study Table' },
          ],
          roomLabels: [
            { text: 'BREATHING LIVING', x: 200, y: 150 },
            { text: 'QUARTZ ISLAND HUB', x: 230, y: 280 },
            { text: 'OPEN COOK ZONE', x: 120, y: 330 },
            { text: 'MASTER RETREAT', x: 580, y: 150 },
            { text: 'SPARE BEDROOM', x: 580, y: 350 },
            { text: 'BATHROOM', x: 480, y: 400 },
          ]
        },
        layout3D: {
          isometricRooms: []
        }
      },
      optionB: {
        id: 'option-b',
        name: 'Option B — Max Storage',
        tagline: 'Clever Space & Cabinetry',
        description: 'Prioritizes maximum space utilization and modern custom joinery. Ideal for growing families or remote professionals, we structure a high-capacity floor-to-ceiling shoe storage divider directly at the foyer, construct a custom work-from-home acoustic study nook in Bedroom 2, and integrate a heavy-duty storage platform under the Master Bed.',
        budgetEstimate: 51200,
        budgetStatus: 'met',
        budgetFeedback: 'Moderate warning. The extensive use of customized, floor-to-ceiling high-grade oak carpentry pushes costs slightly above baseline, but directly multiplies total cubic feet of hidden storage.',
        legalStatus: 'met',
        legalFeedback: 'HDB regulatory compliant. Drywalls used for study nook are non-combustible and satisfy fire safety spacing codes. No services plumbing shifted.',
        climateStatus: 'warning',
        climateFeedback: 'Slightly reduced direct breeze flow due to full-height foyer cabinets blocking the door draft. Air conditioning planning will be required for the enclosed study nook.',
        fengshuiStatus: 'met',
        fengshuiFeedback: 'Platform bed keeps energy elevated. Adding the entry cabinet acts as an excellent "玄关" (foyer shield), preventing auspicious energy from exiting straight to the kitchen.',
        highlights: [
          'Crafted 2.4m floor-to-ceiling full-height timber storage cabinet at foyer',
          'Erected professional acoustic partition drywall for custom quiet study nook',
          'Constructed 35cm high hydraulic-lift storage platform under master bedroom',
          'Fitted multi-tiered L-shaped kitchen drawers and pantry run'
        ],
        layout2D: {
          width: 800,
          height: 500,
          walls: [
            // Structural Boundary
            { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
            { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
            { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
            { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
            // Wall dividers (We add a NEW drywall! shown as "new" type in layout2D!)
            { x1: 400, y1: 50, x2: 400, y2: 450, type: 'interior' }, 
            { x1: 50, y1: 250, x2: 400, y2: 250, type: 'interior' },  
            { x1: 400, y1: 220, x2: 750, y2: 220, type: 'interior' }, 
            { x1: 250, y1: 250, x2: 250, y2: 450, type: 'interior' }, 
            { x1: 550, y1: 220, x2: 550, y2: 450, type: 'interior' }, 
            // Proposed New Drywall!
            { x1: 400, y1: 330, x2: 550, y2: 330, type: 'new' }, // divides Bedroom 2 into study nook!
          ],
          furniture: [
            { id: 'l1', type: 'sofa', x: 120, y: 120, w: 140, h: 55, rotation: 0, label: 'Sofa with storage storage seats' },
            { id: 'l2', type: 'tv_console', x: 350, y: 120, w: 20, h: 100, rotation: 0, label: 'TV Wall cabinetry' },
            // Full height foyer cabinet
            { id: 'w_f', type: 'wardrobe', x: 70, y: 160, w: 25, h: 90, rotation: 90, label: 'Foyer Shoe Storage' },
            { id: 'k1', type: 'kitchen_counter', x: 100, y: 380, w: 130, h: 50, rotation: 0, label: 'Heavy Cabinetry Run' },
            { id: 'k2', type: 'sink', x: 160, y: 380, w: 40, h: 35, rotation: 0, label: 'Sink' },
            { id: 'd1', type: 'dining', x: 320, y: 330, w: 80, h: 60, rotation: 0, label: 'Dining Table' },
            { id: 'm1', type: 'bed', x: 620, y: 110, w: 140, h: 120, rotation: 90, label: 'Queen Storage Bed' },
            { id: 'm2', type: 'wardrobe', x: 480, y: 130, w: 40, h: 90, rotation: 0, label: 'Full Height Robe' },
            { id: 'b1', type: 'bed', x: 680, y: 260, w: 100, h: 110, rotation: 90, label: 'Spare Bed' },
            // Study Nook desk inside new partition!
            { id: 'b2_study', type: 'desk', x: 485, y: 380, w: 75, h: 35, rotation: 0, label: 'Acousitc WFH Desk' },
          ],
          roomLabels: [
            { text: 'LIVING ROOM', x: 200, y: 80 },
            { text: 'DINING CORNER', x: 320, y: 280 },
            { text: 'STORAGE CORRIDOR', x: 140, y: 200 },
            { text: 'MASTER STORAGE BR', x: 580, y: 150 },
            { text: 'SPARE BR', x: 650, y: 350 },
            { text: 'STUDY NOOK', x: 470, y: 360 },
          ]
        },
        layout3D: {
          isometricRooms: []
        }
      }
    };
  }

  // Fallback / standard options for HDB 4 or 5 Room
  const is5Room = presetId === 'hdb-5-room';
  const sqPrice = is5Room ? 1.25 : 1.1;

  return {
    optionA: {
      id: 'option-a',
      name: 'Option A — Open Flow',
      tagline: 'Sleek Airflow Promenade',
      description: `Optimized specifically for Singapore\'s year-round warmth. We prioritize maximizing cross-ventilation by introducing an expansive open-concept living and social hub. Partitions between dining and kitchen are removed to create a clean, modern culinary preparation zone combined with a wide panoramic breakfast line.`,
      budgetEstimate: Math.round(52000 * sqPrice),
      budgetStatus: 'met',
      budgetFeedback: 'Highly cost-effective. Keeping interior modifications light and focusing on a few exquisite designer visual points ensures you stay under standard housing limits.',
      legalStatus: 'met',
      legalFeedback: 'Standard hacking permits fully approved under HDB/URA guidelines. No structural pillar columns are touched in this open footprint.',
      climateStatus: 'met',
      climateFeedback: 'Exceptional. Minimizes the need for mechanical cooling by creating natural north-south wind tunnels across the central residential layout.',
      fengshuiStatus: 'met',
      fengshuiFeedback: 'Bed headboards aligned perfectly with supportive solid brick walls. Good energy conservation.',
      highlights: [
        'Demolished kitchen barrier partitions for grand open-plan integration',
        'Proposed custom dual-height breakfast wrap island',
        'Engineered unobstructed wind hallways to harness high-rise sea breezes',
        'Added modular lounge seats with lightweight cane wood backings'
      ],
      layout2D: {
        width: 800,
        height: 500,
        walls: [
          { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
          { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
          { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
          { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
          { x1: 300, y1: 50, x2: 300, y2: 450, type: 'interior' }, 
          { x1: 50, y1: 220, x2: 300, y2: 220, type: 'demolished' }, // hacked kitchen wall!
          { x1: 300, y1: 180, x2: 750, y2: 180, type: 'interior' }, 
          { x1: 520, y1: 180, x2: 520, y2: 450, type: 'interior' }, 
          { x1: 180, y1: 220, x2: 180, y2: 450, type: 'interior' }, 
        ],
        furniture: [
          { id: 'l1', type: 'sofa', x: 100, y: 110, w: 160, h: 60, rotation: 0, label: 'L-Shape Lounge' },
          { id: 'l2', type: 'tv_console', x: 260, y: 110, w: 20, h: 100, rotation: 0, label: 'Wall Mount TV' },
          { id: 'ki', type: 'kitchen_counter', x: 190, y: 220, w: 90, h: 40, rotation: 0, label: 'Breakfast Island' },
          { id: 'k1', type: 'kitchen_counter', x: 100, y: 350, w: 180, h: 50, rotation: 0, label: 'Linear counter' },
          { id: 'k2', type: 'sink', x: 200, y: 350, w: 45, h: 35, rotation: 0, label: 'Cooking Sink' },
          { id: 'm1', type: 'bed', x: 620, y: 240, w: 150, h: 140, rotation: 90, label: 'King Bed' },
          { id: 'b2_1', type: 'bed', x: 410, y: 240, w: 140, h: 100, rotation: 180, label: 'Queen Bed' },
        ],
        roomLabels: [
          { text: 'GRAND OPEN HALL', x: 150, y: 80 },
          { text: 'QUARTZ ISLAND', x: 220, y: 180 },
          { text: 'LIGHT MASTER', x: 640, y: 280 },
          { text: 'BEDROOM 2', x: 410, y: 330 },
        ]
      },
      layout3D: { isometricRooms: [] }
    },
    optionB: {
      id: 'option-b',
      name: 'Option B — Max Storage',
      tagline: 'Custom Timber Wall-units',
      description: `Tailored for urban storage efficacy. We configure elegant full-height, handle-less timber cabinetry arrays that integrate completely with living room margins. By inserting custom dual-purpose study workspaces and storage wardrobes, we double usable storage footprints without sacrificing central hallway spaces.`,
      budgetEstimate: Math.round(71500 * sqPrice),
      budgetStatus: 'met',
      budgetFeedback: 'Fitted custom woodworks are a capital investment but permanently elevate property asset resale value in Singapore HDB markets.',
      legalStatus: 'met',
      legalFeedback: 'Laminated timber platforms fully conform to fire hazard safety specs. Moisture-resistant backing included for wet structural surfaces.',
      climateStatus: 'met',
      climateFeedback: 'Adequate flow. Generous drawer pullouts use humidity-sealed panels to safe-keep fabric collections during humid monsoon cycles.',
      fengshuiStatus: 'met',
      fengshuiFeedback: 'Custom closets serve as excellent wind deflectors ensuring peaceful sleeping pockets in the rooms.',
      highlights: [
        'Erected 3.6m uninterrupted full-height entertainment storage unit',
        'Configured customized study platform with overhead open cabinetry',
        'Specified concealed double-depth panelling under vertical utility pipes',
        'Fitted dry-pantry drawers with heavy-duty soft close glides'
      ],
      layout2D: {
        width: 800,
        height: 500,
        walls: [
          { x1: 50, y1: 50, x2: 750, y2: 50, type: 'exterior' },
          { x1: 750, y1: 50, x2: 750, y2: 450, type: 'exterior' },
          { x1: 750, y1: 450, x2: 50, y2: 450, type: 'exterior' },
          { x1: 50, y1: 450, x2: 50, y2: 50, type: 'exterior' },
          { x1: 300, y1: 50, x2: 300, y2: 450, type: 'interior' }, 
          { x1: 50, y1: 220, x2: 300, y2: 220, type: 'interior' }, // solid wall preserved
          { x1: 300, y1: 180, x2: 750, y2: 180, type: 'interior' }, 
          { x1: 520, y1: 180, x2: 520, y2: 450, type: 'interior' }, 
          { x1: 180, y1: 220, x2: 180, y2: 450, type: 'interior' }, 
          { x1: 300, y1: 350, x2: 520, y2: 350, type: 'new' } // newly partitioned study box!
        ],
        furniture: [
          { id: 'l1', type: 'sofa', x: 100, y: 110, w: 160, h: 60, rotation: 0, label: 'L-Shape Lounge' },
          { id: 'l2', type: 'tv_console', x: 260, y: 110, w: 20, h: 100, rotation: 0, label: 'Wall Mount Cabinetry TV' },
          { id: 'w_sho', type: 'wardrobe', x: 65, y: 190, w: 30, h: 70, rotation: 90, label: 'Full Foyer Shoebox' },
          { id: 'k1', type: 'kitchen_counter', x: 100, y: 350, w: 180, h: 50, rotation: 0, label: 'Drak cabinets run' },
          { id: 'm1', type: 'bed', x: 620, y: 240, w: 150, h: 140, rotation: 90, label: 'Platform Bed with drawers' },
          { id: 'm2', type: 'wardrobe', x: 710, y: 105, w: 30, h: 130, rotation: 90, label: 'Slide Wardrobes' },
          { id: 'b2_1', type: 'bed', x: 410, y: 240, w: 145, h: 110, rotation: 180, label: 'Queen Bed' },
          { id: 'bst_1', type: 'desk', x: 380, y: 400, w: 110, h: 40, rotation: 0, label: 'Quiet Study desk' }
        ],
        roomLabels: [
          { text: 'STORAGE LOUNGE', x: 155, y: 75 },
          { text: 'COMPACT DINING', x: 230, y: 175 },
          { text: 'FULLY INTEGRATED KIT', x: 130, y: 275 },
          { text: 'STORAGE SUITE', x: 640, y: 275 },
          { text: 'BEDROOM 2', x: 410, y: 300 },
          { text: 'STUDY STUDY NOOK', x: 410, y: 385 },
        ]
      },
      layout3D: { isometricRooms: [] }
    }
  };
};
