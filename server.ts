/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads with high limit for images
app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client lazily to prevent crashing on server startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

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

// API Endpoint for Renovation Analysis
app.post('/api/analyze-renovation', async (req, res) => {
  try {
    const { propertyType, budget, spaceConstraints, climatePrefs, fengshuiEnabled, customNotes, floorPlanImage, areaSize = 90 } = req.body;

    console.log(`Received renovation request for ${getPropertyLabel(propertyType)} (${areaSize} sqm) with budget $${budget}`);

    // Core prompts describing the context and formatting instructions
    const systemPrompt = `You are an expert Singapore interior designer and renovation consultant specializing in HDB, condo, and URA guidelines.
You evaluate floor plans and space constraints, and produce two separate custom design strategies in high-priority JSON format:
Option A focuses on 'Open Flow' (spaciousness, open-concept kitchen, cross-ventilation, maximizing natural light).
Option B focuses on 'Max Storage' (built-in carpentry, storage efficiency, multi-functional furniture, study/work-from-home nooks).

Analyze the user's specific guidelines:
- Property Type: ${getPropertyLabel(propertyType)}
- Total Floor Area: ${areaSize} sqm (~${Math.round(areaSize * 10.76)} sqft)
- Selected Budget: $${budget} (SGD)
- Space Demands Requested: ${Object.entries(spaceConstraints).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Standard layout'}
- Climate Preferences: ${Object.entries(climatePrefs).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Standard ventilation'}
- Fengshui Consultation: ${fengshuiEnabled ? 'ENABLED (Crucial)' : 'DISABLED'}
- User additional goals: "${customNotes || 'None provided'}"

For each of the two options (A and B), you must generate custom Singapore-relevant architectural review feedback (Budget, Legal, Climate, Fengshui analysis).
Use accurate local Singapore context:
- Mention specific HDB housing guidelines (like HDB hacking permits, do not demo load-bearing columns, strict wet-area toilet relocation, service yard pipes access).
- Mention local context: URA, MCST condo board approvals (if property is Condo), natural sea breeze / South-East breeze, high tropical humidity, open vs enclosed kitchen considerations.
- If Fengshui is enabled, mention Bagua orientations, entry gate versus stove alignment, and headboard facing relative to the main door.
- If Fengshui is disabled, keep the analysis neutral but helpful.

Your response must strictly conform to the expected JSON schema. Do not include any standard conversational elements or markdown wrapping unless in the output text fields. Keep estimates logical: Option A might be cheaper; Option B with custom storage cabinetry is usually more expensive. Ensure budgetStatus is 'met' if within budget or 'warning' if too tight.`;

    // Construct request parts
    const parts: any[] = [{ text: systemPrompt }];

    // If an image was submitted (uploaded file or drawn SVG preset description)
    if (floorPlanImage && floorPlanImage.startsWith('data:image')) {
      const base64Data = floorPlanImage.substring(floorPlanImage.indexOf(',') + 1);
      const mimeType = floorPlanImage.substring(floorPlanImage.indexOf(':') + 1, floorPlanImage.indexOf(';'));
      console.log(`Including floor plan image of type ${mimeType} in Gemini request`);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    } else {
      parts.push({ text: "Use the standard Singapore floor plan layout templates to formulate recommendations." });
    }

    const response = await getGeminiClient().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['optionA', 'optionB'],
          properties: {
            optionA: {
              type: Type.OBJECT,
              required: ['tagline', 'description', 'budgetEstimate', 'budgetStatus', 'budgetFeedback', 'legalStatus', 'legalFeedback', 'climateStatus', 'climateFeedback', 'fengshuiStatus', 'fengshuiFeedback', 'highlights'],
              properties: {
                tagline: { type: Type.STRING, description: 'Creative punchy tagline for Option A. E.g. "Spacious Loft Atmosphere"' },
                description: { type: Type.STRING, description: 'Detailed architecture description highlighting how spaces are open, walls are removed, etc.' },
                budgetEstimate: { type: Type.INTEGER, description: 'Estimated project cost in SGD' },
                budgetStatus: { type: Type.STRING, enum: ['met', 'warning'], description: 'Whether the budget meets constraints' },
                budgetFeedback: { type: Type.STRING, description: 'Specific comments about cost saving or premium materials' },
                legalStatus: { type: Type.STRING, enum: ['met', 'warning'], description: 'Compliance status under Singapore HDB/URA guidelines' },
                legalFeedback: { type: Type.STRING, description: 'Detailed legal constraints warning (HDB permits, wet-area rules, structural wall checks)' },
                climateStatus: { type: Type.STRING, enum: ['met', 'warning'], description: 'Climate optimization checklist status' },
                climateFeedback: { type: Type.STRING, description: 'Ventilation and moisture resistance suggestions' },
                fengshuiStatus: { type: Type.STRING, enum: ['met', 'warning', 'neutral'], description: 'Geomancy evaluation status' },
                fengshuiFeedback: { type: Type.STRING, description: 'Analysis of bedroom orientations, entrance flows, door facing' },
                highlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 4-5 major custom built-in architectural additions or wall changes'
                }
              }
            },
            optionB: {
              type: Type.OBJECT,
              required: ['tagline', 'description', 'budgetEstimate', 'budgetStatus', 'budgetFeedback', 'legalStatus', 'legalFeedback', 'climateStatus', 'climateFeedback', 'fengshuiStatus', 'fengshuiFeedback', 'highlights'],
              properties: {
                tagline: { type: Type.STRING, description: 'Creative punchy tagline for Option B. E.g. "Maximized Cabinets & Cozy Reading Accents"' },
                description: { type: Type.STRING, description: 'Detailed architectural description prioritizing clever space saving and joinery.' },
                budgetEstimate: { type: Type.INTEGER, description: 'Estimated project cost in SGD' },
                budgetStatus: { type: Type.STRING, enum: ['met', 'warning'] },
                budgetFeedback: { type: Type.STRING },
                legalStatus: { type: Type.STRING, enum: ['met', 'warning'] },
                legalFeedback: { type: Type.STRING },
                climateStatus: { type: Type.STRING, enum: ['met', 'warning'] },
                climateFeedback: { type: Type.STRING },
                fengshuiStatus: { type: Type.STRING, enum: ['met', 'warning', 'neutral'] },
                fengshuiFeedback: { type: Type.STRING },
                highlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const outputText = response.text || '{}';
    const parsedData = JSON.parse(outputText);

    res.json({
      success: true,
      options: parsedData
    });

  } catch (error: any) {
    console.error('Gemini Analysis Server Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during Gemini analysis'
    });
  }
});

// --- COMMENTS & DISCUSSION DATABASE (SERVER-PERSISTED & SUPABASE EXTENDED) ---
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const COMMENTS_FILE = path.join(process.cwd(), 'comments.json');

// Initialize comments file with default content if it doesn't exist
const DEFAULT_COMMENTS = [
  {
    id: "comment-1",
    name: "Kelvin Tan",
    role: "🎨 Interior Designer",
    text: "The HDB 4-room smart layout options are extremely solid! I highly recommend toggling on the cross-ventilation option here if you want to keep cooking smells out of the living area.",
    likes: 14,
    timestamp: "2 hours ago",
    replies: [
      {
        id: "reply-1",
        name: "Alex Goh",
        role: "🏡 Homeowner",
        text: "This saved me! Our kitchen doesn't face standard layout ventilation and this gave us the idea to use standard ceiling extraction ducts.",
        timestamp: "1 hour ago"
      }
    ]
  },
  {
    id: "comment-2",
    name: "Evelyn Lim",
    role: "🏡 Homeowner",
    text: "Loved the 3-room mockup preview! We managed to maximize our study corner by following the template's compact sliding doors advice. Fits our hybrid work schedules perfectly without sacrificing general space.",
    likes: 9,
    timestamp: "4 hours ago",
    replies: []
  },
  {
    id: "comment-3",
    name: "Marcus Goh",
    role: "🛠️ Contractor",
    text: "Remember to coordinate dry/wet plumbing limits before choosing open kitchen options! Some HDB layouts require custom pipe relocations which might stretch your renovation budget.",
    likes: 11,
    timestamp: "1 day ago",
    replies: []
  }
];

// Supabase Connection initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
let isCommentsTableReady = false;

// Pull live comments from Supabase if active
async function syncCommentsFromSupabase() {
  if (supabase && isCommentsTableReady) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*');
      
      if (!error && Array.isArray(data)) {
        // Map fields to standard interface
        const parsed = data.map((item: any) => ({
          id: String(item.id),
          name: item.name || 'Singapore Renovator',
          role: item.role || '🏡 Homeowner',
          text: item.text || '',
          likes: Number(item.likes || 0),
          timestamp: item.timestamp || 'Just now',
          replies: Array.isArray(item.replies) ? item.replies : []
        }));

        // Sort comments: newer or custom IDs first
        parsed.sort((a, b) => {
          // Attempt parsing timestamps or use basic string/id descending sorting
          return b.id.localeCompare(a.id);
        });

        if (parsed.length > 0) {
          memoryComments = parsed;
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch comments from Supabase:", err.message);
    }
  }
}

// Push/Upsert a comment to Supabase if active
async function saveCommentToSupabase(comment: any) {
  if (supabase && isCommentsTableReady) {
    try {
      const { error } = await supabase.from('comments').upsert({
        id: comment.id,
        name: comment.name,
        role: comment.role,
        text: comment.text,
        likes: comment.likes || 0,
        replies: comment.replies || [],
        timestamp: comment.timestamp
      });
      if (error) {
        console.error("Supabase comments upsert error:", error.message);
      }
    } catch (err: any) {
      console.error("Supabase comments upsert critical error:", err.message);
    }
  }
}

// Initializer to check/verify Supabase tables exist
async function initSupabaseComments() {
  if (!supabase) {
    console.log("Supabase is not configured yet. Falling back to local/memory comments.");
    return;
  }
  try {
    const { error } = await supabase.from('comments').select('id').limit(1);
    if (!error) {
      isCommentsTableReady = true;
      console.log("Supabase 'comments' table is live and listening!");
      
      // Auto seed if database is empty on start
      const { data, error: countErr } = await supabase.from('comments').select('id');
      if (!countErr && (!data || data.length === 0)) {
        console.log("Supabase comments table is empty. Seeding DEFAULT_COMMENTS...");
        for (const item of DEFAULT_COMMENTS) {
          await supabase.from('comments').insert({
            id: item.id,
            name: item.name,
            role: item.role,
            text: item.text,
            likes: item.likes,
            timestamp: item.timestamp,
            replies: item.replies
          });
        }
      }
      await syncCommentsFromSupabase();
    } else {
      console.log("Supabase 'comments' table not found on database. Sync will fall back to local/memory comments until the table is created in Supabase Dashboard.");
    }
  } catch (err: any) {
    console.warn("Error testing Supabase database tables configuration on boot:", err.message);
  }
}

function readComments(): any[] {
  return memoryComments;
}

function writeComments(comments: any[]) {
  memoryComments = comments;
  try {
    fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8', (err) => {
      if (err) {
        console.error("Error writing comments JSON file:", err.message);
      }
    });
  } catch (err: any) {
    console.error("Async write attempt error:", err.message);
  }
}

// In-Memory cache initialized on server load
let memoryComments: any[] = [];

try {
  if (fs.existsSync(COMMENTS_FILE)) {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryComments = parsed;
    } else {
      memoryComments = JSON.parse(JSON.stringify(DEFAULT_COMMENTS));
    }
  } else {
    memoryComments = JSON.parse(JSON.stringify(DEFAULT_COMMENTS));
  }
} catch (e) {
  console.warn("Error reading comments file on startup. Using default seed array.", e);
  memoryComments = JSON.parse(JSON.stringify(DEFAULT_COMMENTS));
}

// Get all comments with live sync
app.get('/api/comments', async (req, res) => {
  try {
    if (!isCommentsTableReady && supabase) {
      // Periodic check inside the API call to detect when user runs the schema migrate script
      const { error } = await supabase.from('comments').select('id').limit(1);
      if (!error) {
        console.log("Supabase 'comments' table detected on-the-fly! Activating and syncing...");
        await initSupabaseComments();
      }
    } else {
      await syncCommentsFromSupabase();
    }
  } catch (err) {}
  const comments = readComments();
  res.json({ 
    success: true, 
    comments,
    dbStatus: {
      isConfigured: isSupabaseConfigured,
      isCommentsTableReady,
      supabaseUrl: isSupabaseConfigured ? supabaseUrl : null
    }
  });
});

// Add a comment
app.post('/api/comments', async (req, res) => {
  try {
    const { name, role, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }
    const comments = readComments();
    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: (name && name.trim()) || 'Singapore Renovator',
      role: role || '🏡 Homeowner',
      text: text.trim(),
      likes: 0,
      timestamp: 'Just now',
      replies: []
    };
    comments.unshift(newComment);
    writeComments(comments);
    
    // Fire-and-forget background sync to Supabase if active
    saveCommentToSupabase(newComment);

    res.json({ success: true, comment: newComment, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a reply
app.post('/api/comments/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Reply text is required' });
    }
    const comments = readComments();
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    const newReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: (name && name.trim()) || 'Singapore Renovator',
      role: role || '🏡 Homeowner',
      text: text.trim(),
      timestamp: 'Just now'
    };
    if (!comments[commentIndex].replies) {
      comments[commentIndex].replies = [];
    }
    comments[commentIndex].replies.push(newReply);
    writeComments(comments);

    // Fire-and-forget background sync to Supabase if active
    saveCommentToSupabase(comments[commentIndex]);

    res.json({ success: true, reply: newReply, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Like a comment
app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = readComments();
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
    writeComments(comments);

    // Fire-and-forget background sync to Supabase if active
    saveCommentToSupabase(comments[commentIndex]);

    res.json({ success: true, likes: comments[commentIndex].likes, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup development dev-server or Serve static production assets
async function serveApp() {
  // Sync comments table on startup
  await initSupabaseComments();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite's middlewares-handler
    app.use(vite.middlewares);
    console.log('Vite development server loaded behind Express proxy');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving built production resources from /dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Singapore Renovation Server active on http://localhost:${PORT}`);
  });
}

serveApp();
