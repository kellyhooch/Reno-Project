/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RenovationConstraints {
  propertyType: 'hdb_3' | 'hdb_4' | 'hdb_5' | 'condo' | 'landed';
  budget: number;
  spaceConstraints: {
    openKitchen: boolean;
    studyNook: boolean;
    helpersRoom: boolean;
    storagePriority: boolean;
    elderlyFriendly: boolean;
  };
  climatePrefs: {
    crossVentilation: boolean;
    humidityResist: boolean;
    naturalLight: boolean;
  };
  fengshuiEnabled: boolean;
  customNotes?: string;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'exterior' | 'interior' | 'demolished' | 'new';
}

export interface Furniture {
  id: string;
  type: 'bed' | 'sofa' | 'tv_console' | 'dining' | 'kitchen_counter' | 'wardrobe' | 'desk' | 'plant' | 'sink' | 'stove' | 'toilet' | 'shower';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // in degrees
  label: string;
}

export interface RoomLabel {
  text: string;
  x: number;
  y: number;
}

export interface RenderLayout {
  walls: Wall[];
  furniture: Furniture[];
  roomLabels: RoomLabel[];
  width: number;
  height: number;
}

export interface LayoutOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  budgetEstimate: number;
  budgetStatus: 'met' | 'warning';
  budgetFeedback: string;
  legalStatus: 'met' | 'warning';
  legalFeedback: string;
  climateStatus: 'met' | 'warning';
  climateFeedback: string;
  fengshuiStatus: 'met' | 'warning' | 'neutral';
  fengshuiFeedback: string;
  highlights: string[];
  layout2D: RenderLayout;
  layout3D: {
    isometricRooms: Array<{
      id: string;
      name: string;
      color: string;
      points: [number, number][]; // 2D points to project into isometric
      height: number;
      elements: Array<{
        type: string;
        label: string;
        x: number;
        y: number;
        z: number;
        w: number;
        l: number;
        h: number;
        color?: string;
      }>;
    }>;
  };
}

export interface PresetPlan {
  id: string;
  name: string;
  type: 'hdb_3' | 'hdb_4' | 'hdb_5' | 'condo' | 'landed';
  sqm: number;
  imageUrl?: string;
  layout2D: RenderLayout;
}
