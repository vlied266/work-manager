/**
 * Test file for variable-parser.ts
 * 
 * Run with: npx tsx src/lib/engine/variable-parser.test.ts
 */

import { safeGet, resolveVariables } from './variable-parser';

// Test safeGet
console.log('Testing safeGet...\n');

const testObj = {
  step_1: {
    output: {
      email: "user@example.com",
      name: "John Doe"
    }
  },
  step_2: {
    output: {
      amount: 1000
    }
  }
};

console.log('Test 1:', safeGet(testObj, "step_1.output.email")); // Should return: "user@example.com"
console.log('Test 2:', safeGet(testObj, "step_2.output.amount")); // Should return: 1000
console.log('Test 3:', safeGet(testObj, "step_1.output.nonexistent")); // Should return: undefined
console.log('Test 4:', safeGet(testObj, "invalid.path")); // Should return: undefined
console.log('Test 5:', safeGet(null, "step_1.output.email")); // Should return: undefined

// Test resolveVariables
console.log('\n\nTesting resolveVariables...\n');

const config = {
  recipient: "{{ step_1.output.email }}",
  subject: "Hello {{ step_2.output.name }}",
  body: "Your amount is {{ step_2.output.amount }}",
  metadata: {
    from: "{{ step_1.output.email }}",
    to: "{{ step_1.output.email }}"
  },
  array: [
    "{{ step_1.output.email }}",
    "{{ step_2.output.amount }}"
  ]
};

const context = {
  step_1: {
    output: {
      email: "user@example.com",
      name: "John Doe"
    }
  },
  step_2: {
    output: {
      name: "Jane Smith",
      amount: 1000
    }
  }
};

const resolved = resolveVariables(config, context);
console.log('Resolved config:', JSON.stringify(resolved, null, 2));

// Expected output:
// {
//   "recipient": "user@example.com",
//   "subject": "Hello Jane Smith",
//   "body": "Your amount is 1000",
//   "metadata": {
//     "from": "user@example.com",
//     "to": "user@example.com"
//   },
//   "array": [
//     "user@example.com",
//     "1000"
//   ]
// }

console.log('\n✅ All tests completed!');

