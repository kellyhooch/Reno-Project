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

// Setup development dev-server or Serve static production assets
async function serveApp() {
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
