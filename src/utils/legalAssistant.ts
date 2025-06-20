/**
 * Legal Information Assistant Utility
 * Provides jurisdiction-specific legal guidance with proper citations and structure
 */

export interface LegalResponse {
  requiresJurisdiction: boolean;
  response: string;
  jurisdiction?: string;
  citations?: string[];
  nextSteps?: string[];
  deadlines?: string[];
  agencies?: string[];
}

export interface LegalQuery {
  message: string;
  jurisdiction?: string;
  context?: string;
}

// Common legal jurisdictions and their legal systems
const JURISDICTIONS = {
  'US': {
    name: 'United States',
    legalSystem: 'Common Law',
    constitution: 'U.S. Constitution',
    primarySources: ['Federal Statutes', 'State Statutes', 'Case Law', 'Regulations']
  },
  'UK': {
    name: 'United Kingdom',
    legalSystem: 'Common Law',
    constitution: 'Unwritten Constitution',
    primarySources: ['Acts of Parliament', 'Case Law', 'Statutory Instruments']
  },
  'CA': {
    name: 'Canada',
    legalSystem: 'Common Law (except Quebec - Civil Law)',
    constitution: 'Constitution Act, 1982',
    primarySources: ['Federal Statutes', 'Provincial Statutes', 'Case Law']
  },
  'AU': {
    name: 'Australia',
    legalSystem: 'Common Law',
    constitution: 'Australian Constitution',
    primarySources: ['Commonwealth Acts', 'State Acts', 'Case Law']
  },
  'DE': {
    name: 'Germany',
    legalSystem: 'Civil Law',
    constitution: 'Basic Law (Grundgesetz)',
    primarySources: ['Federal Laws', 'State Laws', 'Regulations']
  },
  'FR': {
    name: 'France',
    legalSystem: 'Civil Law',
    constitution: 'Constitution of the Fifth Republic',
    primarySources: ['Civil Code', 'Criminal Code', 'Administrative Code']
  }
};

// Keywords that indicate legal questions requiring jurisdiction clarification
const LEGAL_KEYWORDS = [
  'law', 'legal', 'statute', 'regulation', 'constitution', 'rights', 'liability',
  'contract', 'agreement', 'lawsuit', 'court', 'judge', 'attorney', 'lawyer',
  'claim', 'damages', 'settlement', 'litigation', 'compliance', 'violation',
  'penalty', 'fine', 'criminal', 'civil', 'administrative', 'constitutional',
  'employment', 'discrimination', 'harassment', 'termination', 'wages',
  'property', 'real estate', 'intellectual property', 'copyright', 'trademark',
  'patent', 'privacy', 'data protection', 'consumer', 'business', 'corporate',
  'tax', 'immigration', 'family', 'divorce', 'custody', 'adoption',
  'personal injury', 'medical malpractice', 'insurance', 'bankruptcy'
];

/**
 * Detects if a message contains legal questions
 */
export function isLegalQuery(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return LEGAL_KEYWORDS.some(keyword => normalizedMessage.includes(keyword));
}

/**
 * Extracts jurisdiction from message if mentioned
 */
export function extractJurisdiction(message: string): string | null {
  const normalizedMessage = message.toLowerCase();
  
  // Check for explicit jurisdiction mentions
  for (const [code, info] of Object.entries(JURISDICTIONS)) {
    if (normalizedMessage.includes(info.name.toLowerCase()) ||
        normalizedMessage.includes(code.toLowerCase())) {
      return code;
    }
  }
  
  // Check for state/province mentions (US/Canada specific)
  const usStates = ['california', 'new york', 'texas', 'florida', 'illinois'];
  const canadianProvinces = ['ontario', 'quebec', 'british columbia', 'alberta'];
  
  if (usStates.some(state => normalizedMessage.includes(state))) {
    return 'US';
  }
  
  if (canadianProvinces.some(province => normalizedMessage.includes(province))) {
    return 'CA';
  }
  
  return null;
}

/**
 * Generates jurisdiction clarification request
 */
export function generateJurisdictionRequest(message: string): LegalResponse {
  return {
    requiresJurisdiction: true,
    response: `To provide accurate legal guidance, I need to confirm which country's laws apply to your situation.

**Your Question**: ${message}

**Jurisdiction Required**: Please specify which country or legal system governs your matter:

• **United States** - Federal and state law
• **United Kingdom** - English, Scottish, Welsh, or Northern Irish law  
• **Canada** - Federal and provincial law
• **Australia** - Commonwealth and state law
• **Germany** - Federal and state law
• **France** - French civil law
• **Other** - Please specify your country/jurisdiction

**Why This Matters**: Legal principles, statutes, and procedures vary significantly between jurisdictions. Providing jurisdiction-specific guidance ensures accuracy and relevance to your situation.

**Next Step**: Please reply with your jurisdiction so I can provide detailed, legally accurate information with proper citations and applicable law references.`
  };
}

/**
 * Generates structured legal response based on jurisdiction and query
 */
export function generateLegalResponse(query: LegalQuery): LegalResponse {
  const { message, jurisdiction, context } = query;
  
  if (!jurisdiction || !JURISDICTIONS[jurisdiction as keyof typeof JURISDICTIONS]) {
    return generateJurisdictionRequest(message);
  }

  const jurisdictionInfo = JURISDICTIONS[jurisdiction as keyof typeof JURISDICTIONS];
  
  // This is a simplified example - in a real implementation, this would
  // query actual legal databases and statutes
  const response = generateMockLegalResponse(message, jurisdiction, jurisdictionInfo);
  
  return {
    requiresJurisdiction: false,
    jurisdiction,
    ...response
  };
}

/**
 * Mock legal response generator (replace with actual legal database queries)
 */
function generateMockLegalResponse(message: string, jurisdiction: string, jurisdictionInfo: any) {
  const normalizedMessage = message.toLowerCase();
  
  // Employment law example
  if (normalizedMessage.includes('employment') || normalizedMessage.includes('workplace')) {
    return generateEmploymentLawResponse(jurisdiction, jurisdictionInfo);
  }
  
  // Contract law example
  if (normalizedMessage.includes('contract') || normalizedMessage.includes('agreement')) {
    return generateContractLawResponse(jurisdiction, jurisdictionInfo);
  }
  
  // Property law example
  if (normalizedMessage.includes('property') || normalizedMessage.includes('real estate')) {
    return generatePropertyLawResponse(jurisdiction, jurisdictionInfo);
  }
  
  // Generic legal response
  return generateGenericLegalResponse(jurisdiction, jurisdictionInfo);
}

function generateEmploymentLawResponse(jurisdiction: string, jurisdictionInfo: any) {
  const responses = {
    'US': {
      response: `**Applicable Law**: Employment law in the United States is governed by federal statutes and state-specific employment codes.

**Federal Legal Framework**:
According to Title VII of the Civil Rights Act of 1964 (42 U.S.C. § 2000e), the Fair Labor Standards Act (29 U.S.C. § 201), and the Americans with Disabilities Act (42 U.S.C. § 12101), employees have specific protections regarding:

• **Discrimination Protection**: Title VII prohibits discrimination based on race, color, religion, sex, or national origin
• **Wage and Hour Requirements**: FLSA mandates minimum wage ($7.25/hour federal) and overtime pay (1.5x regular rate for hours over 40/week)
• **Disability Accommodations**: ADA requires reasonable accommodations for qualified individuals with disabilities

**State-Specific Considerations**: State employment laws may provide additional protections beyond federal minimums. Many states have higher minimum wages, expanded discrimination protections, and additional leave requirements.`,
      citations: [
        'Title VII of the Civil Rights Act of 1964, 42 U.S.C. § 2000e',
        'Fair Labor Standards Act, 29 U.S.C. § 201',
        'Americans with Disabilities Act, 42 U.S.C. § 12101'
      ],
      nextSteps: [
        'Document any workplace incidents with dates and witnesses',
        'Review your employee handbook and employment contract',
        'File complaints with appropriate agencies if violations occurred',
        'Consult with an employment attorney for case-specific advice'
      ],
      deadlines: [
        'EEOC discrimination complaints: 180 days (300 days in some states)',
        'Wage and hour claims: 2-3 years depending on willfulness',
        'State-specific deadlines may vary'
      ],
      agencies: [
        'Equal Employment Opportunity Commission (EEOC)',
        'Department of Labor Wage and Hour Division',
        'State labor departments',
        'State civil rights agencies'
      ]
    },
    'UK': {
      response: `**Applicable Law**: Employment law in the United Kingdom is primarily governed by the Employment Rights Act 1996, Equality Act 2010, and common law principles.

**Legal Framework**:
According to the Employment Rights Act 1996 and Equality Act 2010:

• **Unfair Dismissal Protection**: Employees with 2+ years service have protection against unfair dismissal (Section 94, ERA 1996)
• **Discrimination Protection**: Equality Act 2010 prohibits discrimination based on protected characteristics
• **Minimum Wage**: National Minimum Wage Act 1998 sets minimum wage rates (currently £10.42/hour for adults 23+)
• **Working Time**: Working Time Regulations 1998 limit working hours to 48 hours/week average

**Notice Periods**: Statutory minimum notice periods range from 1 week (1 month-2 years service) to 12 weeks (12+ years service).`,
      citations: [
        'Employment Rights Act 1996, Section 94',
        'Equality Act 2010',
        'National Minimum Wage Act 1998',
        'Working Time Regulations 1998'
      ],
      nextSteps: [
        'Check your contract of employment for specific terms',
        'Gather evidence of any workplace issues',
        'Consider early conciliation through ACAS',
        'Seek advice from employment solicitor if needed'
      ],
      deadlines: [
        'Employment tribunal claims: 3 months less 1 day from incident',
        'Early conciliation must be attempted before tribunal claim',
        'Some claims have different time limits'
      ],
      agencies: [
        'Advisory, Conciliation and Arbitration Service (ACAS)',
        'Employment Tribunal Service',
        'Equality and Human Rights Commission',
        'HM Revenue and Customs (for minimum wage issues)'
      ]
    }
  };

  return responses[jurisdiction as keyof typeof responses] || generateGenericLegalResponse(jurisdiction, jurisdictionInfo);
}

function generateContractLawResponse(jurisdiction: string, jurisdictionInfo: any) {
  const responses = {
    'US': {
      response: `**Applicable Law**: Contract law in the United States is primarily governed by state common law and the Uniform Commercial Code (UCC) for sales of goods.

**Legal Framework**:
According to the Restatement (Second) of Contracts and state-specific contract law:

• **Contract Formation**: Requires offer, acceptance, and consideration (Restatement § 17)
• **Statute of Frauds**: Certain contracts must be in writing (varies by state, typically contracts over $500, real estate, contracts taking over 1 year)
• **Breach Remedies**: Expectation damages, reliance damages, or restitution (Restatement § 344)
• **UCC Application**: Sales of goods governed by UCC Article 2

**Key Principles**: Contracts must have mutual assent, consideration, capacity, and legality to be enforceable.`,
      citations: [
        'Restatement (Second) of Contracts § 17',
        'Restatement (Second) of Contracts § 344',
        'Uniform Commercial Code Article 2',
        'State-specific Statute of Frauds provisions'
      ],
      nextSteps: [
        'Review all contract terms and conditions carefully',
        'Document any breach or performance issues',
        'Attempt good faith resolution with other party',
        'Consult contract attorney for complex disputes'
      ],
      deadlines: [
        'Breach of contract claims: 3-6 years (varies by state)',
        'UCC sales contracts: 4 years from breach',
        'Written contracts generally have longer limitation periods'
      ],
      agencies: [
        'State courts for contract disputes',
        'Alternative dispute resolution providers',
        'State bar associations for attorney referrals'
      ]
    }
  };

  return responses[jurisdiction as keyof typeof responses] || generateGenericLegalResponse(jurisdiction, jurisdictionInfo);
}

function generatePropertyLawResponse(jurisdiction: string, jurisdictionInfo: any) {
  return generateGenericLegalResponse(jurisdiction, jurisdictionInfo);
}

function generateGenericLegalResponse(jurisdiction: string, jurisdictionInfo: any) {
  return {
    response: `**Applicable Law**: ${jurisdictionInfo.name} operates under a ${jurisdictionInfo.legalSystem} legal system, with primary authority derived from ${jurisdictionInfo.constitution}.

**Legal Framework**: 
The legal system in ${jurisdictionInfo.name} is based on ${jurisdictionInfo.primarySources.join(', ')}.

**General Guidance**: To provide specific legal advice for your situation, I need additional details about:

• **Specific circumstances** of your legal matter
• **Timeline** of relevant events  
• **Documentation** you have available
• **Actions** you have already taken
• **Specific legal area** (employment, contract, property, etc.)

**Important Note**: This information is general in nature and does not constitute legal advice specific to your situation.`,
    citations: [
      `${jurisdictionInfo.constitution}`,
      `${jurisdictionInfo.name} legal statutes and regulations`
    ],
    nextSteps: [
      'Gather all relevant documentation',
      'Document timeline of events',
      'Identify specific legal issues involved',
      'Consult with qualified attorney in your jurisdiction'
    ],
    deadlines: [
      'Limitation periods vary by type of legal claim',
      'Consult local statutes for specific deadlines'
    ],
    agencies: [
      `${jurisdictionInfo.name} court system`,
      'Local bar association',
      'Legal aid organizations',
      'Government legal information services'
    ]
  };
}

/**
 * Validates if sufficient information is provided for legal guidance
 */
export function validateLegalQuery(query: LegalQuery): {
  isValid: boolean;
  missingInfo: string[];
  clarifyingQuestions: string[];
} {
  const missingInfo: string[] = [];
  const clarifyingQuestions: string[] = [];

  if (!query.jurisdiction) {
    missingInfo.push('jurisdiction');
    clarifyingQuestions.push('Which country or legal system governs your matter?');
  }

  // Check for vague queries
  if (query.message.length < 20) {
    missingInfo.push('details');
    clarifyingQuestions.push('Can you provide more specific details about your legal situation?');
  }

  // Check for timeline information
  if (!query.message.toLowerCase().includes('when') && 
      !query.message.toLowerCase().includes('date') &&
      !query.message.toLowerCase().includes('time')) {
    clarifyingQuestions.push('When did the relevant events occur?');
  }

  return {
    isValid: missingInfo.length === 0,
    missingInfo,
    clarifyingQuestions
  };
}