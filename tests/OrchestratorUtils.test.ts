import { describe, it, expect } from 'vitest';
import { parseDelegation } from '../src/core/OrchestratorUtils.js';

describe('parseDelegation', () => {
  it('should parse a standard delegation', () => {
    const output = `I think I need help with this.
>>>DELEGATE @FrontendAgent<<<
Please create a React button that is red.`;
    
    const result = parseDelegation(output);
    expect(result).not.toBeNull();
    expect(result?.subAgentName).toBe('FrontendAgent');
    expect(result?.subTask).toBe('Please create a React button that is red.');
  });

  it('should return null if no delegation tag', () => {
    const output = `I can handle this myself.
Here is the code:
console.log("hello");`;
    
    const result = parseDelegation(output);
    expect(result).toBeNull();
  });
});
