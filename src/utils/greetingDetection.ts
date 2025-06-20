/**
 * Greeting Detection Utility for Legal Advisor AI
 * Detects greeting patterns and provides appropriate legal advisory responses
 */

// Define greeting patterns
const GREETING_PATTERNS = [
  'hi',
  'hello',
  'hey',
  'good morning',
  'good afternoon', 
  'good evening',
  'greetings',
  'hola',
  'howdy',
  'what\'s up',
  'whats up',
  'sup',
  'yo',
  'salutations',
  'good day',
  'morning',
  'afternoon',
  'evening'
];

// Legal advisory greeting response
const LEGAL_ADVISOR_GREETING = `Hello! I'm your Legal Advisor AI, ready to assist you with legal matters. I can help by:

• **Reviewing and analyzing legal documents** you upload
• **Answering questions about laws and regulations**
• **Providing guidance on legal procedures**

What legal assistance can I provide for you today?`;

/**
 * Checks if a message matches greeting patterns
 * @param message - User input message
 * @returns boolean indicating if message is a greeting
 */
export function isGreeting(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  // Normalize the message: lowercase, trim, remove punctuation
  const normalizedMessage = message
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace

  // Check for exact matches
  if (GREETING_PATTERNS.includes(normalizedMessage)) {
    return true;
  }

  // Check if message starts with a greeting pattern
  const startsWithGreeting = GREETING_PATTERNS.some(pattern => 
    normalizedMessage.startsWith(pattern + ' ') || normalizedMessage === pattern
  );

  if (startsWithGreeting) {
    return true;
  }

  // Check for greeting patterns at the beginning of longer messages
  const words = normalizedMessage.split(' ');
  if (words.length > 0) {
    const firstWord = words[0];
    const firstTwoWords = words.slice(0, 2).join(' ');
    const firstThreeWords = words.slice(0, 3).join(' ');

    return GREETING_PATTERNS.includes(firstWord) || 
           GREETING_PATTERNS.includes(firstTwoWords) ||
           GREETING_PATTERNS.includes(firstThreeWords);
  }

  return false;
}

/**
 * Gets the appropriate legal advisor greeting response
 * @returns string containing the legal advisor greeting
 */
export function getLegalAdvisorGreeting(): string {
  return LEGAL_ADVISOR_GREETING;
}

/**
 * Processes user message and returns appropriate response
 * @param message - User input message
 * @returns object with isGreeting flag and response
 */
export function processUserMessage(message: string): {
  isGreeting: boolean;
  response?: string;
} {
  const greetingDetected = isGreeting(message);
  
  if (greetingDetected) {
    return {
      isGreeting: true,
      response: getLegalAdvisorGreeting()
    };
  }

  return {
    isGreeting: false
  };
}

/**
 * Validates if a message should trigger greeting response
 * Additional checks to avoid false positives
 * @param message - User input message
 * @returns boolean indicating if greeting response should be triggered
 */
export function shouldTriggerGreeting(message: string): boolean {
  if (!isGreeting(message)) {
    return false;
  }

  // Don't trigger greeting for very long messages that happen to start with greetings
  if (message.length > 100) {
    return false;
  }

  // Don't trigger if message contains legal-specific terms (user likely asking a real question)
  const legalTerms = [
    'contract', 'law', 'legal', 'attorney', 'lawyer', 'court', 'case', 'document',
    'agreement', 'liability', 'rights', 'lawsuit', 'claim', 'evidence', 'statute',
    'regulation', 'compliance', 'violation', 'damages', 'settlement', 'litigation'
  ];

  const normalizedMessage = message.toLowerCase();
  const containsLegalTerms = legalTerms.some(term => 
    normalizedMessage.includes(term)
  );

  if (containsLegalTerms) {
    return false;
  }

  return true;
}