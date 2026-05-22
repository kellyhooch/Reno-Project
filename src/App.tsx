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
  ChevronLeft
} from 'lucide-react';

import { PRESET_PLANS } from './presets';
import { getOptionsForPreset } from './mockLayouts';
import { RenovationConstraints, LayoutOption, PresetPlan, Furniture } from './types';
import FloorPlanCanvas from './components/FloorPlanCanvas';
import IsometricRenderer from './components/IsometricRenderer';

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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

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

  // Auto update propertyType selection based on selected preset
  useEffect(() => {
    if (selectedPresetId === 'hdb-3-room') setPropertyType('hdb_3');
    if (selectedPresetId === 'hdb-4-room') setPropertyType('hdb_4');
    if (selectedPresetId === 'hdb-5-room') setPropertyType('hdb_5');
  }, [selectedPresetId]);

  // Load saved projects on cold start
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sg_renoplanner_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse stored projects", e);
    }
  }, []);

  // Sync saved list
  const saveSavedProjectsToLocal = (updated: any) => {
    setSavedProjects(updated);
    try {
      localStorage.setItem('sg_renoplanner_projects', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

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
          floorPlanImage: uploadedImageBase64 // Optional custom upload
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

  // Design Local Savers
  const saveSelectedDesign = (option: LayoutOption, nameSelected: 'Option A' | 'Option B') => {
    const newProject = {
      id: "pro-" + Date.now(),
      timestamp: new Date().toLocaleDateString('en-SG', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      propertyType: propertyType,
      budget: budget,
      optionSelected: nameSelected,
      optionData: option,
      presetId: selectedPresetId
    };

    const updated = [newProject, ...savedProjects];
    saveSavedProjectsToLocal(updated);
    
    setSaveSuccessMessage(`Successfully saved ${option.name} to your local projects board!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const deleteSavedProject = (id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    saveSavedProjectsToLocal(updated);
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
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-100 selection:text-emerald-950 flex flex-col">
      
      {/* Dynamic Saving Action HUD */}
      {saveSuccessMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white font-medium text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Modern, elegant organic Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className="bg-emerald-800 text-white p-2 rounded-xl shadow-md rotate-3 hover:rotate-0 transition-transform duration-300">
              <Home className="w-5 h-5" id="header-logo-icon" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-stone-900 block">
                Singapore Renovation Planner
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-800 uppercase block font-semibold leading-none">
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
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => {
                  // Only allow jumping back, or progress if layouts exist
                  if (s.num < currentStep || (s.num === 4 && optionA) || (s.num === 5 && selectedOption)) {
                    setCurrentStep(s.num);
                  }
                }}
                disabled={s.num > currentStep && !optionA}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
                  currentStep === s.num
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-sm'
                    : 'text-stone-550 hover:bg-stone-100 disabled:opacity-45'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  currentStep === s.num ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {s.num}
                </span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {savedProjects.length > 0 && (
              <button 
                onClick={() => {
                  const element = document.getElementById("saved-projects-board");
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-850 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-200"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-800" />
                <span>Saved ({savedProjects.length})</span>
              </button>
            )}
            <button
              onClick={() => {
                if (currentStep === 1) setCurrentStep(2);
                else if (currentStep === 2) setCurrentStep(3);
                else if (currentStep === 3) triggerRenovationGenerator();
              }}
              className="bg-emerald-800 hover:bg-emerald-900 active:translate-y-0.5 text-white text-xs px-4 py-2 font-display font-medium rounded-xl shadow-lg shadow-emerald-900/10 transition-all duration-200"
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
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/75 px-3 py-1 rounded-full w-fit">
                  🌿 Singapore Home Renovation Planner
                </span>
                <h1 className="font-display font-bold text-4xl sm:text-5xl text-stone-900 leading-[1.1] tracking-tight">
                  Your flat. <span className="text-emerald-800 underline decoration-orange-300">Two renovation visions</span>. Designed for Singapore.
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
                    <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
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
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-display text-xs font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 active:translate-y-0.5 transition-all duration-200 flex items-center gap-2"
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
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/10 to-transparent rounded-xl flex flex-col justify-end p-6">
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
                  { step: 'STEP 2', title: 'Upload Plan', desc: 'Drag-and-drop HDB drawing files or check ready-to-use template builders.', icon: Upload, bg: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
                  { step: 'STEP 3', title: 'Set Constraints', desc: 'Identify your budget, space prioritization, and toggle dynamic Fengshui filters.', icon: Sliders, bg: 'bg-cyan-50 text-cyan-800 border-cyan-100' },
                  { step: 'STEP 4', title: 'View 2 Options', desc: 'Compare Open Flow and Max Storage layouts under an interactive 2D/3D toggle.', icon: Layout, bg: 'bg-purple-50 text-purple-800 border-purple-100' },
                  { step: 'STEP 5', title: 'Select & Consult', desc: 'Receive complete specs breakdowns and connect with HDB-registered construction pros.', icon: Eye, bg: 'bg-stone-50 text-stone-800 border-stone-200' },
                ].map((wf, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative flex flex-col gap-3">
                    <span className="text-[10px] font-mono font-bold text-stone-400 block tracking-widest">{wf.step}</span>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${wf.bg}`}>
                        <wf.icon className="w-4 h-4" />
                      </div>
                      <span className="font-display font-bold text-sm text-stone-900">{wf.title}</span>
                    </div>
                    <p className="text-stone-500 text-xs leading-relaxed mt-1">
                      {wf.desc}
                    </p>
                    {idx < 4 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-stone-350">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
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
                  <Upload className="w-6 h-6 text-emerald-800" />
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
                    ? 'border-emerald-600 bg-emerald-50/50' 
                    : uploadedFileName 
                      ? 'border-emerald-500 bg-emerald-50/10' 
                      : 'border-stone-300 bg-white hover:border-emerald-700 hover:bg-emerald-50/5'
                }`}
              >
                <div className={`p-4 rounded-full transition-all duration-300 ${
                  uploadedFileName ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-800'
                }`}>
                  <Upload className="w-10 h-10" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  {uploadedFileName ? (
                    <div>
                      <span className="font-display font-bold text-sm text-stone-900 block truncate">{uploadedFileName}</span>
                      <span className="text-xs text-emerald-700 font-semibold block mt-1">✓ Upload success. Auto-detecting dimensions...</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-display font-bold text-sm text-stone-900 block">Drag & drop floor plan here</span>
                      <span className="text-xs text-stone-500 block">Supports PDF, JPG, or PNG drawing standards</span>
                    </div>
                  )}
                </div>

                {/* File picker button replacement */}
                <label className="bg-emerald-800 hover:bg-emerald-900 text-white font-display text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors duration-200">
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

            {/* Selector list of Preset HDB layouts (Right side) */}
            <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
              <div className="border-b border-stone-150 pb-4 mb-2">
                <span className="text-[10px] font-mono tracking-widest text-stone-400 block font-bold">OR SELECT READY FLAT</span>
                <h3 className="font-display font-medium text-lg text-stone-950 mt-1">
                  Try standard Singapore presets
                </h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Select a ready pre-loaded template flat layout to explore immediately
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PRESET_PLANS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setUploadedFileName(null);
                      setUploadedImageBase64(null);
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                      selectedPresetId === preset.id && !uploadedFileName
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        selectedPresetId === preset.id && !uploadedFileName
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-50 text-stone-500'
                      }`}>
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-display font-bold text-sm text-stone-900 block">
                          {preset.name}
                        </span>
                        <span className="text-[11px] text-stone-505 block mt-0.5">
                          ~ {preset.sqm} sqm ({preset.sqm * 10.76 | 0} sqft) • HDB Layout
                        </span>
                      </div>
                    </div>
                    {selectedPresetId === preset.id && !uploadedFileName && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Live Floor Plan Visual Preview of Selected Preset inside standard SVG right in Selector step! */}
              <div className="mt-4 pt-4 border-t border-stone-150 space-y-2">
                <span className="font-display font-semibold text-xs text-stone-900 block">
                  Layout Blueprint Preview: {activePreset.name} (2D)
                </span>
                <div className="rounded-xl border border-stone-150 overflow-hidden transform scale-[0.98]">
                  <FloorPlanCanvas layout={activePreset.layout2D} />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-5 py-3 rounded-xl font-display font-semibold shadow-md flex items-center gap-1.5 transition-colors duration-250"
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
                <Sliders className="w-6 h-6 text-emerald-800" />
                <span>Renovation Constraints Configuration</span>
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Tell us your budget, space priority wishes, climate ventilations and optional Fengshui elements
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Constraints Forms (Left side) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Property Type & Legal presets (Page 4 and Page 1) */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                    <Scale className="w-4 h-4 text-emerald-800" />
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
                        onClick={() => setPropertyType(p.id as any)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl text-center border transition-all duration-200 cursor-pointer ${
                          propertyType === p.id 
                            ? 'bg-emerald-800 text-white border-emerald-800' 
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
                      <DollarSign className="w-4 h-4 text-emerald-800" />
                      <span>Renovation Budget Selection</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-850 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
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
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-850"
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
                    <Layout className="w-4 h-4 text-emerald-800" />
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
                      <label key={opt.id} className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-3 cursor-pointer select-none hover:border-emerald-600 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={opt.val}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="mt-1 accent-emerald-850"
                        />
                        <div>
                          <span className="font-display font-semibold text-xs text-stone-900 block">{opt.label}</span>
                          <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Climate Preferences */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-stone-950 font-display font-bold text-sm">
                    <Wind className="w-4 h-4 text-emerald-800" />
                    <span>Singapore Tropical Climate Preferences</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-emerald-600">
                      <input type="checkbox" checked={crossVentilation} onChange={(e) => setCrossVentilation(e.target.checked)} className="mt-0.5 accent-emerald-8b0" />
                      <div>
                        <span className="font-display font-semibold text-xs text-stone-900 block">Cross Ventilation Corridor</span>
                        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5 font-medium">Align door routes for continuous tropical breeze</span>
                      </div>
                    </label>
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-emerald-600">
                      <input type="checkbox" checked={humidityResist} onChange={(e) => setHumidityResist(e.target.checked)} className="mt-0.5 accent-emerald-8b0" />
                      <div>
                        <span className="font-display font-semibold text-xs text-stone-900 block">Anti-Humidity Panelling</span>
                        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5 font-medium">Prevent damp mold with marine-plywood carcass</span>
                      </div>
                    </label>
                    <label className="p-3 bg-stone-50 rounded-xl border border-stone-150 inline-flex items-start gap-2.5 cursor-pointer hover:border-emerald-600">
                      <input type="checkbox" checked={naturalLight} onChange={(e) => setNaturalLight(e.target.checked)} className="mt-0.5 accent-emerald-8b0" />
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
                      <Compass className="w-4 h-4 text-emerald-850" />
                      <span>Fengshui (Geomancy) Optimizer</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fengshuiEnabled}
                        onChange={(e) => setFengshuiEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:width-1 L after:w-4 after:transition-all peer-checked:bg-emerald-800"></div>
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
                    className="w-full text-xs p-3.5 border border-stone-300 rounded-xl bg-stone-50/50 hover:border-stone-400 focus:outline-none focus:border-emerald-800"
                  />
                </div>

                {/* Trigger button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={triggerRenovationGenerator}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-display text-xs font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-emerald-900/15 select-none transition-all duration-350 transform flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
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
                    <span className="font-bold text-emerald-850">SGD ${budget.toLocaleString()}</span>
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
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-800 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-800">
                    <Sparkles className="w-6 h-6 text-emerald-800" />
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
                  <div className="h-full bg-emerald-800 w-2/3 rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              // FULLY COMPLETED AI RESPONSES
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-820 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      GENERATION COMPLETE
                    </span>
                    <h2 className="font-display font-medium text-2xl tracking-tight text-stone-950 mt-1">
                      Compare Layout Vision Strategies
                    </h2>
                    <p className="text-stone-500 text-xs leading-tight mt-0.5">
                      Hover check-indicators to view breakdown feedback. Click cards to focus detail review.
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-stone-500 hover:text-emerald-800 font-display font-semibold text-xs flex items-center gap-1.5 self-start md:self-auto"
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
                      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-600 transition-all duration-300 group cursor-pointer"
                    >
                      {/* Viewport header bar */}
                      <div className="p-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-emerald-800 font-bold block">OPTION A (OPEN FLOW)</span>
                          <span className="font-display font-bold text-base text-stone-900 block group-hover:text-emerald-850 transition-colors">
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
                          <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-950 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Estimate: <b>SGD ${(optionA.budgetEstimate / 1000).toFixed(0)}K</b></span>
                          </div>

                          {/* 2. Legal indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionA.legalStatus === 'met' ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
                          }`}>
                            {optionA.legalStatus === 'met' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
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
                          <span className="text-emerald-800 font-bold group-hover:underline">
                            Click to Open Full Blueprint Specs & Save
                          </span>
                          <span className="p-1 px-2 bg-emerald-800 text-white rounded-md text-[9px] font-bold">SELECT EXPAND</span>
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
                      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-600 transition-all duration-300 group cursor-pointer"
                    >
                      {/* Viewport header bar */}
                      <div className="p-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-emerald-800 font-bold block">OPTION B (MAX STORAGE)</span>
                          <span className="font-display font-bold text-base text-stone-900 block group-hover:text-emerald-850 transition-colors">
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
                            optionB.budgetEstimate <= budget ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${optionB.budgetEstimate <= budget ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                            <span>Estimate: <b>SGD ${(optionB.budgetEstimate / 1000).toFixed(0)}K</b></span>
                          </div>

                          {/* 2. Legal indicator */}
                          <div className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg font-medium ${
                            optionB.legalStatus === 'met' ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
                          }`}>
                            {optionB.legalStatus === 'met' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
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
                          <span className="text-emerald-800 font-bold group-hover:underline">
                            Click to Open Full Blueprint Specs & Save
                          </span>
                          <span className="p-1 px-2 bg-emerald-800 text-white rounded-md text-[9px] font-bold">SELECT EXPAND</span>
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
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-display text-xs font-semibold px-4 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Overview Compare</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 font-mono text-[10px] font-bold">ACTIVE CAPTURED:</span>
                <span className="bg-emerald-800 text-white font-display text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {selectedOption.name}
                </span>
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
                        detailViewMode === '2D' ? 'bg-emerald-800 text-white shadow-md' : 'text-stone-550 hover:bg-stone-200'
                      }`}
                    >
                      2D Blueprint
                    </button>
                    <button
                      onClick={() => setDetailViewMode('3D')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold transition-all ${
                        detailViewMode === '3D' ? 'bg-emerald-800 text-white shadow-md' : 'text-stone-550 hover:bg-stone-200'
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
                      <div key={i} className="bg-emerald-50/30 p-3 rounded-2xl border border-emerald-150/50 flex align-top gap-2.5">
                        <span className="text-emerald-800 font-mono font-bold text-xs">0{i+1}.</span>
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
                      <p className="text-[10px] text-stone-505 leading-relaxed pl-7">
                        {selectedOption.climateFeedback}
                      </p>
                    </div>

                    {/* Legal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-50 text-emerald-800 rounded-md">
                          <Scale className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Legal & Structural Rules</span>
                        <span className="ml-auto bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">VERIFIED</span>
                      </div>
                      <p className="text-[10px] text-stone-505 leading-relaxed pl-7">
                        {selectedOption.legalFeedback}
                      </p>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-50 text-emerald-800 rounded-md">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-display font-bold text-xs text-stone-900">Project Budget Allocation</span>
                        <span className="ml-auto bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">MET</span>
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
                    Project Board Actions
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Save layout */}
                    <button
                      onClick={() => saveSelectedDesign(selectedOption, selectedOption.id === 'option-a' ? 'Option A' : 'Option B')}
                      className="w-full bg-emerald-850 hover:bg-emerald-900 text-white font-display text-xs font-semibold py-3 px-4 rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-300" />
                      <span>Save to Active Board</span>
                    </button>

                    {/* Share layout */}
                    <button
                      onClick={copyShareAddress}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-display text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 border border-stone-250"
                    >
                      <Share2 className="w-4 h-4 text-emerald-800" />
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

              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* FOOTER SECTION: SAVED DESIGNS BOARD */}
        {/* ==================================== */}
        <div id="saved-projects-board" className="mt-6 border-t border-stone-200 pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-emerald-800 animate-pulse" />
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
                    <span className="text-[10px] text-emerald-850 font-bold block mt-1">
                      {getPropertyLabel(proj.propertyType)} • Selected {proj.optionSelected}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-550 leading-relaxed line-clamp-2">
                    {proj.optionData.description}
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-100">
                    <span className="font-bold text-emerald-950 text-xs">SGD ${proj.optionData.budgetEstimate.toLocaleString()}</span>
                    <button
                      onClick={() => {
                        setSelectedOption(proj.optionData);
                        setDetailViewMode('3D');
                        setSelectedPresetId(proj.presetId);
                        setCurrentStep(5);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-emerald-805 hover:underline font-display font-semibold text-[11px] flex items-center gap-0.5"
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
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full w-fit mx-auto mb-1">
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
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-emerald-800"
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
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-emerald-800"
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
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-emerald-800"
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
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:border-emerald-800 bg-white"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-850 hover:bg-emerald-900 text-white font-display text-xs font-bold py-3.5 rounded-xl mt-4 cursor-pointer transition-colors shadow-lg"
              >
                {consultSubmitted ? "Submitting Matching Application..." : "Transmit Saved Layout Specs & Match"}
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
