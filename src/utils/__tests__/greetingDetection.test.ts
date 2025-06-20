/**
 * Test suite for greeting detection functionality
 */

import { isGreeting, shouldTriggerGreeting, processUserMessage, getLegalAdvisorGreeting } from '../greetingDetection';

describe('Greeting Detection', () => {
  describe('isGreeting', () => {
    test('should detect basic greetings', () => {
      expect(isGreeting('hi')).toBe(true);
      expect(isGreeting('hello')).toBe(true);
      expect(isGreeting('hey')).toBe(true);
      expect(isGreeting('good morning')).toBe(true);
      expect(isGreeting('good afternoon')).toBe(true);
      expect(isGreeting('good evening')).toBe(true);
      expect(isGreeting('greetings')).toBe(true);
      expect(isGreeting('hola')).toBe(true);
    });

    test('should handle case insensitivity', () => {
      expect(isGreeting('HI')).toBe(true);
      expect(isGreeting('Hello')).toBe(true);
      expect(isGreeting('GOOD MORNING')).toBe(true);
      expect(isGreeting('Hey There')).toBe(true);
    });

    test('should handle punctuation', () => {
      expect(isGreeting('hi!')).toBe(true);
      expect(isGreeting('hello.')).toBe(true);
      expect(isGreeting('hey,')).toBe(true);
      expect(isGreeting('good morning!')).toBe(true);
    });

    test('should handle greetings with additional text', () => {
      expect(isGreeting('hi there')).toBe(true);
      expect(isGreeting('hello everyone')).toBe(true);
      expect(isGreeting('good morning team')).toBe(true);
    });

    test('should not detect non-greetings', () => {
      expect(isGreeting('what is a contract')).toBe(false);
      expect(isGreeting('I need legal help')).toBe(false);
      expect(isGreeting('can you review this document')).toBe(false);
      expect(isGreeting('')).toBe(false);
      expect(isGreeting('   ')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isGreeting(null as any)).toBe(false);
      expect(isGreeting(undefined as any)).toBe(false);
      expect(isGreeting(123 as any)).toBe(false);
    });
  });

  describe('shouldTriggerGreeting', () => {
    test('should trigger for simple greetings', () => {
      expect(shouldTriggerGreeting('hi')).toBe(true);
      expect(shouldTriggerGreeting('hello')).toBe(true);
      expect(shouldTriggerGreeting('good morning')).toBe(true);
    });

    test('should not trigger for long messages', () => {
      const longMessage = 'hi there, I have a really long question about contract law and need detailed assistance with understanding the implications of various clauses in my employment agreement';
      expect(shouldTriggerGreeting(longMessage)).toBe(false);
    });

    test('should not trigger when legal terms are present', () => {
      expect(shouldTriggerGreeting('hi, I need help with a contract')).toBe(false);
      expect(shouldTriggerGreeting('hello, what are my legal rights')).toBe(false);
      expect(shouldTriggerGreeting('good morning, I need an attorney')).toBe(false);
    });

    test('should trigger for greetings without legal context', () => {
      expect(shouldTriggerGreeting('hi there')).toBe(true);
      expect(shouldTriggerGreeting('hello everyone')).toBe(true);
      expect(shouldTriggerGreeting('good morning team')).toBe(true);
    });
  });

  describe('processUserMessage', () => {
    test('should return greeting response for greetings', () => {
      const result = processUserMessage('hello');
      expect(result.isGreeting).toBe(true);
      expect(result.response).toContain('Legal Advisor AI');
      expect(result.response).toContain('legal matters');
    });

    test('should not return greeting response for non-greetings', () => {
      const result = processUserMessage('what is a contract');
      expect(result.isGreeting).toBe(false);
      expect(result.response).toBeUndefined();
    });

    test('should not return greeting response when legal terms present', () => {
      const result = processUserMessage('hi, I need legal help');
      expect(result.isGreeting).toBe(false);
      expect(result.response).toBeUndefined();
    });
  });

  describe('getLegalAdvisorGreeting', () => {
    test('should return consistent greeting message', () => {
      const greeting = getLegalAdvisorGreeting();
      expect(greeting).toContain('Legal Advisor AI');
      expect(greeting).toContain('legal matters');
      expect(greeting).toContain('Reviewing and analyzing legal documents');
      expect(greeting).toContain('Answering questions about laws and regulations');
      expect(greeting).toContain('Providing guidance on legal procedures');
    });

    test('should maintain formal yet approachable tone', () => {
      const greeting = getLegalAdvisorGreeting();
      expect(greeting).toContain('Hello!');
      expect(greeting).toContain('What legal assistance can I provide for you today?');
    });
  });
});