/**
 * Migration Script v2: Legacy Templates -> New Schema
 * More careful migration that preserves structure
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../src/app/(dashboard)/studio/templates/page.tsx');
const outputFile = path.join(__dirname, '../src/data/templates.ts');

console.log('Reading templates file...');
let content = fs.readFileSync(inputFile, 'utf8');

// Extract the TEMPLATES array content (from line 14 to line 3138)
const lines = content.split('\n');
const templatesStart = 13; // Line 14 (0-indexed)
const templatesEnd = 3137; // Line 3138 (0-indexed)
const templatesContent = lines.slice(templatesStart, templatesEnd + 1).join('\n');

console.log('Migrating templates...');

// Step 1: Replace action types (simple string replacements)
let migrated = templatesContent
  // FETCH -> AI_PARSE
  .replace(/action:\s*"FETCH"\s*as\s*const/g, 'action: "AI_PARSE" as const')
  // STORE -> DB_INSERT
  .replace(/action:\s*"STORE"\s*as\s*const/g, 'action: "DB_INSERT" as const')
  // AUTHORIZE -> APPROVAL
  .replace(/action:\s*"AUTHORIZE"\s*as\s*const/g, 'action: "APPROVAL" as const')
  // GENERATE -> DOC_GENERATE
  .replace(/action:\s*"GENERATE"\s*as\s*const/g, 'action: "DOC_GENERATE" as const')
  // NOTIFY -> SEND_EMAIL
  .replace(/action:\s*"NOTIFY"\s*as\s*const/g, 'action: "SEND_EMAIL" as const')
  // DECIDE -> GATEWAY
  .replace(/action:\s*"DECIDE"\s*as\s*const/g, 'action: "GATEWAY" as const');

// Step 2: Migrate FETCH configs to AI_PARSE configs
// Match: config: { allowedTypes: [...], maxSize: "..." }
migrated = migrated.replace(
  /(\s+)(config:\s*\{)(\s+)(allowedTypes:\s*\[[^\]]+\],?)(\s+)(maxSize:\s*"[^"]+",?)/g,
  (match, indent, configStart, ws1, allowedTypes, ws2, maxSize) => {
    // Extract file extensions from allowedTypes
    const extensions = allowedTypes.match(/\[(.*?)\]/);
    const fileType = extensions && extensions[1].includes('.pdf') ? 'pdf' : 
                     extensions && extensions[1].includes('.jpg') || extensions[1].includes('.png') ? 'image' : 'pdf';
    
    return `${indent}${configStart}${ws1}fileSourceStepId: "step-1",${ws1}extractionMode: "specific_fields",${ws1}fieldsToExtract: [],${ws1}fileType: "${fileType}"${ws1}}`;
  }
);

// Step 3: Migrate STORE configs to DB_INSERT configs
// Match: config: { storageType: "database", collection: "..." }
migrated = migrated.replace(
  /(\s+)(config:\s*\{)(\s+)(storageType:\s*"[^"]+",?)(\s+)(collection:\s*"([^"]+)",?)/g,
  (match, indent, configStart, ws1, storageType, ws2, collection, collectionName) => {
    return `${indent}${configStart}${ws1}collectionName: "${collectionName}",${ws1}data: {}${ws1}}`;
  }
);

// Step 4: Migrate GENERATE configs to DOC_GENERATE configs
// Match: config: { template: "...", outputFormat: "..." }
migrated = migrated.replace(
  /(\s+)(config:\s*\{)(\s+)(template:\s*"([^"]+)",?)(\s+)(outputFormat:\s*"([^"]+)",?)/g,
  (match, indent, configStart, ws1, template, templateContent, ws2, outputFormat, format) => {
    // Escape quotes in template content
    const escapedContent = templateContent.replace(/"/g, '\\"');
    return `${indent}${configStart}${ws1}sourceType: "inline",${ws1}inlineContent: "${escapedContent}",${ws1}outputFormat: "${format || 'pdf'}"${ws1}}`;
  }
);

// Step 5: Fix VALIDATE rule names (keep as is, they're mostly compatible)
// GREATER_THAN_OR_EQUAL -> GREATER_THAN (simplified)
migrated = migrated.replace(/rule:\s*"GREATER_THAN_OR_EQUAL"/g, 'rule: "GREATER_THAN"');
migrated = migrated.replace(/rule:\s*"LESS_THAN_OR_EQUAL"/g, 'rule: "LESS_THAN"');

// Step 6: Update VALIDATE target field references
// Convert step_X_output to {{step_X.output}}
migrated = migrated.replace(/target:\s*"step_(\d+)_output"/g, 'target: "{{step_$1.output}}"');

console.log('Writing migrated templates...');

// Create the output file
const header = `/**
 * Pre-built Workflow Templates
 * 
 * These templates have been migrated from the legacy schema to the new Atomic Step Architecture.
 * 
 * Migration Rules Applied:
 * - FETCH -> AI_PARSE (Read Document) with extractionMode
 * - STORE -> DB_INSERT (Save to DB) with collectionName
 * - AUTHORIZE -> APPROVAL
 * - GENERATE -> DOC_GENERATE with sourceType and outputFormat
 * - NOTIFY -> SEND_EMAIL
 * - DECIDE -> GATEWAY
 */

import { AtomicStep } from "@/types/schema";
import { Users, DollarSign, Wrench, CheckCircle2, FileText, TrendingUp, ShoppingCart, Shield, Code, Scale, Megaphone, ClipboardCheck, Calendar, CreditCard, Building2, Package, Truck, AlertTriangle, UserPlus, GraduationCap, BarChart, Receipt, FileCheck, Key, Bug, BookOpen, Target, Image, Stethoscope, Briefcase, UtensilsCrossed, Home, Car, Plane, Heart, Music, Paintbrush, Camera, Gamepad2, Hammer, Zap, Factory, Microscope, Beaker, Globe, Mail, Phone, Printer, Scissors } from "lucide-react";

export const TEMPLATES = [
`;

const footer = `];
`;

const output = header + migrated + footer;

fs.writeFileSync(outputFile, output, 'utf8');

console.log('✅ Migration complete!');
console.log(`   Output written to: ${outputFile}`);
console.log(`   File size: ${output.length} bytes`);

