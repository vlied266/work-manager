# 🚀 Atomic Work Engine - Documentation
## Engine ساخت Procedure و Process

این فایل شامل کدهای اصلی موتور ساخت و اجرای Procedure و Process است.

---

## 📋 فهرست مطالب

1. [Schema (ساختار داده‌ها)](#1-schema-ساختار-داده‌ها)
2. [Workflow Engine (موتور اجرا)](#2-workflow-engine-موتور-اجرا)
3. [Variable Parser (حل کننده متغیرها)](#3-variable-parser-حل-کننده-متغیرها)
4. [Procedure Builder (سازنده Procedure)](#4-procedure-builder-سازنده-procedure)
5. [Process Composer (سازنده Process)](#5-process-composer-سازنده-process)

---

## 1. Schema (ساختار داده‌ها)

**فایل:** `src/types/schema.ts`

### 1.1. 4-Layer Hierarchy (سلسله مراتب 4 لایه)

```
Level 4: Organization (The Organism)
  └── Level 3: Process Group (The Material)
      └── Level 2: Procedure (The Molecule)
          └── Level 1: Atomic Step (The Atom)
```

### 1.2. Atomic Actions (15 نوع عملیات اتمی)

```typescript
export type AtomicAction =
  // Information Group
  | "INPUT"              // ورودی داده
  | "FETCH"              // دریافت داده
  | "TRANSMIT"           // ارسال داده
  | "STORE"              // ذخیره داده
  | "GOOGLE_SHEET_APPEND" // ذخیره در Google Sheet
  // Logic Group
  | "TRANSFORM"          // تبدیل داده
  | "ORGANISE"           // سازماندهی داده
  | "CALCULATE"          // محاسبه
  | "COMPARE"            // مقایسه
  | "VALIDATE"           // اعتبارسنجی
  | "GATEWAY"            // مسیریابی شرطی
  // Physical Group
  | "MOVE_OBJECT"        // جابجایی فیزیکی
  | "TRANSFORM_OBJECT"   // تغییر فیزیکی
  | "INSPECT"            // بازرسی
  // Human Group
  | "GENERATE"           // تولید محتوا
  | "NEGOTIATE"          // مذاکره
  | "AUTHORIZE";         // تأیید
```

### 1.3. Interface های اصلی

```typescript
// Level 2: Procedure (The Molecule)
export interface Procedure {
  id: string;
  organizationId: string;
  processGroupId: string;
  title: string;
  description: string;
  isPublished: boolean;
  steps: AtomicStep[];  // زنجیره اتم‌ها
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Level 3: Process Group (The Material)
export interface ProcessGroup {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  icon: string;
  procedureSequence: string[];  // لیست مرتب شده Procedure IDs
  isActive: boolean;
  defaultAssignee?: {
    type: "USER" | "TEAM";
    id: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Level 1: Atomic Step (The Atom)
export interface AtomicStep {
  id: string;
  title: string;
  action: AtomicAction;
  assignment?: {
    type: "STARTER" | "SPECIFIC_USER" | "TEAM_QUEUE";
    assigneeId?: string;
  };
  requiresEvidence?: boolean;
  
  // Routing Logic (Non-Linear Flow)
  routes?: {
    defaultNextStepId?: string | "COMPLETED";
    onSuccessStepId?: string;
    onFailureStepId?: string;
    conditions?: {
      variable: string;
      operator: ">" | "<" | "==" | "!=" | ">=" | "<=" | "contains";
      value: any;
      targetStepId: string;
    }[];
  };

  // Polymorphic Config (تغییر بر اساس Action)
  config: {
    // For INPUT
    inputType?: "text" | "number" | "file" | "date" | "table" | "email";
    fieldLabel?: string;
    required?: boolean;
    validationRegex?: string;
    
    // For COMPARE
    targetA?: string;  // Variable name: "step_1_output"
    targetB?: string;  // Variable name: "step_2_output"
    comparisonType?: "exact" | "fuzzy" | "numeric" | "date";
    
    // For CALCULATE
    formula?: string;  // e.g., "amount * tax_rate"
    variables?: Record<string, string>;
    
    // For VALIDATE
    validationRule?: string;
    rule?: "GREATER_THAN" | "LESS_THAN" | "EQUAL" | "CONTAINS" | "REGEX";
    target?: string;
    value?: any;
    
    // For Google Integration
    sheetId?: string;
    fileName?: string;
    mapping?: Record<string, string>;  // Map variables to sheet columns
    
    // Data Flow
    outputVariableName?: string;  // e.g., "invoice_total"
    extractionRule?: string;
    
    // AI Automation
    isAiAutomated?: boolean;
  };
}
```

---

## 2. Workflow Engine (موتور اجرا)

**فایل:** `src/lib/engine.ts`

### 2.1. Run Context (حافظه مشترک)

```typescript
export interface RunContext {
  [variableName: string]: any;
}
```

### 2.2. تابع اصلی اجرا: `executeAtomicAction`

```typescript
/**
 * Execute an atomic action with variable resolution
 * 
 * قبل از اجرای هر step، placeholder های موجود در step.config
 * با داده‌های واقعی از context جایگزین می‌شوند
 * با استفاده از mustache syntax (مثل {{ step_1.output.email }})
 */
export async function executeAtomicAction(
  step: AtomicStep,
  context: RunContext
): Promise<{ output: any; outcome: "SUCCESS" | "FAILURE"; error?: string }> {
  try {
    // Step 1: Resolve variables in step.config
    const resolvedConfig = resolveVariables(step.config, context);

    // Step 2: Execute based on action type
    switch (step.action) {
      case "INPUT": {
        const inputValue = resolvedConfig.inputValue || resolvedConfig.defaultValue;
        
        // Validate input if validation rules exist
        if (inputValue !== undefined && inputValue !== null) {
          const validation = validateInput(inputValue, resolvedConfig);
          if (!validation.valid) {
            return {
              output: null,
              outcome: "FAILURE",
              error: validation.error || "Input validation failed",
            };
          }
        }

        return {
          output: inputValue || resolvedConfig,
          outcome: "SUCCESS",
        };
      }

      case "COMPARE": {
        const targetA = resolvedConfig.targetA;
        const targetB = resolvedConfig.targetB;
        const comparisonType = resolvedConfig.comparisonType || "exact";

        if (!targetA || !targetB) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "Both targetA and targetB must be specified",
          };
        }

        // Get values from context
        const valA = getContextValue(context, targetA);
        const valB = getContextValue(context, targetB);

        // Evaluate comparison
        const result = evaluateComparison(valA, valB, comparisonType);

        return {
          output: {
            match: result.match,
            diff: result.diff,
            details: result.details,
            valueA: valA,
            valueB: valB,
          },
          outcome: result.match ? "SUCCESS" : "FAILURE",
        };
      }

      case "CALCULATE": {
        const formula = resolvedConfig.formula;
        const variables = resolvedConfig.variables || {};

        if (!formula) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "Formula is required for CALCULATE action",
          };
        }

        // Get variable values from context
        const varValues: Record<string, number> = {};
        for (const [key, varName] of Object.entries(variables)) {
          const value = getContextValue(context, varName as string);
          if (value !== undefined) {
            varValues[key] = parseFloat(String(value)) || 0;
          } else {
            varValues[key] = 0;
          }
        }

        // Replace variables in formula
        let formulaToEval = formula;
        for (const [key, value] of Object.entries(varValues)) {
          formulaToEval = formulaToEval.replace(
            new RegExp(`\\b${key}\\b`, "g"),
            String(value)
          );
        }

        // Evaluate formula (safe evaluation)
        try {
          if (!/^[0-9+\-*/().\s]+$/.test(formulaToEval)) {
            throw new Error("Invalid characters in formula");
          }

          const result = Function(`"use strict"; return (${formulaToEval})`)();

          return {
            output: {
              result,
              formula: formulaToEval,
              variables: varValues,
            },
            outcome: "SUCCESS",
          };
        } catch (error) {
          return {
            output: null,
            outcome: "FAILURE",
            error: `Calculation failed: ${(error as Error).message}`,
          };
        }
      }

      case "VALIDATE": {
        const target = resolvedConfig.target;
        const validationRule = resolvedConfig.validationRule;
        const rule = resolvedConfig.rule || "REGEX";
        const valueToCompare = resolvedConfig.value;

        if (!target) {
          return {
            output: null,
            outcome: "FAILURE",
            error: "target is required for VALIDATE action",
          };
        }

        // Get value from context
        const value = getContextValue(context, target);

        // Perform validation based on rule type
        let isValid = false;
        let errorMessage = "";

        switch (rule) {
          case "GREATER_THAN":
            const numGT = parseFloat(String(value));
            const compareGT = parseFloat(String(valueToCompare));
            if (isNaN(numGT) || isNaN(compareGT)) {
              isValid = false;
              errorMessage = "Both values must be numbers";
            } else {
              isValid = numGT > compareGT;
              if (!isValid) {
                errorMessage = `Value ${numGT} is not greater than ${compareGT}`;
              }
            }
            break;

          case "LESS_THAN":
            // Similar logic...
            break;

          case "EQUAL":
            isValid = String(value) === String(valueToCompare);
            break;

          case "CONTAINS":
            isValid = String(value || "").includes(String(valueToCompare || ""));
            break;

          case "REGEX":
          default:
            if (!validationRule) {
              return {
                output: null,
                outcome: "FAILURE",
                error: "validationRule (regex pattern) is required",
              };
            }
            try {
              const regex = new RegExp(validationRule);
              isValid = regex.test(String(value || ""));
              if (!isValid) {
                errorMessage = resolvedConfig.errorMessage || "Value does not match pattern";
              }
            } catch (error) {
              return {
                output: null,
                outcome: "FAILURE",
                error: `Invalid regex pattern: ${(error as Error).message}`,
              };
            }
            break;
        }

        return {
          output: {
            valid: isValid,
            value,
            error: isValid ? undefined : errorMessage,
          },
          outcome: isValid ? "SUCCESS" : "FAILURE",
          error: isValid ? undefined : errorMessage,
        };
      }

      default:
        // For other actions, return resolved config as output
        return {
          output: resolvedConfig,
          outcome: "SUCCESS",
        };
    }
  } catch (error) {
    return {
      output: null,
      outcome: "FAILURE",
      error: `Execution failed: ${(error as Error).message}`,
    };
  }
}
```

### 2.3. توابع کمکی

```typescript
/**
 * Get value from Run Context by variable name
 * پشتیبانی از dot notation (مثل "step_1_output.amount")
 */
export function getContextValue(context: RunContext, variableName: string): any {
  const parts = variableName.split(".");
  let value = context[parts[0]];
  
  for (let i = 1; i < parts.length && value !== undefined; i++) {
    value = value?.[parts[i]];
  }
  
  return value;
}

/**
 * Set value in Run Context
 */
export function setContextValue(
  context: RunContext,
  variableName: string,
  value: any
): RunContext {
  return {
    ...context,
    [variableName]: value,
  };
}

/**
 * Evaluate COMPARE action
 */
export function evaluateComparison(
  valA: any,
  valB: any,
  comparisonType: "exact" | "fuzzy" | "numeric" | "date" = "exact"
): { match: boolean; diff: string; details?: any } {
  if (valA === undefined || valB === undefined) {
    return {
      match: false,
      diff: "One or both values are missing",
    };
  }

  switch (comparisonType) {
    case "exact":
      const exactMatch = String(valA) === String(valB);
      return {
        match: exactMatch,
        diff: exactMatch ? "Values match exactly" : `Mismatch: "${valA}" vs "${valB}"`,
        details: { valueA: valA, valueB: valB },
      };

    case "numeric":
      const numA = parseFloat(String(valA));
      const numB = parseFloat(String(valB));
      if (isNaN(numA) || isNaN(numB)) {
        return { match: false, diff: "One or both values are not numeric" };
      }
      const numericMatch = numA === numB;
      return {
        match: numericMatch,
        diff: numericMatch ? "Values match numerically" : `Numeric difference: ${Math.abs(numA - numB)}`,
        details: { valueA: numA, valueB: numB, difference: Math.abs(numA - numB) },
      };

    // ... other comparison types
  }
}

/**
 * Validate INPUT_DATA based on config
 */
export function validateInput(
  value: any,
  config: AtomicStep["config"]
): { valid: boolean; error?: string } {
  if (config.required && (value === null || value === undefined || value === "")) {
    return {
      valid: false,
      error: config.validationMessage || "This field is required",
    };
  }

  if (config.inputType === "number") {
    const num = parseFloat(String(value));
    if (isNaN(num)) {
      return { valid: false, error: "Value must be a number" };
    }
  }

  if (config.validationRegex) {
    const regex = new RegExp(config.validationRegex);
    if (!regex.test(String(value))) {
      return {
        valid: false,
        error: config.validationMessage || "Value does not match required format",
      };
    }
  }

  return { valid: true };
}
```

---

## 3. Variable Parser (حل کننده متغیرها)

**فایل:** `src/lib/engine/variable-parser.ts`

### 3.1. تابع اصلی: `resolveVariables`

```typescript
/**
 * Resolves mustache-syntax placeholders in a configuration object.
 * 
 * تبدیل placeholder های {{ ... }} به مقادیر واقعی از context
 * 
 * @example
 * const config = {
 *   recipient: "{{ step_1.output.email }}",
 *   subject: "Hello {{ step_2.output.name }}"
 * };
 * 
 * const context = {
 *   step_1: { output: { email: "user@example.com" } },
 *   step_2: { output: { name: "John" } }
 * };
 * 
 * resolveVariables(config, context)
 * // Returns: { recipient: "user@example.com", subject: "Hello John" }
 */
export function resolveVariables(config: any, context: any): any {
  if (!config || typeof config !== 'object') {
    return config;
  }

  if (!context || typeof context !== 'object') {
    return config;
  }

  try {
    // Convert config to JSON string
    let configString = JSON.stringify(config);

    // Regex to find all {{ ... }} placeholders
    const placeholderRegex = /\{\{([^}]+)\}\}/g;

    // Replace all placeholders with values from context
    configString = configString.replace(placeholderRegex, (match, path) => {
      const variablePath = path.trim();
      const value = safeGet(context, variablePath);
      
      if (value !== undefined) {
        if (typeof value === 'string') {
          return value;
        } else if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        } else {
          return String(value);
        }
      }
      
      // If value not found, keep the original placeholder
      return match;
    });

    // Parse the string back to JSON
    const resolvedConfig = JSON.parse(configString);

    // Recursively resolve nested objects
    return recursivelyResolve(resolvedConfig, context);
  } catch (error) {
    console.error('Error resolving variables:', error);
    return config;
  }
}

/**
 * Safely retrieves a nested property from an object using dot-notation path.
 */
export function safeGet(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  const keys = path.split('.').filter(key => key.length > 0);
  let current = obj;
  
  for (const key of keys) {
    const trimmedKey = key.trim();
    
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current === 'object' && trimmedKey in current) {
      current = current[trimmedKey];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Recursively resolves variables in nested objects and arrays.
 */
function recursivelyResolve(obj: any, context: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's a string, check if it contains placeholders
  if (typeof obj === 'string') {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    if (placeholderRegex.test(obj)) {
      return obj.replace(placeholderRegex, (match, path) => {
        const variablePath = path.trim();
        const value = safeGet(context, variablePath);
        
        if (value !== undefined) {
          if (typeof value === 'string') {
            return value;
          } else if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          } else {
            return String(value);
          }
        }
        
        return match;
      });
    }
    return obj;
  }

  // If it's an array, recursively resolve each element
  if (Array.isArray(obj)) {
    return obj.map(item => recursivelyResolve(item, context));
  }

  // If it's an object, recursively resolve each property
  if (typeof obj === 'object') {
    const resolved: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        resolved[key] = recursivelyResolve(obj[key], context);
      }
    }
    return resolved;
  }

  // For primitives, return as-is
  return obj;
}
```

---

## 4. Procedure Builder (سازنده Procedure)

**فایل:** `src/app/(dashboard)/studio/procedure/[id]/page.tsx`

### 4.1. ساختار کلی

```typescript
export default function ProcedureBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [procedureTitle, setProcedureTitle] = useState("");
  const [procedureDescription, setProcedureDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "canvas">("list");

  // Fetch Procedure from Firestore
  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "procedures", id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const proc = {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            steps: data.steps || [],
          } as Procedure;
          setProcedure(proc);
          setProcedureTitle(proc.title);
          setProcedureDescription(proc.description);
          setIsPublished(proc.isPublished);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Create Procedure
  const handleCreateProcedure = async () => {
    if (!procedureTitle.trim() || !procedureDescription.trim() || !procedure || procedure.steps.length === 0) {
      alert("Please fill in title, description, and add at least one step");
      return;
    }

    // Create default "Uncategorized" process group if needed
    let defaultGroupId: string | null = null;
    const defaultGroupQuery = query(
      collection(db, "process_groups"),
      where("organizationId", "==", organizationId),
      where("title", "==", "Uncategorized")
    );
    const defaultGroupSnapshot = await getDocs(defaultGroupQuery);
    
    if (defaultGroupSnapshot.empty) {
      const groupRef = await addDoc(collection(db, "process_groups"), {
        organizationId,
        title: "Uncategorized",
        description: "Default group for procedures without a specific category",
        icon: "FolderOpen",
        procedureSequence: [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      defaultGroupId = groupRef.id;
    } else {
      defaultGroupId = defaultGroupSnapshot.docs[0].id;
    }

    // Save Procedure to Firestore
    const docRef = await addDoc(collection(db, "procedures"), {
      organizationId,
      processGroupId: defaultGroupId,
      title: procedureTitle.trim(),
      description: procedureDescription.trim(),
      isPublished,
      steps: procedure.steps,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    router.push(`/studio/procedure/${docRef.id}`);
  };

  // Add Step
  const handleAddStep = async (action: AtomicAction) => {
    const newStep: AtomicStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${ATOMIC_ACTION_METADATA[action].label} Step`,
      action,
      config: {},
    };

    if (!procedure) {
      // Create temporary procedure in memory
      const tempProcedure: Procedure = {
        id: `temp-${Date.now()}`,
        organizationId: organizationId,
        processGroupId: "",
        title: procedureTitle || "New Procedure",
        description: procedureDescription || "",
        isPublished: false,
        steps: [newStep],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProcedure(tempProcedure);
    } else {
      // Add step to existing procedure
      setProcedure({
        ...procedure,
        steps: [...procedure.steps, newStep],
        updatedAt: new Date(),
      });
    }

    setSelectedStepId(newStep.id);
  };

  // Update Step
  const handleUpdateStep = (stepId: string, updates: Partial<AtomicStep>) => {
    if (!procedure) return;

    setProcedure({
      ...procedure,
      steps: procedure.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
      updatedAt: new Date(),
    });
  };

  // Delete Step
  const handleDeleteStep = (stepId: string) => {
    if (!procedure) return;

    setProcedure({
      ...procedure,
      steps: procedure.steps.filter((step) => step.id !== stepId),
      updatedAt: new Date(),
    });

    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  // Reorder Steps (Drag & Drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !procedure) return;

    const oldIndex = procedure.steps.findIndex((step) => step.id === active.id);
    const newIndex = procedure.steps.findIndex((step) => step.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newSteps = arrayMove(procedure.steps, oldIndex, newIndex);
      setProcedure({
        ...procedure,
        steps: newSteps,
        updatedAt: new Date(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Toolbox (Left Sidebar) */}
      <DraggableSidebar onAddStep={handleAddStep} />

      {/* Main Canvas Area */}
      <main className="flex-1 overflow-x-auto">
        {viewMode === "list" ? (
          <SortableCanvas
            steps={procedure?.steps || []}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onUpdateStep={handleUpdateStep}
            onDeleteStep={handleDeleteStep}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <VisualEditor
            tasks={procedure?.steps || []}
            onNodeUpdate={(nodeId, data) => {
              handleUpdateStep(nodeId, { config: { ...procedure?.steps.find(s => s.id === nodeId)?.config, ...data } });
            }}
          />
        )}
      </main>

      {/* Config Panel (Right Sidebar) */}
      <ConfigPanel
        step={procedure?.steps.find((s) => s.id === selectedStepId) || null}
        onUpdateStep={handleUpdateStep}
        selectedStepId={selectedStepId}
      />
    </div>
  );
}
```

---

## 5. Process Composer (سازنده Process)

**فایل:** `src/app/(dashboard)/studio/process/[id]/page.tsx`

### 5.1. ساختار کلی

```typescript
export default function ProcessComposerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [processGroup, setProcessGroup] = useState<ProcessGroup | null>(null);
  const [processTitle, setProcessTitle] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch All Procedures for this organization
  useEffect(() => {
    const q = query(
      collection(db, "procedures"),
      where("organizationId", "==", organizationId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const procs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        steps: doc.data().steps || [],
      })) as Procedure[];
      
      procs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setProcedures(procs);
    });

    return () => unsubscribe();
  }, [organizationId]);

  // Fetch Process Group if editing
  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "process_groups", id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const group = {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            procedureSequence: data.procedureSequence || [],
            isActive: data.isActive !== undefined ? data.isActive : true,
          } as ProcessGroup;
          setProcessGroup(group);
          setProcessTitle(group.title);
          setProcessDescription(group.description || "");
          setIsActive(group.isActive);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Create Process
  const handleCreateProcess = async () => {
    if (!processTitle.trim() || !processDescription.trim()) {
      alert("Please fill in title and description");
      return;
    }
    
    if (!processGroup || !processGroup.procedureSequence || processGroup.procedureSequence.length === 0) {
      alert("Please add at least one procedure from the library");
      return;
    }

    // Validate procedure IDs exist
    const procedureIds = processGroup.procedureSequence;
    const validIds = procedureIds.filter(id => procedures.some(p => p.id === id));

    const processData = {
      organizationId: organizationId,
      title: processTitle.trim(),
      description: processDescription.trim(),
      icon: "FolderOpen",
      procedureSequence: validIds,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "process_groups"), processData);
    router.push(`/studio/process/${docRef.id}`);
  };

  // Add Procedure to Process
  const handleAddProcedure = (procedureId: string) => {
    if (!processGroup) {
      // Create temporary process group
      const tempGroup: ProcessGroup = {
        id: `temp-${Date.now()}`,
        organizationId: organizationId,
        title: processTitle || "New Process",
        description: processDescription || "",
        icon: "FolderOpen",
        procedureSequence: [procedureId],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProcessGroup(tempGroup);
    } else {
      // Add procedure to existing sequence
      if (!processGroup.procedureSequence.includes(procedureId)) {
        setProcessGroup({
          ...processGroup,
          procedureSequence: [...processGroup.procedureSequence, procedureId],
          updatedAt: new Date(),
        });
      }
    }
  };

  // Remove Procedure from Process
  const handleRemoveProcedure = (procedureId: string) => {
    if (!processGroup) return;

    setProcessGroup({
      ...processGroup,
      procedureSequence: processGroup.procedureSequence.filter(id => id !== procedureId),
      updatedAt: new Date(),
    });
  };

  // Reorder Procedures (Drag & Drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !processGroup) return;

    const oldIndex = processGroup.procedureSequence.findIndex(id => id === active.id);
    const newIndex = processGroup.procedureSequence.findIndex(id => id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newSequence = arrayMove(processGroup.procedureSequence, oldIndex, newIndex);
      setProcessGroup({
        ...processGroup,
        procedureSequence: newSequence,
        updatedAt: new Date(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Library (Left Sidebar) - All Available Procedures */}
      <div className="w-80 border-r border-slate-200 bg-white/70 backdrop-blur-xl">
        <h2 className="p-4 text-lg font-bold text-slate-900">Procedure Library</h2>
        <div className="space-y-2 p-4">
          {procedures.map((proc) => (
            <div
              key={proc.id}
              onClick={() => handleAddProcedure(proc.id)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{proc.title}</h3>
              <p className="text-sm text-slate-600">{proc.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas - Process Timeline */}
      <main className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={processGroup?.procedureSequence || []}
            strategy={verticalListSortingStrategy}
          >
            {processGroup?.procedureSequence.map((procedureId) => {
              const proc = procedures.find(p => p.id === procedureId);
              if (!proc) return null;

              return (
                <SortableProcedureItem
                  key={procedureId}
                  procedure={proc}
                  onRemove={() => handleRemoveProcedure(procedureId)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}
```

---

## 📝 خلاصه معماری

### Flow اجرا:

1. **User creates Procedure** → Drag & Drop atomic actions → Configure each step
2. **User creates Process** → Select Procedures from Library → Arrange in sequence
3. **User starts Run** → System executes Procedure steps sequentially
4. **Variable Resolution** → Each step's config is resolved using `{{ variable }}` syntax
5. **Context Management** → Output of each step is stored in `RunContext`
6. **Conditional Routing** → Based on step outcome (SUCCESS/FAILURE), route to next step

### ویژگی‌های کلیدی:

- ✅ **4-Layer Hierarchy**: Organization → Process → Procedure → Atomic Step
- ✅ **15 Atomic Actions**: Covers all types of work (Information, Logic, Physical, Human)
- ✅ **Variable Resolution**: Mustache syntax `{{ step_1.output.email }}`
- ✅ **Non-Linear Flow**: Conditional routing based on step outcomes
- ✅ **Real-time Updates**: Firestore real-time listeners
- ✅ **Drag & Drop**: Reorder steps and procedures
- ✅ **Visual Editor**: React Flow for visual workflow design

---

**تاریخ ایجاد:** 2025-01-27  
**نسخه:** 1.0.0

