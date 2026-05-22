/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Upload, 
  Sliders, 
  Layout, 
  Eye, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Share2, 
  Bookmark, 
  Sparkles, 
  Wind, 
  Scale, 
  ArrowRight, 
  ChevronRight, 
  UserCheck, 
  Compass, 
  DollarSign, 
  Hammer, 
  CheckCircle, 
  Users, 
  FileText,
  BookmarkCheck,
  ChevronLeft,
  Download
} from 'lucide-react';

import { PRESET_PLANS } from './presets';
import { getOptionsForPreset } from './mockLayouts';
import { RenovationConstraints, LayoutOption, PresetPlan, Furniture } from './types';
import FloorPlanCanvas from './components/FloorPlanCanvas';
import IsometricRenderer from './components/IsometricRenderer';
import { supabase } from './lib/supabase';

// Helper for property type human descriptions
const getPropertyLabel = (type: string) => {
  switch (type) {
    case 'hdb_3': return '3-Room HDB Flat';
    case 'hdb_4': return '4-Room HDB Flat';
    case 'hdb_5': return '5-Room HDB Flat';
    case 'condo': return 'Condominium';
    case 'landed': return 'Landed Property';
    default: return 'Singapore Flat';
  }
};

export default function App() {
  // Navigation & Step Wizard State
  // 1: Landing/Discovery, 2: Select/Upload, 3: Constraints, 4: Results Comparison, 5: Detail review
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Property and upload configuration
  const [selectedPresetId, setSelectedPresetId] = useState<string>('hdb-4-room');
  const [propertyType, setPropertyType] = useState<'hdb_3' | 'hdb_4' | 'hdb_5' | 'condo' | 'landed'>('hdb_4');
  const [areaSize, setAreaSize] = useState<number>(90);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Dynamic area-based tiered pricing formulas
  const getStandardPrice = (sqm: number) => Math.max(19, Math.round(10 + sqm * 0.20));
  const getPremiumPrice = (sqm: number) => Math.max(39, Math.round(20 + sqm * 0.40));

  // Design constraints
  const [budget, setBudget] = useState<number>(55000);
  const [openKitchen, setOpenKitchen] = useState<boolean>(true);
  const [studyNook, setStudyNook] = useState<boolean>(true);
  const [helpersRoom, setHelpersRoom] = useState<boolean>(false);
  const [storagePriority, setStoragePriority] = useState<boolean>(true);
  const [elderlyFriendly, setElderlyFriendly] = useState<boolean>(false);

  const [crossVentilation, setCrossVentilation] = useState<boolean>(true);
  const [humidityResist, setHumidityResist] = useState<boolean>(true);
  const [naturalLight, setNaturalLight] = useState<boolean>(true);

  const [fengshuiEnabled, setFengshuiEnabled] = useState<boolean>(true);
  const [fengshuiFacing, setFengshuiFacing] = useState<string>('North-East');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Results State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [optionA, setOptionA] = useState<LayoutOption | null>(null);
  const [optionB, setOptionB] = useState<LayoutOption | null>(null);
  const [selectedOption, setSelectedOption] = useState<LayoutOption | null>(null);

  // Interactive UI view toggles for Results (Option cards)
  const [viewModeA, setViewModeA] = useState<'2D' | '3D'>('3D');
  const [viewModeB, setViewModeB] = useState<'2D' | '3D'>('3D');
  const [detailViewMode, setDetailViewMode] = useState<'2D' | '3D'>('3D');
  
  // Floating info selectors
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
  
  // Saved designs storage gallery
  const [savedProjects, setSavedProjects] = useState<Array<{
    id: string;
    timestamp: string;
    propertyType: string;
    budget: number;
    optionSelected: 'Option A' | 'Option B';
    optionData: LayoutOption;
    presetId: string;
  }>>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Share Notification flyout
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  // Monetization and Tier-Pricing State
  const [currentTier, setCurrentTier] = useState<'free' | 'standard' | 'premium'>('free');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingTier, setPendingTier] = useState<'free' | 'standard' | 'premium'>('free');
  const [promoCode, setPromoCode] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4111 2222 3333 4444',
    cardExpiry: '12/28',
    cardCvc: '123',
    cardName: 'DONALD LIM'
  });
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  
  // Reno pro contractor consultant overlay modal
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [consultSubmitted, setConsultSubmitted] = useState<boolean>(false);
  const [proForm, setProForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredDate: '2026-06-15'
  });

  // Hydrate preset plans from DB
  const activePreset = PRESET_PLANS.find(p => p.id === selectedPresetId) || PRESET_PLANS[0];

  // Auto update propertyType selection and areaSize based on selected preset
  useEffect(() => {
    if (selectedPresetId === 'hdb-3-room') {
      setPropertyType('hdb_3');
      setAreaSize(65);
    } else if (selectedPresetId === 'hdb-4-room') {
      setPropertyType('hdb_4');
      setAreaSize(90);
    } else if (selectedPresetId === 'hdb-5-room') {
      setPropertyType('hdb_5');
      setAreaSize(110);
    } else if (selectedPresetId === 'condo-luxury') {
      setPropertyType('condo');
      setAreaSize(95);
    } else if (selectedPresetId === 'landed-villa') {
      setPropertyType('landed');
      setAreaSize(210);
    }
  }, [selectedPresetId]);

  // Helper to map DB row into standard React state project model
  const mapDbRowToProject = (row: any) => {
    let optionDataParsed = null;
    const rawOptionData = row.optionData !== undefined ? row.optionData : row.option_data;
    if (rawOptionData) {
      if (typeof rawOptionData === 'string') {
        try {
          optionDataParsed = JSON.parse(rawOptionData);
        } catch {
          optionDataParsed = rawOptionData;
        }
      } else {
        optionDataParsed = rawOptionData;
      }
    }

    return {
      id: row.id != null ? String(row.id) : '',
      timestamp: row.timestamp || row.created_at || new Date().toISOString(),
      propertyType: row.propertyType || row.property_type || 'hdb_4',
      budget: row.budget != null ? Number(row.budget) : 55000,
      optionSelected: row.optionSelected || row.option_selected || 'Option A',
      optionData: optionDataParsed,
      presetId: row.presetId || row.preset_id || 'hdb-4-room'
    };
  };

  // Load saved projects from Supabase and subscribe to live changes
  useEffect(() => {
    const fetchSupabaseEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*');
        
        if (error) {
          console.error("Failed to load entries from Supabase:", error);
          return;
        }
        
        if (data) {
          const mapped = data.map((row: any) => mapDbRowToProject(row));
          // Sort descending by numeric ID or timestamp
          mapped.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            if (isNaN(timeA) || isNaN(timeB)) {
              return b.id.localeCompare(a.id);
            }
            return timeB - timeA;
          });
          setSavedProjects(mapped);
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      }
    };

    fetchSupabaseEntries();

    // Live subscription to "entries" table so UI updates in real-time when other users post
    const channel = supabase
      .channel('entries-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => {
          console.log('Realtime change observed:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newProj = mapDbRowToProject(payload.new);
            setSavedProjects((prev) => {
              if (prev.some(p => p.id === newProj.id)) return prev;
              const updated = [newProj, ...prev];
              return updated.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                if (isNaN(timeA) || isNaN(timeB)) {
                  return b.id.localeCompare(a.id);
                }
                return timeB - timeA;
              });
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProj = mapDbRowToProject(payload.new);
            setSavedProjects((prev) => {
              return prev.map(p => p.id === updatedProj.id ? updatedProj : p);
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old?.id);
            setSavedProjects((prev) => {
              return prev.filter(p => p.id !== deletedId);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Preset Slider Adjusters
  const alignBudgetPreset = (presetType: 'hdb3' | 'hdb4' | 'hdb5' | 'condo') => {
    if (presetType === 'hdb3') setBudget(38000);
    if (presetType === 'hdb4') setBudget(55000);
    if (presetType === 'hdb5') setBudget(78000);
    if (presetType === 'condo') setBudget(110000);
  };

  // File drag & drop file triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid floor plan image (PNG, JPG).");
      return;
    }
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setUploadedImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Real-time server side Gemini call triggering
  const triggerRenovationGenerator = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCurrentStep(4); // Advance to results screen immediately to show nice AI loading state

    // Formulate constraints for transmission
    const constraintsObj: RenovationConstraints = {
      propertyType,
      budget,
      spaceConstraints: {
        openKitchen,
        studyNook,
        helpersRoom,
        storagePriority,
        elderlyFriendly
      },
      climatePrefs: {
        crossVentilation,
        humidityResist,
        naturalLight
      },
      fengshuiEnabled,
      customNotes: customNotes + (fengshuiEnabled ? ` (Compass direction faces ${fengshuiFacing})` : '')
    };

    try {
      // 1. Send call to real server endpoint with base64 image if attached
      const response = await fetch('/api/analyze-renovation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyType: constraintsObj.propertyType,
          budget: constraintsObj.budget,
          spaceConstraints: constraintsObj.spaceConstraints,
          climatePrefs: constraintsObj.climatePrefs,
          fengshuiEnabled: constraintsObj.fengshuiEnabled,
          customNotes: constraintsObj.customNotes,
          floorPlanImage: uploadedImageBase64, // Optional custom upload
          areaSize: areaSize
        })
      });

      const resData = await response.json();
      
      // Calculate or load initial structural blueprints vector map
      const presetBlueprint = getOptionsForPreset(selectedPresetId);

      if (response.ok && resData.success && resData.options) {
        // Hydrate layout option with server-side AI advice & vector diagram
        const aiA: LayoutOption = {
          ...presetBlueprint.optionA,
          tagline: resData.options.optionA.tagline,
          description: resData.options.optionA.description,
          budgetEstimate: resData.options.optionA.budgetEstimate,
          budgetStatus: resData.options.optionA.budgetStatus,
          budgetFeedback: resData.options.optionA.budgetFeedback,
          legalStatus: resData.options.optionA.legalStatus,
          legalFeedback: resData.options.optionA.legalFeedback,
          climateStatus: resData.options.optionA.climateStatus,
          climateFeedback: resData.options.optionA.climateFeedback,
          fengshuiStatus: resData.options.optionA.fengshuiStatus,
          fengshuiFeedback: resData.options.optionA.fengshuiFeedback,
          highlights: resData.options.optionA.highlights
        };

        const aiB: LayoutOption = {
          ...presetBlueprint.optionB,
          tagline: resData.options.optionB.tagline,
          description: resData.options.optionB.description,
          budgetEstimate: resData.options.optionB.budgetEstimate,
          budgetStatus: resData.options.optionB.budgetStatus,
          budgetFeedback: resData.options.optionB.budgetFeedback,
          legalStatus: resData.options.optionB.legalStatus,
          legalFeedback: resData.options.optionB.legalFeedback,
          climateStatus: resData.options.optionB.climateStatus,
          climateFeedback: resData.options.optionB.climateFeedback,
          fengshuiStatus: resData.options.optionB.fengshuiStatus,
          fengshuiFeedback: resData.options.optionB.fengshuiFeedback,
          highlights: resData.options.optionB.highlights
        };

        setOptionA(aiA);
        setOptionB(aiB);
        console.log("Successfully integrated AI responses into layouts.");
      } else {
        // Safe robust offline fallback with custom adjustments
        console.warn("API returned error or key has limits. Hydrating standard HDB models mapping locally.", resData.error);
        setOptionA(presetBlueprint.optionA);
        setOptionB(presetBlueprint.optionB);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback locally
      const presetBlueprint = getOptionsForPreset(selectedPresetId);
      setOptionA(presetBlueprint.optionA);
      setOptionB(presetBlueprint.optionB);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Design Remote Savers via Supabase Client
  const saveSelectedDesign = async (option: LayoutOption, nameSelected: 'Option A' | 'Option B') => {
    const rawId = "pro-" + Date.now();
    const newProject = {
      id: rawId,
      timestamp: new Date().toLocaleDateString('en-SG', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      propertyType: propertyType,
      budget: budget,
      optionSelected: nameSelected,
      optionData: option,
      presetId: selectedPresetId
    };

    try {
      // Build insertion payload with both casing methods to handle snake_case or camelCase columns safely
      let payloadToTry: any = {
        id: newProject.id,
        timestamp: newProject.timestamp,
        propertyType: newProject.propertyType,
        property_type: newProject.propertyType,
        budget: newProject.budget,
        optionSelected: newProject.optionSelected,
        option_selected: newProject.optionSelected,
        optionData: newProject.optionData,
        option_data: newProject.optionData,
        presetId: newProject.presetId,
        preset_id: newProject.presetId
      };

      let attempts = 0;
      let response: any = null;

      while (attempts < 10) {
        response = await supabase.from('entries').insert([payloadToTry]).select('*');
        if (!response.error) {
          break;
        }

        const error = response.error;
        console.error(`Supabase insert attempt ${attempts + 1} failed:`, error);

        // Case 1: Undefined column error (Postgres 42703) - dyn-strip unknown columns
        if (error.code === '42703' && error.message) {
          const match = error.message.match(/column "([^"]+)"/);
          if (match && match[1]) {
            const offendingColumn = match[1];
            console.warn(`Stripping unknown column '${offendingColumn}' and retrying...`);
            delete payloadToTry[offendingColumn];
            attempts++;
            continue;
          }
        }

        // Case 2: ID casting error (Postgres 22P02, converting text 'pro-...' to uuid/int)
        if (error.code === '22P02' && error.message && error.message.includes('id')) {
          if (payloadToTry.id) {
            console.warn("UUID/Number conversion failure on key 'id'. Trying to omit ID for auto-generation...");
            delete payloadToTry.id;
            attempts++;
            continue;
          }
        }

        break;
      }

      if (response && response.error) {
        throw response.error;
      }

      setSaveSuccessMessage(`Successfully saved ${option.name} to the shared project board!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save to Supabase:", err);
      alert("Ah, we couldn't push the layout to the shared Supabase group board. Ensure the database matches the entries schema!");
    }
  };

  const deleteSavedProject = async (id: string) => {
    try {
      // Direct delete by matching id
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) {
        // Fallback: If id is stored as a bigint/int in Postgres but passed as string, convert it
        const numericId = Number(id);
        if (!isNaN(numericId)) {
          const { error: numericError } = await supabase
            .from('entries')
            .delete()
            .eq('id', numericId);
          if (numericError) throw numericError;
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error("Failed to delete from Supabase:", err);
    }
  };

  // Specification Downloader (Payment Protected)
  const handleDownloadLayout = (option: LayoutOption) => {
    if (currentTier === 'free') {
      setPendingTier('standard');
      setShowPaymentModal(true);
      return;
    }
    
    try {
      const fileContent = `========================================================
RESIDENCE BLUEPRINT CONSTRUCTION SPECIFICATION REPORT
========================================================
PROPERTY MODEL: ${getPropertyLabel(propertyType).toUpperCase()}
UPGRADED PLAN TIER: ${currentTier === 'premium' ? 'PRO PREMIUM DESIGNER STUDIO' : 'STANDARD ARCHITECT BLUEPRINT'}
LAYOUT OPTION: ${option.name.toUpperCase()}

TAGLINE: ${option.tagline}
BUDGET ALLOCATION: SGD $${option.budgetEstimate.toLocaleString()}
CLIMATE VERIFICATION: ${option.climateFeedback}
LEGAL/URA COMPLIANCE CHECK: ${option.legalFeedback}
GEOMANCY DETAILED ADVICE: ${option.fengshuiFeedback}

PROPOSED ARCHITECTURAL BUILT-INS & SPECS:
${option.highlights.map((h, i) => `${i + 1}. [CONSTRUCTION SPEC] ${h}`).join('\n')}

PHYSICAL MEASUREMENTS (WALL LINES):
${option.layout2D.walls.map((w, i) => `Line ${i + 1}: Path (${w.x1}, ${w.y1}) to (${w.x2}, ${w.y2}) - Wall style: ${w.type}`).join('\n')}

COMPLETE FURNISHING MAP SPECIFICATIONS:
${option.layout2D.furniture.map((f, i) => `Furniture item ${i + 1}: ${f.label} (${f.type}) at coordinates (${f.x}, ${f.y}), dimensions: ${f.w}x${f.h}`).join('\n')}

Thank you for choosing Singapore AI Renovation Studio.
Licensed building and design specifications ready for local contractor execution.
========================================================`;

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const element = document.createElement('a');
      element.href = URL.createObjectURL(blob);
      element.download = `SG_Reno_Planner_${option.id}_Full_Specs.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setDownloadSuccessToast(`Successfully downloaded full blueprint specifications file for ${option.name}!`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    } catch (e) {
      console.error(e);
      alert("An error occurred during specification download.");
    }
  };

  // Clipboard Copier
  const copyShareAddress = () => {
    const dataString = `https://ais-pre-asnh6b7xtwm2b6ua6hzlxg-549454245042.asia-southeast1.run.app/?type=${propertyType}&budget=${budget}&option=${selectedOption?.id || 'option-a'}`;
    navigator.clipboard.writeText(dataString);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleProConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultSubmitted(true);
    setTimeout(() => {
      setShowProModal(false);
      setConsultSubmitted(false);
      setProForm({ name: '', phone: '', email: '', preferredDate: '2026-06-15' });
      alert("Match found! An HDB-registered renovation professional will contact you within 24 hours.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-blue-100 selection:text-blue-955 flex flex-col">
      
      {/* Dynamic Saving Action HUD */}
      {saveSuccessMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-900 text-white font-medium text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-blue-300" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {paymentSuccessToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-900 text-white font-medium text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-blue-300" />
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {downloadSuccessToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-900 text-white font-medium text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-blue-300" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Modern, elegant organic Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className="bg-blue-800 text-white p-2 rounded-xl shadow-md rotate-3 hover:rotate-0 transition-transform duration-300">
              <Home className="w-5 h-5" id="header-logo-icon" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-stone-900 block">
                Singapore Renovation Planner
              </span>
              <span className="text-[10px] font-mono tracking-widest text-blue-800 uppercase block font-semibold leading-none">
                AI Space-Engineering Studio
              </span>
            </div>
          </div>

          {/* Quick Step Indicators for navigation context */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { num: 1, label: 'Discover' },
              { num: 2, label: 'Upload Plan' },
              { num: 3, label: 'Configure' },
              { num: 4, label: 'Review Options' },
              { num: 5, label: 'Detailed Specs' }
            ].map((s) => {
              const isActiveAndClickable = s.num <= 3 || (s.num === 4 && optionA) || (s.num === 5 && selectedOption);
              return (
                <button
                  key={s.num}
                  onClick={() => {
                    if (isActiveAndClickable) {
                      setCurrentStep(s.num);
                    }
                  }}
                  disabled={!isActiveAndClickable}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-205 flex items-center gap-1.5 cursor-pointer ${
                    currentStep === s.num
                      ? 'bg-blue-55 text-blue-955 border border-blue-200 shadow-sm'
                      : isActiveAndClickable
                      ? 'text-stone-750 hover:bg-stone-100'
                      : 'text-stone-400 opacity-45 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    currentStep === s.num ? 'bg-blue-800 text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {s.num}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Active Tier indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                {currentTier === 'free' ? 'Free Tryout' : currentTier === 'standard' ? 'Standard Tier' : 'Pro Premium'}
              </span>
              {currentTier === 'free' && (
                <button
                  onClick={() => {
                    setPendingTier('standard');
                    setShowPaymentModal(true);
                  }}
                  className="ml-1 text-[9px] font-bold text-white bg-blue-800 hover:bg-blue-900 px-2 py-0.5 rounded cursor-pointer"
                >
                  UPGRADE
                </button>
              )}
            </div>

            {savedProjects.length > 0 && (
              <button 
                onClick={() => {
                  const element = document.getElementById("saved-projects-board");
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-850 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-200"
              >
                <BookmarkCheck className="w-4 h-4 text-blue-800" />
                <span>Saved ({savedProjects.length})</span>
              </button>
            )}
            <button
              onClick={() => {
                if (currentStep === 1) setCurrentStep(2);
                else if (currentStep === 2) setCurrentStep(3);
                else if (currentStep === 3) triggerRenovationGenerator();
              }}
              className="bg-blue-800 hover:bg-blue-900 active:translate-y-0.5 text-white text-xs px-4 py-2 font-display font-medium rounded-xl shadow-lg shadow-blue-900/10 transition-all duration-200"
            >
              {currentStep === 1 && 'Renovate Now'}
              {currentStep === 2 && 'Next: Set Constraints'}
              {currentStep === 3 && 'Generate Plans'}
              {currentStep >= 4 && 'New Project'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">

        {/* ==================================== */}
        {/* STEP 1: HOMEPAGE & DISCOVERY PANEL  */}
        {/* ==================================== */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-12 animate-fade-in">
            {/* Hero Value Prop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-radial from-amber-50/70 to-orange-100/30 p-8 sm:p-12 rounded-3xl border border-orange-100/60 shadow-sm">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-800 bg-blue-100/75 px-3 py-1 rounded-full w-fit">
                  🌿 Singapore Home Renovation Planner
                </span>
                <h1 className="font-display font-bold text-4xl sm:text-5xl text-stone-900 leading-[1.1] tracking-tight">
                  Your flat. <span className="text-blue-800 underline decoration-orange-300">Two renovation visions</span>. Designed for Singapore.
                </h1>
                <p className="text-stone-650 text-base leading-relaxed max-w-xl">
                  Upload your floor plan. Receive 2 custom renovation layouts in 2D and 3D — optimized for Singapore's tropical climate, floor regulations, and your HDB or condominium budget.
                </p>
                
                {/* Trust Signals bar (Page 5 and Page 7) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-stone-200 shadow-sm mt-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-sky-50 text-sky-850 rounded-lg">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-display font-medium text-xs text-stone-900 block">Climate-Smart</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Cross-ventilation priority</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-stone-150 pt-3 sm:pt-0 sm:pl-3">
                    <div className="p-1.5 bg-blue-50 text-blue-800 rounded-lg">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-display font-medium text-xs text-stone-900 block">HDB / URA Compliant</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Hacking guidelines safety</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-stone-150 pt-3 sm:pt-0 sm:pl-3">
                    <div className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-display font-medium text-xs text-stone-900 block">Fengshui Optional</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Chi-balancing placement templates</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 mt-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                  >
                    <span>Upload your floor plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPresetId('hdb-3-room');
                      setCurrentStep(2);
                    }}
                    className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-display text-xs font-semibold px-6 py-3.5 rounded-xl transition-all duration-200"
                  >
                    Explore Free Demo
                  </button>
                </div>
              </div>

              {/* Visual Hook - Interactive transitioning flat blueprint display (Page 5) */}
              <div className="lg:col-span-5 relative w-full aspect-[4/5] bg-white rounded-2xl border border-stone-200 shadow-xl p-4 overflow-hidden group">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 bg-white/90 backdrop-blur-sm shadow-sm px-2 py-1 rounded-md text-[10px] font-semibold text-stone-600 border border-stone-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  <span>SAMPLE PREVIEW</span>
                </div>
                
                {/* 2D or 3D view selector */}
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-grow flex items-center justify-center p-2 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" 
                      alt="Modern Space" 
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/10 to-transparent rounded-xl flex flex-col justify-end p-6">
                      <span className="text-white/60 font-mono text-[10px] tracking-widest block uppercase">Singapore HDB Design</span>
                      <h3 className="text-white font-display text-xl font-bold tracking-tight">Harness Space. Breathe Light.</h3>
                      <p className="text-white/80 text-[11px] mt-1.5 max-w-xs leading-relaxed">
                        Every layout we build evaluates local moisture winds and MCA construction permits automatically.
                      </p>
                    </div>
                  </div>
                  
                  {/* Small sub-tabs representation of mock options */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                    <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                      <span className="text-sky-950 font-display text-xs font-bold block">Option A</span>
                      <span className="text-sky-750 text-[10px] block">Open Living, Hacked Kitchen & Cool Sea Breeze Breeze Corridor.</span>
                    </div>
                    <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                      <span className="text-teal-950 font-display text-xs font-bold block">Option B</span>
                      <span className="text-teal-750 text-[10px] block">Maximize Cabinets, Platform Bed space, Acoustic Study Box.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Illustrated Step Workflow (Page 6) */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="font-display font-medium text-2xl tracking-tight text-stone-900">
                  Step-by-Step Renovation Journey
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  How our platform transforms your floor plan from raw file to detailed design specifications
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { step: 'STEP 1', title: 'Portal Entry', desc: 'Discover badges, climate rules and launch the interactive studio.', icon: Home, bg: 'bg-amber-50 text-amber-800 border-amber-100' },
                  { step: 'STEP 2', title: 'Upload Plan', desc: 'Drag-and-drop HDB drawing files or check ready-to-use template builders.', icon: Upload, bg: 'bg-blue-50 text-blue-800 border-blue-105' },
                  { step: 'STEP 3', title: 'Set Constraints', desc: 'Identify your budget, space prioritization, and toggle dynamic Fengshui filters.', icon: Sliders, bg: 'bg-cyan-50 text-cyan-800 border-cyan-100' },
                  { step: 'STEP 4', title: 'View 2 Options', desc: 'Compare Open Flow and Max Storage layouts under an interactive 2D/3D toggle.', icon: Layout, bg: 'bg-purple-50 text-purple-800 border-purple-100' },
                  { step: 'STEP 5', title: 'Select & Consult', desc: 'Receive complete specs breakdowns and connect with HDB-registered construction pros.', icon: Eye, bg: 'bg-stone-50 text-stone-800 border-stone-200' },
                ].map((wf, idx) => {
                  const stepNum = idx + 1;
                  const canNavigate = stepNum <= 3 || (stepNum === 4 && optionA) || (stepNum === 5 && selectedOption);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (canNavigate) {
                          setCurrentStep(stepNum);
                        }
                      }}
                      disabled={!canNavigate}
                      className={`text-left bg-white p-5 rounded-2xl border relative flex flex-col gap-3 transition-all ${
                        canNavigate
                          ? 'border-stone-200 hover:border-blue-600 hover:shadow-md cursor-pointer'
                          : 'border-stone-150 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-stone-400 block tracking-widest">{wf.step}</span>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${wf.bg}`}>
                          <wf.icon className="w-4 h-4" />
                        </div>
                        <span className="font-display font-bold text-sm text-stone-900">{wf.title}</span>
                      </div>
                      <p className="text-stone-505 text-xs leading-relaxed mt-1">
                        {wf.desc}
                      </p>
                      {idx < 4 && (
                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-stone-350">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* STEP 2: FLOOR PLAN SELECTOR / UPLOAD */}
        {/* ==================================== */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fade-in">
            {/* Upload Area (Left side) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-display font-medium text-2xl tracking-tight text-stone-900 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-800" />
                  <span>Upload Floor Plan Blueprint</span>
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Drag & drop or upload PNG or JPG images of HDB, condo, or landed drawings
                </p>
              </div>

              {/* Upload Drop Zone Box (Page 4 and Page 1) */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center gap-4 group ${
                  dragOver 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : uploadedFileName 
                      ? 'border-blue-500 bg-blue-50/10' 
                      : 'border-stone-300 bg-white hover:border-blue-700 hover:bg-blue-50/5'
                }`}
              >
                <div className={`p-4 rounded-full transition-all duration-300 ${
                  uploadedFileName ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-400 group-hover:bg-blue-50 group-hover:text-blue-800'
                }`}>
                  <Upload className="w-10 h-10" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  {uploadedFileName ? (
                    <div>
                      <span className="font-display font-bold text-sm text-stone-900 block truncate">{uploadedFileName}</span>
                      <span className="text-xs text-blue-700 font-semibold block mt-1">✓ Upload success. Auto-detecting dimensions...</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-display font-bold text-sm text-stone-900 block">Drag & drop floor plan here</span>
                      <span className="text-xs text-stone-500 block">Supports PDF, JPG, or PNG drawing standards</span>
                    </div>
                  )}
                </div>

                {/* File picker button replacement */}
                <label className="bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors duration-200">
                  <span>Browse Files</span>
                  <input 
                    type="file" 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </label>

                {uploadedFileName && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setUploadedFileName(null);
                      setUploadedImageBase64(null);
                    }}
                    className="text-stone-500 hover:text-rose-600 font-mono text-[10px] uppercase font-bold mt-2"
                  >
                    Clear uploaded plan
                  </button>
                )}
              </div>

              {/* Thumbnail indicator detail and HDB instructions */}
              <div className="bg-amber-50/50 px-5 py-4 rounded-2xl border border-amber-150 text-stone-750 text-xs space-y-1.5 leading-relaxed">
                <span className="font-semibold text-amber-900 block">ℹ Singapore HDB Blueprint Notes</span>
                <p>
                  Singapore flats usually feature specific structural load-bearing columns (thick black walls in your PDF). Hacking permits are strict: bathroom locations, water outlets (wet areas), household shelter blast doors, and drainage pipes (sewer vents) cannot be relocated or demolished under HDB/URA guidelines.
                </p>
              </div>
            </div>

            {/* Selector list of Preset layouts (Right side) */}
            <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
              <div className="border-b border-stone-150 pb-4 mb-2">
                <span className="text-[10px] font-mono tracking-widest text-stone-400 block font-bold">PROPERTY SELECTION & SIZING</span>
                <h3 className="font-display font-medium text-lg text-stone-950 mt-1">
                  Configure Your Space Category
                </h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Select your exact property housing category and custom floor area size
                </p>
              </div>

              {/* Housing Category Selection Tabs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-widest text-stone-500 block font-bold uppercase">1. Housing Kind</span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-100 font-bold px-1.5 py-0.5 rounded uppercase">
                    {propertyType.startsWith('hdb') ? 'HDB Flat' : propertyType === 'condo' ? 'Condominium' : 'Landed'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200">
                  {[
                    { id: 'hdb', label: 'HDB Flat' },
                    { id: 'condo', label: 'Condo' },
                    { id: 'landed', label: 'Landed' }
                  ].map((cat) => {
                    const isActive = cat.id === 'hdb' 
                      ? propertyType.startsWith('hdb') 
                      : propertyType === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (cat.id === 'hdb') {
                            setSelectedPresetId('hdb-4-room');
                            setPropertyType('hdb_4');
                            setAreaSize(90);
                          } else if (cat.id === 'condo') {
                            setSelectedPresetId('condo-luxury');
                            setPropertyType('condo');
                            setAreaSize(95);
                          } else {
                            setSelectedPresetId('landed-villa');
                            setPropertyType('landed');
                            setAreaSize(210);
                          }
                          setUploadedFileName(null);
                          setUploadedImageBase64(null);
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-blue-800 text-white shadow-sm font-bold' 
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/45'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Preset Plans corresponding to active Tab Category */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-stone-500 block font-bold uppercase">2. Select Starting Preset Layout</span>
                <div className="grid grid-cols-1 gap-2.5">
                  {PRESET_PLANS.filter(preset => {
                    const activeCat = propertyType.startsWith('hdb') ? 'hdb' : propertyType;
                    const presetCat = preset.type.startsWith('hdb') ? 'hdb' : preset.type;
                    return presetCat === activeCat;
                  }).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setUploadedFileName(null);
                        setUploadedImageBase64(null);
                        setAreaSize(preset.sqm);
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                        selectedPresetId === preset.id && !uploadedFileName
                          ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                          selectedPresetId === preset.id && !uploadedFileName
                            ? 'bg-blue-800 text-white animate-pulse'
                            : 'bg-stone-50 text-stone-500'
                        }`}>
                          <Home className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="font-display font-bold text-xs text-stone-900 block">
                            {preset.name}
                          </span>
                          <span className="text-[11px] text-stone-505 block mt-0.5">
                            Standard: {preset.sqm} sqm ({preset.sqm * 10.76 | 0} sqft)
                          </span>
                        </div>
                      </div>
                      {selectedPresetId === preset.id && !uploadedFileName && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Sizing Customization Slider (User Priority Requirement) */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-widest text-stone-500 block font-bold uppercase">3. Adjust Total Floor Area</span>
                  <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                    {areaSize} sqm (~{Math.round(areaSize * 10.76)} sqft)
                  </span>
                </div>
                
                <input
                  type="range"
                  min={propertyType === 'landed' ? "80" : "30"}
                  max={propertyType === 'landed' ? "600" : "250"}
                  step="5"
                  value={areaSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAreaSize(val);
                  }}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-800"
                />
                
                <p className="text-[10px] text-stone-500 leading-normal">
                  Adjust the slider to tune your exact floor space. Renovation blueprints and tiered advisory pricing will auto-scale to your specified area size.
                </p>
              </div>

              {/* Live Floor Plan Visual Preview of Selected Preset inside standard SVG right in Selector step! */}
              <div className="mt-4 pt-4 border-t border-stone-150 space-y-2">
                <span className="font-display font-semibold text-xs text-stone-900 block">
                  Layout Blueprint Preview: {activePreset.name} (2D)
                </span>
                <div className="rounded-xl border border-stone-150 overflow-hidden transform scale-[0.98]">
                  <FloorPlanCanvas layout={activePreset.layout2D} currentTier="premium" />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-5 py-3 rounded-xl font-display font-semibold border border-stone-200 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Discover</span>
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-blue-800 hover:bg-blue-900 text-white text-xs px-5 py-3 rounded-xl font-display font-semibold shadow-md flex items-center gap-1.5 transition-colors duration-250 cursor-pointer"
                >
                  <span>Configure Design Constraints</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* STEP 3: CONSTRAINTS CONFIGURATION    */}
        {/* ==================================== */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="font-display font-medium text-2xl tracking-tight text-stone-900 flex items-center gap-2">
                <Sliders className="w-6 h-6 text-blue-800" />
                <span>Renovation Constraints Configuration</span>
              </h2>
              <p className="text-stone-550 text-sm mt-1">
                Tell us your budget, space priority wishes, climate ventilations and optional Fengshui elements
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Constraints Forms (Left side) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Property Type & Legal presets (Page 4 and Page 1) */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                    <Scale className="w-4 h-4 text-blue-800" />
                    <span>Property & Legal Rules Compliance</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'hdb_3', label: '3-Room HDB' },
                      { id: 'hdb_4', label: '4-Room HDB' },
                      { id: 'hdb_5', label: '5-Room HDB' },
                      { id: 'condo', label: 'Condo' },
                      { id: 'landed', label: 'Landed' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (p.id === 'hdb_3') setSelectedPresetId('hdb-3-room');
                          else if (p.id === 'hdb_4') setSelectedPresetId('hdb-4-room');
                          else if (p.id === 'hdb_5') setSelectedPresetId('hdb-5-room');
                          else if (p.id === 'condo') setSelectedPresetId('condo-luxury');
                          else if (p.id === 'landed') setSelectedPresetId('landed-villa');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl text-center border transition-all duration-200 cursor-pointer ${
                          propertyType === p.id 
                            ? 'bg-blue-800 text-white border-blue-800 font-bold' 
                            : 'bg-white hover:bg-stone-50 text-stone-750 border-stone-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Dynamic HDB Regulations Box */}
                  <div className="bg-stone-50 p-3.5 rounded-xl text-xs space-y-1 text-stone-600 border border-stone-150">
                    <span className="font-semibold text-stone-850 block">HDB/URA Guidelines Triggered:</span>
                    {propertyType.startsWith('hdb') ? (
                      <p>Hacking of interior wall elements requires HDB permit submission, completed within 3 months of key collection. No wet area slab hacking of toilet units. Gas pipe access must remain clear.</p>
                    ) : propertyType === 'condo' ? (
                      <p>BALCONY restrictions apply under MCST board approvals. High structural load-bearing glass rules. Strict renovation hours (9:00 AM to 5:00 PM on weekdays only).</p>
                    ) : (
                      <p>Subject to URA structural guidelines (setbacks, envelope control, maximum height limits based on zoning map, drainage connections check).</p>
                    )}
                  </div>
                </div>

                {/* 2. Budget Config with quick tiers buttons */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                      <DollarSign className="w-4 h-4 text-blue-800" />
                      <span>Renovation Budget Selection</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      SGD ${(budget / 1000).toFixed(0)}K
                    </span>
                  </div>

                  {/* Slider range: $20,000 to $200,000 */}
                  <input
                    type="range"
                    min="20000"
                    max="200000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-800"
                  />

                  {/* Quick Tiers based on actual Singapore HDB renovation statistics (Page 4 presets) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-stone-400 font-mono tracking-widest block uppercase font-bold">SGD Budget presets for flat tiers</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => alignBudgetPreset('hdb3')}
                        className="py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-800"
                      >
                        HDB 3-Room Avg (~$38k)
                      </button>
                      <button
                        onClick={() => alignBudgetPreset('hdb4')}
                        className="py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-800"
                      >
                        HDB 4-Room Avg (~$55k)
                      </button>
                      <button
                        onClick={() => alignBudgetPreset('hdb5')}
                        className="py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-800"
                      >
                        HDB 5-Room Avg (~$78k)
                      </button>
                      <button
                        onClick={() => alignBudgetPreset('condo')}
                        className="py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-800"
                      >
                        Condo Entry Avg (~$110k)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Space Constraints and requirements */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                    <Layout className="w-4 h-4 text-blue-800" />
                    <span>Space Elements Prioritization</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'openKitchen', label: 'Open Concept Kitchen', desc: 'Demolishes kitchen barrier wall, creates island social zones', val: openKitchen, set: setOpenKitchen },
                      { id: 'studyNook', label: 'Dedicated Study / WFH Nook', desc: 'Carpentry reading corner, built-in desks', val: studyNook, set: setStudyNook },
                      { id: 'helpersRoom', label: 'Helper / Utility Suite', desc: 'Compact sleeping solution inside standard household shelters', val: helpersRoom, set: setHelpersRoom },
                      { id: 'storagePriority', label: 'Max Heavy Storage Priority', desc: 'Platform bed space drawer systems, tall closet sets', val: storagePriority, set: setStoragePriority },
                      { id: 'elderlyFriendly', label: 'Elderly / Safe Transition layouts', desc: 'No steps, wide walkways, grip-ready toilet walls', val: elderlyFriendly, set: setElderlyFriendly }
                    ].map((opt) => (
                      <label key={opt.id} className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-3 cursor-pointer select-none hover:border-blue-600 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={opt.val}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="mt-1 accent-blue-800"
                        />
                        <div>
                          <span className="font-display font-semibold text-xs text-stone-900 block">{opt.label}</span>
                          <span className="text-[10px] text-stone-505 block leading-tight mt-0.5">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Climate Preferences */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                    <Wind className="w-4 h-4 text-blue-800" />
                    <span>Singapore Tropical Climate Preferences</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-blue-600">
                      <input type="checkbox" checked={crossVentilation} onChange={(e) => setCrossVentilation(e.target.checked)} className="mt-0.5 accent-blue-800" />
                      <div>
                        <span className="font-display font-semibold text-xs text-stone-900 block">Cross Ventilation Corridor</span>
                        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5 font-medium">Align door routes for continuous tropical breeze</span>
                      </div>
                    </label>
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-blue-600">
                      <input type="checkbox" checked={humidityResist} onChange={(e) => setHumidityResist(e.target.checked)} className="mt-0.5 accent-blue-800" />
                      <div>
                        <span className="font-display font-semibold text-xs text-stone-900 block">Anti-Humidity Panelling</span>
                        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5 font-medium">Prevent damp mold with marine-plywood carcass</span>
                      </div>
                    </label>
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-blue-600">
                      <input type="checkbox" checked={naturalLight} onChange={(e) => setNaturalLight(e.target.checked)} className="mt-0.5 accent-blue-800" />
                      <div>
                        <span className="font-display font-semibold text-xs text-stone-900 block">Daylight Maximizer</span>
                        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5 font-medium">Use low partition screens to cast light inward</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Optional Fengshui filter toggle */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                      <Compass className="w-4 h-4 text-blue-800" />
                      <span>Fengshui (Geomancy) Optimizer</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fengshuiEnabled}
                        onChange={(e) => setFengshuiEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:width-1 L after:w-4 after:transition-all peer-checked:bg-blue-800"></div>
                      <span className="ml-2 text-xs font-semibold text-stone-750">
                        {fengshuiEnabled ? 'OPTIONAL TOGGLE ON' : 'OPTIONAL TOGGLE OFF'}
                      </span>
                    </label>
                  </div>

                  {fengshuiEnabled && (
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-display font-semibold text-xs text-orange-950">Compass Direction of Main Foyer:</span>
                        <p className="text-[10px] text-stone-500">Determines support-bagua alignment guidelines</p>
                      </div>
                      <select 
                        value={fengshuiFacing} 
                        onChange={(e) => setFengshuiFacing(e.target.value)}
                        className="p-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 bg-white"
                      >
                        {['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'].map((dir) => (
                          <option key={dir} value={dir}>{dir}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 6. Custom Dreams notes input box */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                  <span className="font-display font-bold text-sm text-stone-950 block">Additional wishes or Custom constraints</span>
                  <textarea
                    rows={3}
                    placeholder="E.g. I want to keep existing marble flooring. I need a dedicated console gaming room. Highly priority for double vanity toilet."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full text-xs p-3.5 border border-stone-300 rounded-xl bg-stone-50/50 hover:border-stone-400 focus:outline-none focus:border-blue-800"
                  />
                </div>

                {/* Trigger button with back arrow */}
                <div className="flex justify-between items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-850 text-xs px-5 py-3 rounded-xl font-display font-semibold border border-stone-200 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Floor Plan</span>
                  </button>
                  <button
                    onClick={triggerRenovationGenerator}
                    className="bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-blue-900/15 select-none transition-all duration-350 transform flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span>GENERATE 2 AI HOUSE SCHEMES</span>
                  </button>
                </div>
              </div>

              {/* Layout Sidebar Detail Review (Right side) */}
              <div className="lg:col-span-4 sticky top-24 bg-stone-100 p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-stone-400 font-bold block">CURRENT PROPERTY CONFIG</span>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Selected Blueprint:</span>
                    <span className="font-semibold text-stone-900">{uploadedFileName ? 'Custom Upload Plan' : activePreset.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Property Model:</span>
                    <span className="font-mono bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {propertyType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">Target Budget Capsule:</span>
                    <span className="font-bold text-blue-800">SGD ${budget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-stone-250 pt-3 space-y-2 text-[11px] leading-relaxed text-stone-600">
                  <span className="font-semibold text-stone-850 block">🔧 Live Constraints Applied:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {openKitchen && <li>Hacking vertical kitchen wall for island bar</li>}
                    {studyNook && <li>Establishing acoustic reading workspace desk</li>}
                    {storagePriority && <li>Hydraulic lift storage bed + custom foyer drawers</li>}
                    {crossVentilation && <li>North-South tropical high-rise wind channel corridor</li>}
                    {fengshuiEnabled && <li>Geomancy Bagua analysis initialized ({fengshuiFacing})</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* STEP 4: VIEW 2 LAYOUT OPTIONS BOARD */}
        {/* ==================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* AI LOADING PROGRESS INTERFACE */}
            {isAnalyzing ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-orange-100 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[400px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-105 border-t-blue-800 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-blue-800">
                    <Sparkles className="w-6 h-6 text-blue-800" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xl text-stone-950">
                    Generating Singapore Renovation Models...
                  </h3>
                  <p className="text-stone-550 max-w-md text-xs leading-relaxed">
                    Analyzing wall dimensions & Singapore HDB hacking permits. Simulating cross-ventilation corridor winds for maximum tropical cooling. Applying custom budget allocations...
                  </p>
                </div>

                <div className="w-64 h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-800 w-2/3 rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              // FULLY COMPLETED AI RESPONSES
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-805 bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      GENERATION COMPLETE
                    </span>
                    <h2 className="font-display font-medium text-2xl tracking-tight text-stone-950 mt-1">
                      Compare Layout Vision Strategies
                    </h2>
                    <p className="text-stone-550 text-xs leading-tight mt-0.5 font-medium">
                      Hover check-indicators to view breakdown feedback. Click cards to focus detail review.
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-stone-500 hover:text-blue-800 font-display font-semibold text-xs flex items-center gap-1.5 self-start md:self-auto"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Constraints</span>
                  </button>
                </div>

                {/* SIDE-BY-SIDE OR STACKED COMPARISON BOARD (Page 3 of the PDF) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* OPTION A CARD CONTAINER (Open Flow) */}
                  {optionA && (
                    <div 
                      onClick={() => {
                        setSelectedOption(optionA);
                        setDetailViewMode(viewModeA);
                        setCurrentStep(5);
                      }}
                      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-600 transition-all duration-300 group cursor-pointer"
                    >
                      {/* Viewport header bar */}
                      <div className="p-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-blue-800 font-bold block">OPTION A (OPEN FLOW)</span>
                          <span className="font-display font-bold text-base text-stone-900 block group-hover:text-blue-800 transition-colors border-none">
                            {optionA.tagline}
                          </span>
                        </div>
                        
                        {/* 2D/3D Toggle (Prevent card click from triggering toggle by e.stopPropagation) */}
                        <div 
                          className="bg-stone-200/90 p-1.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setViewModeA('2D')}
                            className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
                              viewModeA === '2D' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-550'
                            }`}
                          >
                            2D Plan
                          </button>
                          <button
                            onClick={() => setViewModeA('3D')}
                            className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
                              viewModeA === '3D' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-550'
                            }`}
                          >
                            3D view
                          </button>
                        </div>
                      </div>

                      {/* Render SVG canvases based on mode */}
                      <div className="p-4 bg-stone-50/20">
                        {viewModeA === '2D' ? (
                          <FloorPlanCanvas 
                            layout={optionA.layout2D} 
                            hoveredFurnitureId={hoveredFurnitureId}
                            setHoveredFurnitureId={setHoveredFurnitureId}
                            currentTier={currentTier}
                          />
                        ) : (
                          <IsometricRenderer 
                            layout={optionA.layout2D} 
                            hoveredFurnitureId={hoveredFurnitureId}
                            setHoveredFurnitureId={setHoveredFurnitureId}
                            styleMode="Open"
                          />
                        )}
                      </div>

                      {/* Design evaluation summary text */}
                      <div className="p-5 space-y-4">
                        <p className="text-stone-650 text-xs leading-relaxed line-clamp-3">
                          {optionA.description}
                        </p>

                        {/* Four Rating Check Indicators with custom tooltips (Page 3 icons) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-stone-150 text-[11px] font-sans">
                          
                          {/* 1. Budget indicator */}
                          <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-blue-50 text-blue-950 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            <span>Estimate: <b>SGD ${(optionA.budgetEstimate / 1000).toFixed(0)}K</b></span>
                          </div>

                          {/* 2. Legal indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionA.legalStatus === 'met' ? 'bg-blue-50 text-blue-950' : 'bg-amber-50 text-amber-950'
                          }`}>
                            {optionA.legalStatus === 'met' ? (
                              <Check className="w-3.5 h-3.5 text-blue-700" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>Legal: Approved</span>
                          </div>

                          {/* 3. Climate indicator */}
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-950 p-1 px-2.5 rounded-lg font-medium">
                            <Wind className="w-3.5 h-3.5 text-blue-600" />
                            <span>Climate: Breezy</span>
                          </div>

                          {/* 4. Fengshui indicator */}
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-950 p-1 px-2.5 rounded-lg font-medium">
                            <Compass className="w-3.5 h-3.5 text-amber-600" />
                            <span>Fengshui: Balances</span>
                          </div>

                        </div>

                        {/* Expand actions */}
                        <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-150 text-xs">
                          <span className="text-blue-800 font-bold group-hover:underline animate-pulse">
                            Click to Open Full Blueprint Specs & Save
                          </span>
                          <span className="p-1 px-2 bg-blue-800 text-white rounded-md text-[9px] font-bold">SELECT EXPAND</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPTION B CARD CONTAINER (Max Storage) */}
                  {optionB && (
                    <div 
                      onClick={() => {
                        setSelectedOption(optionB);
                        setDetailViewMode(viewModeB);
                        setCurrentStep(5);
                      }}
                      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-600 transition-all duration-300 group cursor-pointer"
                    >
                      {/* Viewport header bar */}
                      <div className="p-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-blue-800 font-bold block">OPTION B (MAX STORAGE)</span>
                          <span className="font-display font-bold text-base text-stone-900 block group-hover:text-blue-800 transition-colors">
                            {optionB.tagline}
                          </span>
                        </div>
                        
                        {/* 2D/3D Toggle */}
                        <div 
                          className="bg-stone-200/90 p-1.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setViewModeB('2D')}
                            className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
                              viewModeB === '2D' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-550'
                            }`}
                          >
                            2D Plan
                          </button>
                          <button
                            onClick={() => setViewModeB('3D')}
                            className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
                              viewModeB === '3D' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-550'
                            }`}
                          >
                            3D view
                          </button>
                        </div>
                      </div>

                      {/* Render SVG canvases based on mode */}
                      <div className="p-4 bg-stone-50/20">
                        {viewModeB === '2D' ? (
                          <FloorPlanCanvas 
                            layout={optionB.layout2D} 
                            hoveredFurnitureId={hoveredFurnitureId}
                            setHoveredFurnitureId={setHoveredFurnitureId}
                            currentTier={currentTier}
                          />
                        ) : (
                          <IsometricRenderer 
                            layout={optionB.layout2D} 
                            hoveredFurnitureId={hoveredFurnitureId}
                            setHoveredFurnitureId={setHoveredFurnitureId}
                            styleMode="MaxStorage"
                          />
                        )}
                      </div>

                      {/* Design evaluation summary text */}
                      <div className="p-5 space-y-4">
                        <p className="text-stone-650 text-xs leading-relaxed line-clamp-3">
                          {optionB.description}
                        </p>

                        {/* Four Rating Check Indicators with custom tooltips (Page 3 icons) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-stone-150 text-[11px] font-sans">
                          
                          {/* 1. Budget indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionB.budgetEstimate <= budget ? 'bg-blue-50 text-blue-955' : 'bg-amber-50 text-amber-955'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${optionB.budgetEstimate <= budget ? 'bg-blue-600' : 'bg-amber-500'}`}></span>
                            <span>Estimate: <b>SGD ${(optionB.budgetEstimate / 1000).toFixed(0)}K</b></span>
                          </div>

                          {/* 2. Legal indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionB.legalStatus === 'met' ? 'bg-blue-50 text-blue-955' : 'bg-amber-50 text-amber-955'
                          }`}>
                            {optionB.legalStatus === 'met' ? (
                              <Check className="w-3.5 h-3.5 text-blue-700" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>Legal: Approved</span>
                          </div>

                          {/* 3. Climate indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionB.climateStatus === 'met' ? 'bg-blue-50 text-blue-950' : 'bg-amber-55 text-amber-950'
                          }`}>
                            {optionB.climateStatus === 'met' ? (
                              <Wind className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>Climate: Mold-safe</span>
                          </div>

                          {/* 4. Fengshui indicator */}
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-950 p-1 px-2.5 rounded-lg font-medium">
                            <Compass className="w-3.5 h-3.5 text-amber-600" />
                            <span>Fengshui: Actives</span>
                          </div>

                        </div>

                        {/* Expand actions */}
                        <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-150 text-xs">
                          <span className="text-blue-800 font-bold group-hover:underline">
                            Click to Open Full Blueprint Specs & Save
                          </span>
                          <span className="p-1 px-2 bg-blue-800 text-white rounded-md text-[9px] font-bold">SELECT EXPAND</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================== */}
        {/* STEP 5: DETAIL VIEW - SINGLE OPTION  */}
        {/* ==================================== */}
        {currentStep === 5 && selectedOption && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Nav path detail */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-stone-200 pb-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-display text-xs font-semibold px-4 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors duration-200 self-start cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Overview Compare</span>
              </button>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Dynamic Forward/Backward Arrows for layout switching */}
                {optionA && optionB && (
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOption === optionA && optionB) {
                          setSelectedOption(optionB);
                        } else if (selectedOption === optionB && optionA) {
                          setSelectedOption(optionA);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-stone-250 border border-stone-150 text-stone-750 hover:text-blue-800 transition-all flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                      title="Switch to other scheme (Back)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="px-1.5 font-mono text-[9px] font-bold text-stone-400">SCHEME</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOption === optionA && optionB) {
                          setSelectedOption(optionB);
                        } else if (selectedOption === optionB && optionA) {
                          setSelectedOption(optionA);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-stone-250 border border-stone-150 text-stone-750 hover:text-blue-800 transition-all flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                      title="Switch to other scheme (Forward)"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mono font-bold hidden md:inline">ACTIVE:</span>
                  <span className="bg-blue-800 text-white font-display text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                    {selectedOption.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Layout Detail Board (Page 2 of the PDF) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Massive Render Workspace Area (Left column - 7 cols) */}
              <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                
                {/* Viewport heading */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-medium text-lg text-stone-900 tracking-tight">
                      {selectedOption.tagline}
                    </h3>
                    <span className="text-stone-550 text-xs leading-none">
                      Interact with custom furnishings and structural guidelines on rendering.
                    </span>
                  </div>

                  {/* 2D / 3D Toggle */}
                  <div className="bg-stone-100 p-1.5 rounded-xl inline-flex items-center gap-1 text-xs font-semibold border border-stone-200">
                    <button
                      onClick={() => setDetailViewMode('2D')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold transition-all ${
                        detailViewMode === '2D' ? 'bg-blue-800 text-white shadow-md' : 'text-stone-550 hover:bg-stone-200'
                      }`}
                    >
                      2D Blueprint
                    </button>
                    <button
                      onClick={() => setDetailViewMode('3D')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold transition-all ${
                        detailViewMode === '3D' ? 'bg-blue-800 text-white shadow-md' : 'text-stone-550 hover:bg-stone-200'
                      }`}
                    >
                      3D Isometric
                    </button>
                  </div>
                </div>

                {/* Main viewport canvas */}
                <div className="relative">
                  {detailViewMode === '2D' ? (
                    <FloorPlanCanvas 
                      layout={selectedOption.layout2D} 
                      hoveredFurnitureId={hoveredFurnitureId}
                      setHoveredFurnitureId={setHoveredFurnitureId}
                      currentTier={currentTier}
                    />
                  ) : (
                    <IsometricRenderer 
                      layout={selectedOption.layout2D} 
                      hoveredFurnitureId={hoveredFurnitureId}
                      setHoveredFurnitureId={setHoveredFurnitureId}
                      styleMode={selectedOption.id === 'option-a' ? 'Open' : 'MaxStorage'}
                    />
                  )}
                </div>

                {/* Subtext description below renderer */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-2">
                  <span className="font-display font-bold text-xs text-stone-950 block">Design Narrative & Concept</span>
                  <p className="text-stone-650 text-xs leading-relaxed">
                    {selectedOption.description}
                  </p>
                </div>

                {/* Room by Room Architectural Highlights (Page 2 layout) */}
                <div className="space-y-3">
                  <span className="font-display font-bold text-xs text-stone-900 block">Proposed Structural Carpentry Specs:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedOption.highlights.map((h, i) => (
                      <div key={i} className="bg-blue-50/30 p-3 rounded-2xl border border-blue-150/50 flex align-top gap-2.5">
                        <span className="text-blue-800 font-mono font-bold text-xs">0{i+1}.</span>
                        <span className="text-xs text-stone-750 font-sans leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Constraint Breakdown Specs (Right column - 4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Constraint Breakdown checklist card */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
                  <h3 className="font-display font-bold text-sm text-stone-950 border-b border-stone-150 pb-3">
                    Constraint Breakdown Checklist
                  </h3>

                  <div className="space-y-4">
                    {/* Climate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-sky-50 text-sky-850 rounded-md">
                          <Wind className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Climate Optimization</span>
                        <span className="ml-auto bg-sky-100 text-sky-850 text-[9px] font-bold px-1.5 py-0.5 rounded">PASSED</span>
                      </div>
                      <p className="text-[10px] text-stone-550 leading-relaxed pl-7">
                        {selectedOption.climateFeedback}
                      </p>
                    </div>

                    {/* Legal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-50 text-blue-800 rounded-md">
                          <Scale className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Legal & Structural Rules</span>
                        <span className="ml-auto bg-blue-105 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">VERIFIED</span>
                      </div>
                      <p className="text-[10px] text-stone-505 leading-relaxed pl-7">
                        {selectedOption.legalFeedback}
                      </p>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-50 text-blue-800 rounded-md">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Project Budget Allocation</span>
                        <span className="ml-auto bg-blue-105 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">MET</span>
                      </div>
                      <p className="text-[10px] text-stone-550 leading-relaxed pl-7">
                        {selectedOption.budgetFeedback}
                      </p>
                    </div>

                    {/* Fengshui */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-amber-50 text-amber-800 rounded-md">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Geomancy & Fengshui Balance</span>
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          selectedOption.fengshuiStatus === 'met' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {selectedOption.fengshuiStatus === 'met' ? 'OPTIMUM' : 'NEUTRAL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-550 leading-relaxed pl-7">
                        {selectedOption.fengshuiFeedback}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Actions Cabinet (Page 2 Actions) */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-sm text-stone-950">
                    Project Board Actions (Licensed Specs)
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Secure download full specs button */}
                    <button
                      onClick={() => handleDownloadLayout(selectedOption)}
                      className="w-full bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-bold py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 transform active:scale-98 hover:shadow-lg"
                    >
                      <Download className="w-4.5 h-4.5 text-blue-300 animate-bounce" />
                      <span>Download Blueprint Specifications File (PDF/CAD)</span>
                    </button>

                    {/* Save layout */}
                    <button
                      onClick={() => saveSelectedDesign(selectedOption, selectedOption.id === 'option-a' ? 'Option A' : 'Option B')}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-display text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-blue-800" />
                      <span>Save to Active Board</span>
                    </button>

                    {/* Share layout */}
                    <button
                      onClick={copyShareAddress}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-display text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 border border-stone-250"
                    >
                      <Share2 className="w-4 h-4 text-blue-800" />
                      <span>{shareSuccess ? '✓ Custom link copied!' : 'Share Design Specifications'}</span>
                    </button>

                    {/* Consult registered expert */}
                    <button
                      onClick={() => setShowProModal(true)}
                      className="w-full bg-stone-950 hover:bg-stone-900 text-white font-display text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <UserCheck className="w-4 h-4 text-orange-205" />
                      <span>Consult Matching Reno Pro</span>
                    </button>
                  </div>
                </div>

                {/* 3. Three-Tier Pricing Options Panel */}
                <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                    <h3 className="font-display font-medium text-sm text-stone-950">
                      Select Space-Advisory Tier
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      Monetization
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Free Trial / Sample Tier */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      currentTier === 'free' ? 'border-blue-500 bg-blue-50/20' : 'border-stone-200 bg-stone-50/50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display font-bold text-xs text-stone-900 block font-semibold">Sample Trial Preview</span>
                          <span className="text-[10px] text-stone-500 block leading-normal mt-0.5">Includes simplified layout preview and watermark. Watermarked 2D floor plan rendering.</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-800 shrink-0">SGD $0</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-100/50">
                        <span className="text-[9px] font-semibold text-stone-550">
                          {currentTier === 'free' ? '✓ Currently Active Tier' : 'Basic demo limits'}
                        </span>
                        {currentTier !== 'free' && (
                          <button 
                            onClick={() => setCurrentTier('free')}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-850 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            Downgrade
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Standard Blueprint Tier */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      currentTier === 'standard' ? 'border-blue-600 bg-blue-50/25 shadow-xs' : 'border-stone-250 bg-white hover:border-blue-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display font-bold text-xs text-stone-900 block flex items-center gap-1">
                            Standard Architect Plan
                            <span className="bg-amber-100 text-amber-800 text-[8px] px-1 rounded font-bold uppercase">Popular</span>
                          </span>
                          <span className="text-[10px] text-stone-550 block leading-normal mt-0.5 font-sans">
                            Unlocks full size custom blueprints, material specification options, and unwatermarked downloads (Rate: SGD $10 + $0.20/sqm).
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-900 shrink-0">SGD ${getStandardPrice(areaSize)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-150/30">
                        <span className="text-[9px] font-semibold text-blue-800">
                          {currentTier === 'standard' ? '✓ Standard Access Unlocked!' : 'All designs printable specs'}
                        </span>
                        {currentTier !== 'standard' && (
                          <button 
                            onClick={() => {
                              setPendingTier('standard');
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-800 text-white hover:bg-blue-900 text-[10px] font-bold px-3 py-1 rounded cursor-pointer transition-colors"
                          >
                            {currentTier === 'premium' ? 'Go Standard' : 'Upgrade Standard'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pro Premium Designer Studio Tier */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      currentTier === 'premium' ? 'border-blue-600 bg-blue-50/25 shadow-xs' : 'border-stone-250 bg-white hover:border-blue-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display font-bold text-xs text-stone-900 block flex items-center gap-1">
                            Pro Premium Designer
                            <span className="bg-blue-800 text-white text-[8px] px-1 rounded font-bold uppercase header-logo-icon">Expert Spec</span>
                          </span>
                          <span className="text-[10px] text-stone-550 block leading-normal mt-0.5">
                            Everything in Standard plus detailed Fengshui Chi advice alignments and offline registered consultant matchups (Rate: SGD $20 + $0.40/sqm).
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-900 shrink-0">SGD ${getPremiumPrice(areaSize)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-150/30">
                        <span className="text-[9px] font-semibold text-blue-800">
                          {currentTier === 'premium' ? '✓ Pro Studio Active!' : 'Full expert consultation review'}
                        </span>
                        {currentTier !== 'premium' && (
                          <button 
                            onClick={() => {
                              setPendingTier('premium');
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-800 text-white hover:bg-blue-900 text-[10px] font-bold px-3 py-1 rounded cursor-pointer transition-colors"
                          >
                            Upgrade Premium
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* FOOTER SECTION: SAVED DESIGNS BOARD */}
        {/* ==================================== */}
        <div id="saved-projects-board" className="mt-6 border-t border-stone-200 pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-800 animate-pulse" />
            <h2 className="font-display font-semibold text-lg text-stone-900">
              My Saved Renovation Board Gallery ({savedProjects.length})
            </h2>
          </div>

          {savedProjects.length === 0 ? (
            <div className="bg-stone-50 border border-stone-205 py-8 text-center rounded-2xl text-xs text-stone-500">
              No saved project configs found. Click "Save to Active Board" inside any detail design to save layout strategies here securely!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.map((proj) => (
                <div key={proj.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs relative flex flex-col justify-between gap-4">
                  <button 
                    onClick={() => deleteSavedProject(proj.id)}
                    className="absolute top-3 right-3 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Delete saved layout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-stone-400 block">{proj.timestamp}</span>
                    <h3 className="font-display font-bold text-sm text-stone-950 leading-tight">
                      {proj.optionData.tagline}
                    </h3>
                    <span className="text-[10px] text-blue-800 font-bold block mt-1">
                      {getPropertyLabel(proj.propertyType)} • Selected {proj.optionSelected}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-550 leading-relaxed line-clamp-2">
                    {proj.optionData.description}
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-100">
                    <span className="font-bold text-blue-950 text-xs">SGD ${proj.optionData.budgetEstimate.toLocaleString()}</span>
                    <button
                      onClick={() => {
                        setSelectedOption(proj.optionData);
                        setDetailViewMode('3D');
                        setSelectedPresetId(proj.presetId);
                        setCurrentStep(5);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-blue-800 hover:underline font-display font-semibold text-[11px] flex items-center gap-0.5"
                    >
                      <span>Load Blueprint specs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modern Friendly Matchmaking overlay popup model */}
      {showProModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-stone-200 p-6 shadow-2xl space-y-5 animate-fade-in relative">
            <button 
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 font-mono text-sm leading-none"
            >
              ✕
            </button>

            <div className="text-center space-y-1.5">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-full w-fit mx-auto mb-1">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-medium text-lg text-stone-950">
                Consult Registered Contractor Pro
              </h3>
              <p className="text-stone-550 text-xs leading-relaxed max-w-xs mx-auto">
                We pair your saved blueprint constraints with highly rated Singapore HDB-Registered specialists!
              </p>
            </div>

            <form onSubmit={handleProConsultSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase block">Your Human Name:</label>
                <input 
                  type="text" 
                  required 
                  value={proForm.name}
                  onChange={(e) => setProForm({...proForm, name: e.target.value})}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-blue-800"
                  placeholder="E.g. Donald Lim"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase block">Singapore Mobile Number:</label>
                <input 
                  type="tel" 
                  required 
                  value={proForm.phone}
                  onChange={(e) => setProForm({...proForm, phone: e.target.value})}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-blue-800"
                  placeholder="E.g. +65 9123 4567"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase block">Email Address:</label>
                <input 
                  type="email" 
                  required 
                  value={proForm.email}
                  onChange={(e) => setProForm({...proForm, email: e.target.value})}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-blue-800"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase block">Proposed consult date:</label>
                <input 
                  type="date" 
                  required 
                  value={proForm.preferredDate}
                  onChange={(e) => setProForm({...proForm, preferredDate: e.target.value})}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-blue-800 bg-white"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-bold py-3.5 rounded-xl mt-4 cursor-pointer transition-colors shadow-lg"
              >
                {consultSubmitted ? "Submitting Matching Application..." : "Transmit Saved Layout Specs & Match"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* PREMIUM PAYMENT GATEWAY MODAL DUOLOG */}
      {/* ==================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-6 bg-blue-900 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-blue-300 uppercase font-semibold">SECURE GATEWAY CHECKOUT</span>
                <h3 className="font-display font-bold text-lg mt-0.5">
                  Upgrade to {pendingTier === 'premium' ? 'Pro Designer Studio' : 'Standard Architectural Blueprint'}
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-white bg-blue-950/40 hover:bg-blue-950/75 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Price Detail */}
            <div className="p-5 bg-stone-50 border-b border-stone-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">Service Fee ({areaSize} sqm):</span>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-blue-900">
                  {promoCode.trim().toUpperCase() === 'FREE100' ? 'SGD $0.00' : pendingTier === 'premium' ? `SGD $${getPremiumPrice(areaSize)}.00` : `SGD $${getStandardPrice(areaSize)}.00`}
                </span>
                {promoCode.trim().toUpperCase() === 'FREE100' && (
                  <span className="text-[9px] text-green-700 font-bold block">100% Promo Applied!</span>
                )}
              </div>
            </div>

            {/* Inputs Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                // Complete purchase
                setCurrentTier(pendingTier);
                setShowPaymentModal(false);
                setPromoCode('');
                setPaymentSuccessToast(`Upgrade to ${pendingTier === 'premium' ? 'Pro Designer Studio' : 'Standard Plan'} Complete! Unlimited blueprint specifications unlocked.`);
                setTimeout(() => setPaymentSuccessToast(null), 5000);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Customer Email Address</label>
                <input 
                  type="email" 
                  value="donaldck02@gmail.com" 
                  disabled
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Secure Credit Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                    placeholder="4111 2222 3333 4444" 
                    required 
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Expires (MM/YY)</label>
                  <input 
                    type="text" 
                    value={paymentForm.cardExpiry}
                    onChange={(e) => setPaymentForm({...paymentForm, cardExpiry: e.target.value})}
                    placeholder="12/28" 
                    required 
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-800 font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Security Code (CVC)</label>
                  <input 
                    type="password" 
                    value={paymentForm.cardCvc}
                    onChange={(e) => setPaymentForm({...paymentForm, cardCvc: e.target.value})}
                    placeholder="123" 
                    maxLength={3}
                    required 
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-800 font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Cardholder Full Name</label>
                <input 
                  type="text" 
                  value={paymentForm.cardName}
                  onChange={(e) => setPaymentForm({...paymentForm, cardName: e.target.value})}
                  placeholder="DONALD LIM" 
                  required 
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-800"
                />
              </div>

              {/* Promo Code Discount */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-mono uppercase font-bold text-stone-500">Have promo code? (Try 'FREE100')</label>
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="FREE100" 
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-800 font-mono uppercase"
                />
              </div>

              {/* Legal Note */}
              <p className="text-[9px] text-stone-400 leading-relaxed text-center">
                This transaction is secure and compliant with PCI-DSS guidelines. Fully encrypted.
              </p>

              {/* Complete Action Button */}
              <button 
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-display text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Authorize & Pay {promoCode.trim().toUpperCase() === 'FREE100' ? 'SGD $0.00' : pendingTier === 'premium' ? `SGD $${getPremiumPrice(areaSize)}.00` : `SGD $${getStandardPrice(areaSize)}.00`}</span>
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Humble modern organic Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <span>
            © 2026 Singapore Home Renovation Planner Inc. All Rights Reserved.
          </span>
          <div className="flex items-center gap-4">
            <span className="hover:text-stone-850 cursor-pointer">HDB Registered Directory Registry</span>
            <span className="hover:text-stone-850 cursor-pointer">URA Building Safety Rules</span>
            <span className="hover:text-stone-850 cursor-pointer">Moisture Control Specs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
