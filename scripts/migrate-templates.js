/**
 * Migration Script: Legacy Templates -> New Schema
 * 
 * Converts:
 * - FETCH -> AI_PARSE (with extractionMode)
 * - STORE -> DB_INSERT (with collectionName)
 * - AUTHORIZE -> APPROVAL
 * - GENERATE -> DOC_GENERATE (with sourceType and outputFormat)
 * - NOTIFY -> SEND_EMAIL
 * - DECIDE -> GATEWAY
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../src/app/(dashboard)/studio/templates/page.tsx');
const outputFile = path.join(__dirname, '../src/data/templates.ts');

console.log('Reading templates file...');
const content = fs.readFileSync(inputFile, 'utf8');

// Extract the TEMPLATES array content
const templatesMatch = content.match(/const TEMPLATES = \[([\s\S]*?)\];/);
if (!templatesMatch) {
  console.error('Could not find TEMPLATES array');
  process.exit(1);
}

let templatesContent = templatesMatch[1];

console.log('Migrating templates...');

// Migration 1: FETCH -> AI_PARSE
// Replace action: "FETCH" with action: "AI_PARSE"
// Update config to include extractionMode and fieldsToExtract
templatesContent = templatesContent.replace(
  /action:\s*"FETCH"\s*as\s*const/g,
  'action: "AI_PARSE" as const'
);

// Update FETCH config to AI_PARSE config
templatesContent = templatesContent.replace(
  /config:\s*\{[\s\S]*?allowedTypes:[\s\S]*?\}/g,
  (match) => {
    // Extract allowedTypes if present
    const allowedTypesMatch = match.match(/allowedTypes:\s*\[(.*?)\]/);
    const allowedTypes = allowedTypesMatch ? allowedTypesMatch[1] : '';
    
    // Convert to AI_PARSE config
    return `config: {
      fileSourceStepId: "step-1",
      extractionMode: "specific_fields",
      fieldsToExtract: [],
      fileType: "pdf"
    }`;
  }
);

// Migration 2: STORE -> DB_INSERT
templatesContent = templatesContent.replace(
  /action:\s*"STORE"\s*as\s*const/g,
  'action: "DB_INSERT" as const'
);

// Update STORE config to DB_INSERT config
templatesContent = templatesContent.replace(
  /config:\s*\{[\s\S]*?storageType:[\s\S]*?collection:\s*"([^"]+)"[\s\S]*?\}/g,
  (match, collectionName) => {
    return `config: {
      collectionName: "${collectionName}",
      data: {}
    }`;
  }
);

// Migration 3: AUTHORIZE -> APPROVAL
templatesContent = templatesContent.replace(
  /action:\s*"AUTHORIZE"\s*as\s*const/g,
  'action: "APPROVAL" as const'
);

// Migration 4: GENERATE -> DOC_GENERATE
templatesContent = templatesContent.replace(
  /action:\s*"GENERATE"\s*as\s*const/g,
  'action: "DOC_GENERATE" as const'
);

// Update GENERATE config to DOC_GENERATE config
templatesContent = templatesContent.replace(
  /config:\s*\{[\s\S]*?template:\s*"([^"]+)"[\s\S]*?outputFormat:\s*"([^"]+)"[\s\S]*?\}/g,
  (match, template, outputFormat) => {
    return `config: {
      sourceType: "inline",
      inlineContent: "${template}",
      outputFormat: "${outputFormat || 'pdf'}"
    }`;
  }
);

// Migration 5: NOTIFY -> SEND_EMAIL
templatesContent = templatesContent.replace(
  /action:\s*"NOTIFY"\s*as\s*const/g,
  'action: "SEND_EMAIL" as const'
);

// Migration 6: DECIDE -> GATEWAY
templatesContent = templatesContent.replace(
  /action:\s*"DECIDE"\s*as\s*const/g,
  'action: "GATEWAY" as const'
);

// Fix VALIDATE config: update rule names to new format
templatesContent = templatesContent.replace(
  /rule:\s*"GREATER_THAN"/g,
  'rule: "GREATER_THAN"'
);
templatesContent = templatesContent.replace(
  /rule:\s*"GREATER_THAN_OR_EQUAL"/g,
  'rule: "GREATER_THAN"'
);
templatesContent = templatesContent.replace(
  /rule:\s*"LESS_THAN"/g,
  'rule: "LESS_THAN"'
);
templatesContent = templatesContent.replace(
  /rule:\s*"LESS_THAN_OR_EQUAL"/g,
  'rule: "LESS_THAN"'
);

// Update target field name for VALIDATE
templatesContent = templatesContent.replace(
  /target:\s*"([^"]+)"/g,
  (match, target) => {
    // Convert step_X_output to {{step_X.output}}
    if (target.includes('_output')) {
      const stepMatch = target.match(/step_(\d+)_output/);
      if (stepMatch) {
        return `target: "{{step_${stepMatch[1]}.output}}"`;
      }
    }
    return match;
  }
);

console.log('Writing migrated templates...');

// Read the template file structure
const templateFileContent = `/**
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

export const TEMPLATES = [${templatesContent}];
`;

fs.writeFileSync(outputFile, templateFileContent, 'utf8');

console.log('✅ Migration complete!');
console.log(`   Output written to: ${outputFile}`);

