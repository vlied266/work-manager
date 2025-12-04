/**
 * Variable Parser Utility
 * 
 * Resolves mustache-syntax placeholders (e.g., {{ step_1.output.email }})
 * within configuration objects using values from a context object.
 */

/**
 * Safely retrieves a nested property from an object using a dot-notation path.
 * Returns undefined if the path doesn't exist (no crashes).
 * 
 * @param obj - The object to traverse
 * @param path - Dot-notation path (e.g., "step_1.output.email")
 * @returns The value at the path, or undefined if not found
 * 
 * @example
 * safeGet({ step_1: { output: { email: "test@example.com" } } }, "step_1.output.email")
 * // Returns: "test@example.com"
 */
export function safeGet(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  // Split path by dots and filter out empty strings
  const keys = path.split('.').filter(key => key.length > 0);
  
  let current = obj;
  
  for (const key of keys) {
    // Trim whitespace from key
    const trimmedKey = key.trim();
    
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Check if current is an object/array and has the key
    if (typeof current === 'object' && trimmedKey in current) {
      current = current[trimmedKey];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Resolves mustache-syntax placeholders in a configuration object.
 * 
 * Converts the config to a string, finds all {{ ... }} placeholders,
 * replaces them with values from the context, and parses back to JSON.
 * 
 * @param config - The configuration object containing placeholders
 * @param context - The context object containing values to resolve placeholders
 * @returns The resolved configuration object, or original config if parsing fails
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
    // Matches: {{ step_1.output.email }}, {{ variable }}, etc.
    const placeholderRegex = /\{\{([^}]+)\}\}/g;

    // Replace all placeholders with values from context
    configString = configString.replace(placeholderRegex, (match, path) => {
      // Extract the path (trim whitespace)
      const variablePath = path.trim();
      
      // Get value from context using safeGet
      const value = safeGet(context, variablePath);
      
      // If value is found, replace the placeholder
      if (value !== undefined) {
        // If value is a string, keep it as string
        // If value is an object/array, stringify it
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
    // Return original config if parsing fails
    return config;
  }
}

/**
 * Recursively resolves variables in nested objects and arrays.
 * 
 * @param obj - The object to recursively resolve
 * @param context - The context object
 * @returns The recursively resolved object
 */
function recursivelyResolve(obj: any, context: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's a string, check if it contains placeholders
  if (typeof obj === 'string') {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    if (placeholderRegex.test(obj)) {
      // Replace placeholders in the string
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

  // For primitives (number, boolean, etc.), return as-is
  return obj;
}

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

