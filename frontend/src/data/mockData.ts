// Mock data for BuildMind AI

export const kpiData = {
  activeProjects: 24,
  riskProjects: 7,
  onTimeProjects: 16,
  totalBudget: '$2.4B',
  openRisks: 43,
  recoveryPlans: 12,
}

export const projectHealthTrend = [
  { month: 'Jan', health: 72, risk: 28, onTime: 68 },
  { month: 'Feb', health: 68, risk: 32, onTime: 65 },
  { month: 'Mar', health: 75, risk: 25, onTime: 71 },
  { month: 'Apr', health: 71, risk: 29, onTime: 70 },
  { month: 'May', health: 78, risk: 22, onTime: 75 },
  { month: 'Jun', health: 74, risk: 26, onTime: 73 },
]

export const riskDistribution = [
  { name: 'Permit Delays', value: 28, color: '#ef4444' },
  { name: 'Supply Chain', value: 22, color: '#f97316' },
  { name: 'Labor Shortage', value: 18, color: '#eab308' },
  { name: 'Weather Events', value: 15, color: '#3b82f6' },
  { name: 'Design Changes', value: 10, color: '#8b5cf6' },
  { name: 'Other', value: 7, color: '#6b7280' },
]

export const recentAgentActivities = [
  {
    id: 1,
    agent: 'Risk Agent',
    action: 'Identified critical permit delay for Tower A - Downtown',
    time: '2 min ago',
    severity: 'critical',
    icon: 'shield',
  },
  {
    id: 2,
    agent: 'Recovery Agent',
    action: 'Generated 3 recovery strategies for Harbor Bridge Project',
    time: '8 min ago',
    severity: 'medium',
    icon: 'refresh',
  },
  {
    id: 3,
    agent: 'Blueprint Agent',
    action: 'Analyzed structural drawings for Metro Station Phase 2',
    time: '15 min ago',
    severity: 'info',
    icon: 'file',
  },
  {
    id: 4,
    agent: 'Contract Agent',
    action: 'Extracted 47 clauses from Riverside Complex contract',
    time: '22 min ago',
    severity: 'success',
    icon: 'check',
  },
  {
    id: 5,
    agent: 'Permit Agent',
    action: 'Flagged missing environmental permits for Zone B',
    time: '31 min ago',
    severity: 'warning',
    icon: 'alert',
  },
]

export const recentRecommendations = [
  {
    id: 1,
    project: 'Tower A - Downtown',
    recommendation: 'Accelerate permit applications via fast-track process. Estimated 3-week savings.',
    confidence: 91,
    impact: 'High',
    category: 'Permit',
  },
  {
    id: 2,
    project: 'Harbor Bridge',
    recommendation: 'Switch steel supplier to RegionalSteel Co. Mitigates 6-week supply chain risk.',
    confidence: 87,
    impact: 'Critical',
    category: 'Supply Chain',
  },
  {
    id: 3,
    project: 'Metro Station Phase 2',
    recommendation: 'Deploy 2 additional crew teams to foundation work. Prevents cascading delays.',
    confidence: 84,
    impact: 'High',
    category: 'Labor',
  },
]

export const projectData = {
  name: 'Tower A - Downtown Commercial Complex',
  projectId: 'BMD-2024-0847',
  client: 'Nexus Development Group',
  location: 'Downtown Financial District, Chicago, IL',
  budget: '$186.4M',
  duration: '28 months',
  startDate: 'March 2024',
  endDate: 'July 2026',
  floors: 42,
  complexity: 'High',
  type: 'Mixed-Use Commercial',
  squareFootage: '1.2M sq ft',
  requiredPermits: [
    { name: 'Building Permit', status: 'Approved', date: 'Jan 2024' },
    { name: 'Environmental Impact', status: 'Pending', date: 'Expected Mar 2024' },
    { name: 'Zoning Variance', status: 'Approved', date: 'Dec 2023' },
    { name: 'Fire Safety', status: 'In Review', date: 'Expected Feb 2024' },
    { name: 'Electrical Permit', status: 'Not Started', date: 'TBD' },
  ],
  crewRequirements: [
    { role: 'Structural Engineers', count: 12, status: 'Assigned' },
    { role: 'Project Managers', count: 5, status: 'Assigned' },
    { role: 'General Contractors', count: 8, status: 'Assigned' },
    { role: 'Electricians', count: 24, status: 'Partial' },
    { role: 'Steel Workers', count: 45, status: 'Recruiting' },
    { role: 'Concrete Crew', count: 30, status: 'Assigned' },
  ],
  phases: [
    { name: 'Planning & Design', status: 'completed', startDate: 'Mar 2024', endDate: 'May 2024', progress: 100 },
    { name: 'Permits & Approvals', status: 'in-progress', startDate: 'May 2024', endDate: 'Aug 2024', progress: 65 },
    { name: 'Foundation & Structure', status: 'in-progress', startDate: 'Jul 2024', endDate: 'Jan 2025', progress: 30 },
    { name: 'MEP Installation', status: 'pending', startDate: 'Jan 2025', endDate: 'Aug 2025', progress: 0 },
    { name: 'Interior Finishing', status: 'pending', startDate: 'Jun 2025', endDate: 'Mar 2026', progress: 0 },
    { name: 'Inspection & Handover', status: 'pending', startDate: 'Apr 2026', endDate: 'Jul 2026', progress: 0 },
  ],
}

export const riskData = {
  overallScore: 82,
  trend: 'increasing',
  topRisks: [
    {
      id: 1,
      name: 'Permit Delay',
      score: 91,
      category: 'Regulatory',
      probability: 'Very High',
      impact: 'Critical',
      description: 'Environmental Impact Assessment pending approval. City council review delayed by 6 weeks due to objections from neighboring properties.',
      mitigation: 'Engage specialized permit expeditor firm. Schedule emergency meeting with city planning department.',
      details: [
        'Environmental permit stuck at city council for 6+ weeks',
        'Two neighboring property owners filed formal objections',
        'Revised impact study required by EPA',
        'Affects foundation work start date',
      ],
    },
    {
      id: 2,
      name: 'Steel Supplier Delay',
      score: 78,
      category: 'Supply Chain',
      probability: 'High',
      impact: 'Critical',
      description: 'Primary steel supplier (MidWest Steel Corp) facing production backlog. Lead time extended from 8 to 20 weeks.',
      mitigation: 'Engage 2 backup suppliers immediately. Consider prefabrication alternatives.',
      details: [
        'MidWest Steel Corp at 95% capacity utilization',
        'Port strikes causing raw material delays',
        '20-week lead time vs. planned 8 weeks',
        'Structural steel delivery now risks being critical path',
      ],
    },
    {
      id: 3,
      name: 'Labor Shortage',
      score: 71,
      category: 'Workforce',
      probability: 'High',
      impact: 'High',
      description: '45 skilled steel workers needed; only 18 confirmed. Regional labor market tight due to 3 competing mega-projects.',
      mitigation: 'Contract with 2 subcontracting firms specializing in steel work. Offer premium wages.',
      details: [
        '60% of required steel crew unassigned',
        '3 competing mega-projects in same metro area',
        'Union negotiations ongoing',
        'Training pipeline insufficient for timeline',
      ],
    },
    {
      id: 4,
      name: 'Design Change Orders',
      score: 58,
      category: 'Design',
      probability: 'Medium',
      impact: 'High',
      description: 'Client requested 3 design modifications impacting floors 28-35. Structural re-analysis required.',
      mitigation: 'Implement design freeze protocol. Fast-track structural review.',
      details: [
        'Client requested additional mechanical room on floor 30',
        'Lobby redesign adds 3 weeks to architectural work',
        'Structural analysis needed for modified load paths',
      ],
    },
  ],
  heatmap: [
    [9, 7, 5, 3, 1],
    [8, 6, 4, 2, 1],
    [7, 5, 3, 2, 1],
    [6, 4, 3, 2, 1],
    [4, 3, 2, 1, 1],
  ],
  reasoningChain: [
    { step: 1, event: 'Permit Delay', confidence: 91, description: 'Environmental impact review stalled', color: '#ef4444' },
    { step: 2, event: 'Foundation Delay', confidence: 88, description: 'Excavation cannot begin', color: '#f97316' },
    { step: 3, event: 'Material Delivery Shift', confidence: 82, description: 'Rescheduled material orders', color: '#eab308' },
    { step: 4, event: 'Structural Steel Delay', confidence: 79, description: 'Critical path affected', color: '#f97316' },
    { step: 5, event: 'Inspection Delay', confidence: 74, description: 'City inspection queue backlog', color: '#ef4444' },
    { step: 6, event: 'Completion Risk', confidence: 68, description: 'Final handover at risk', color: '#dc2626' },
  ],
}

export const recoveryStrategies = [
  {
    id: 'A',
    name: 'Accelerated Parallel Path',
    description: 'Execute foundation work in parallel with permit processing using provisional approvals. Engage fast-track permit expeditor.',
    recommended: true,
    aiConfidence: 89,
    costImpact: '+$2.1M',
    timeSaved: '6.5 weeks',
    riskReduction: '34%',
    details: [
      'Hire permit expeditor firm (est. $180K)',
      'Begin foundation survey work immediately',
      'Pre-order long-lead structural steel',
      'Deploy additional engineering team for parallel review',
      'Negotiate provisional construction start with city',
    ],
    pros: ['Maximum time savings', 'Reduces critical path exposure', 'Recovers full schedule'],
    cons: ['Higher immediate cost', 'Requires regulatory negotiation'],
  },
  {
    id: 'B',
    name: 'Phased Recovery with Supplier Switch',
    description: 'Switch to backup steel supplier and restructure construction sequence to maximize productivity while permits are processed.',
    recommended: false,
    aiConfidence: 76,
    costImpact: '+$0.8M',
    timeSaved: '3.5 weeks',
    riskReduction: '21%',
    details: [
      'Engage RegionalSteel Co as primary supplier',
      'Resequence interior work to run during foundation delay',
      'Optimize crew allocation across shifts',
      'Defer non-critical scope items',
    ],
    pros: ['Lower additional cost', 'Less regulatory complexity'],
    cons: ['Recovers only partial schedule', 'Some risk remains'],
  },
  {
    id: 'C',
    name: 'Contract Amendment & Timeline Reset',
    description: 'Negotiate a formal extension with client and restructure contract milestones. Use savings from revised timeline for risk mitigation.',
    recommended: false,
    aiConfidence: 61,
    costImpact: '-$0.4M',
    timeSaved: '0 weeks',
    riskReduction: '15%',
    details: [
      'Negotiate 8-week extension with client',
      'Revise payment milestones',
      'Use timeline buffer for quality improvements',
      'Implement enhanced risk monitoring',
    ],
    pros: ['Net cost reduction', 'Lowest risk execution'],
    cons: ['No schedule recovery', 'Client relationship impact'],
  },
]

export const changeImpactData = {
  scenario: 'Add One Additional Floor (Floor 43)',
  description: 'Client requested addition of a 43rd floor for premium penthouse units. Analysis of downstream impacts across all project dimensions.',
  before: {
    floors: 42,
    budget: '$186.4M',
    duration: '28 months',
    permits: 5,
    crewSize: 124,
    structuralLoad: '85% capacity',
  },
  after: {
    floors: 43,
    budget: '$192.8M',
    duration: '30.5 months',
    permits: 6,
    crewSize: 136,
    structuralLoad: '96% capacity',
  },
  impacts: [
    {
      category: 'Budget Impact',
      icon: 'dollar',
      value: '+$6.4M',
      percentage: '+3.4%',
      severity: 'medium',
      details: ['Structural reinforcement: $2.1M', 'MEP extension: $1.8M', 'Finishes & glazing: $1.4M', 'Contingency: $1.1M'],
    },
    {
      category: 'Schedule Impact',
      icon: 'clock',
      value: '+2.5 months',
      percentage: '+8.9%',
      severity: 'high',
      details: ['Structural analysis: 3 weeks', 'Permit amendments: 4 weeks', 'Construction: 5 weeks', 'Total float consumed: 2.5 mo'],
    },
    {
      category: 'Permit Impact',
      icon: 'file',
      value: '1 New Permit',
      percentage: '+20%',
      severity: 'medium',
      details: ['Height variance amendment', 'Revised fire egress plan', 'Updated structural permit', 'FAA lighting notification'],
    },
    {
      category: 'Crew Impact',
      icon: 'users',
      value: '+12 Workers',
      percentage: '+9.7%',
      severity: 'low',
      details: ['Steel workers: +4', 'Electricians: +3', 'MEP technicians: +3', 'Finishing crew: +2'],
    },
  ],
  dependencies: [
    { from: 'Floor Addition', to: 'Structural Analysis', type: 'requires' },
    { from: 'Structural Analysis', to: 'Permit Amendment', type: 'requires' },
    { from: 'Structural Analysis', to: 'Foundation Review', type: 'triggers' },
    { from: 'Permit Amendment', to: 'Construction Start', type: 'blocks' },
    { from: 'Foundation Review', to: 'Structural Reinforcement', type: 'may require' },
    { from: 'Construction Start', to: 'Schedule Update', type: 'triggers' },
  ],
}

export const agentData = [
  {
    id: 'contract-agent',
    name: 'Contract Agent',
    icon: 'file-text',
    status: 'completed',
    confidence: 96,
    processingTime: '2m 14s',
    model: 'Gemini 2.0 Pro',
    latestFindings: [
      'Extracted 47 key contract clauses',
      'Identified 3 penalty clauses worth $4.2M',
      'Flagged ambiguous force majeure language',
      'Detected 6 milestone payment triggers',
    ],
    metrics: { docsProcessed: 3, clausesExtracted: 47, issuesFound: 4 },
  },
  {
    id: 'blueprint-agent',
    name: 'Blueprint Agent',
    icon: 'layers',
    status: 'completed',
    confidence: 93,
    processingTime: '4m 38s',
    model: 'Gemini 2.0 Vision',
    latestFindings: [
      'Analyzed 186 architectural drawings',
      'Detected 2 structural conflicts on Floor 18',
      'Identified MEP routing inefficiency saving $340K',
      'Confirmed building envelope specifications',
    ],
    metrics: { drawingsAnalyzed: 186, conflictsFound: 2, suggestionsGenerated: 8 },
  },
  {
    id: 'permit-agent',
    name: 'Permit Agent',
    icon: 'clipboard-check',
    status: 'warning',
    confidence: 88,
    processingTime: '1m 52s',
    model: 'Gemini 2.0 Flash',
    latestFindings: [
      'Environmental permit flagged as critical path',
      'Found 2 missing permit applications',
      'Permit timeline exceeds project schedule by 3 weeks',
      'Recommended fast-track process available',
    ],
    metrics: { permitsChecked: 12, missingPermits: 2, criticalFlags: 3 },
  },
  {
    id: 'risk-agent',
    name: 'Risk Agent',
    icon: 'shield-alert',
    status: 'running',
    confidence: 84,
    processingTime: '6m 11s (ongoing)',
    model: 'Gemini 2.0 Pro',
    latestFindings: [
      'Current overall risk score: 82/100 (Critical)',
      'Primary driver: Permit delay cascading impact',
      'Supply chain risk elevated to High severity',
      'Labor gap identified for steel crew positions',
    ],
    metrics: { risksIdentified: 43, criticalRisks: 7, mitigationsGenerated: 18 },
  },
  {
    id: 'recovery-agent',
    name: 'Recovery Agent',
    icon: 'refresh-cw',
    status: 'completed',
    confidence: 89,
    processingTime: '3m 27s',
    model: 'Gemini 2.0 Pro',
    latestFindings: [
      'Generated 3 recovery strategies',
      'Strategy A recommended with 89% confidence',
      'Identified $6.5M in potential cost avoidance',
      'Fast-track parallel path saves 6.5 weeks',
    ],
    metrics: { strategiesGenerated: 3, weeksRecoverable: 6.5, costAvoidance: '$6.5M' },
  },
]

export const agentTimeline = [
  { time: '09:00:12', agent: 'Contract Agent', event: 'Started document ingestion', type: 'start' },
  { time: '09:01:44', agent: 'Contract Agent', event: 'Extracted 47 clauses with 96% confidence', type: 'success' },
  { time: '09:01:45', agent: 'Blueprint Agent', event: 'Initiated visual analysis of 186 drawings', type: 'start' },
  { time: '09:02:14', agent: 'Contract Agent', event: 'Completed — flagged 3 penalty clauses', type: 'complete' },
  { time: '09:03:30', agent: 'Permit Agent', event: 'Cross-referenced permit requirements', type: 'info' },
  { time: '09:04:15', agent: 'Permit Agent', event: 'ALERT: 2 missing permits detected', type: 'warning' },
  { time: '09:05:23', agent: 'Blueprint Agent', event: 'Structural conflict found on Floor 18', type: 'warning' },
  { time: '09:06:23', agent: 'Blueprint Agent', event: 'Analysis complete — 2 conflicts, 8 suggestions', type: 'complete' },
  { time: '09:07:00', agent: 'Risk Agent', event: 'Initiated multi-factor risk assessment', type: 'start' },
  { time: '09:08:31', agent: 'Risk Agent', event: 'Risk score computed: 82/100 (Critical)', type: 'critical' },
  { time: '09:09:15', agent: 'Recovery Agent', event: 'Generating recovery strategies', type: 'start' },
  { time: '09:12:42', agent: 'Recovery Agent', event: 'Strategy A recommended: 6.5-week savings', type: 'success' },
  { time: '09:13:11', agent: 'Risk Agent', event: 'Continuing deep risk analysis...', type: 'running' },
]

// ── All Projects list (Dashboard) ─────────────────────────────
export const allProjects = [
  { id: 'tower-a',          name: 'Tower A — Downtown Core',         type: 'Commercial',     duration: '24 mo', progress: 68, status: 'on-track' as const, budget: '$340M',  risk: 82, icon: 'building' },
  { id: 'harbor-bridge',    name: 'Harbor Bridge Phase 2',           type: 'Infrastructure', duration: '36 mo', progress: 42, status: 'at-risk'  as const, budget: '$820M',  risk: 91, icon: 'road'     },
  { id: 'metro-station',    name: 'Metro Station Phase 2',           type: 'Transit',        duration: '18 mo', progress: 55, status: 'delayed'  as const, budget: '$290M',  risk: 67, icon: 'train'    },
  { id: 'riverside',        name: 'Riverside Residential Complex',   type: 'Residential',    duration: '12 mo', progress: 18, status: 'planning' as const, budget: '$140M',  risk: 28, icon: 'home'     },
  { id: 'airport-c',        name: 'Airport Terminal C Expansion',    type: 'Aviation',       duration: '30 mo', progress: 81, status: 'on-track' as const, budget: '$1.2B',  risk: 34, icon: 'plane'    },
  { id: 'central-park',     name: 'Central Park Plaza',              type: 'Mixed Use',      duration: '20 mo', progress: 34, status: 'delayed'  as const, budget: '$460M',  risk: 74, icon: 'trees'    },
  { id: 'northgate-tower',  name: 'Northgate Office Tower',          type: 'Commercial',     duration: '22 mo', progress: 72, status: 'on-track' as const, budget: '$275M',  risk: 31, icon: 'building' },
  { id: 'westline-rail',    name: 'Westline Rail Corridor',          type: 'Transit',        duration: '48 mo', progress: 29, status: 'at-risk'  as const, budget: '$1.8B',  risk: 88, icon: 'train'    },
  { id: 'bay-bridge',       name: 'Bay Bridge Retrofit',             type: 'Infrastructure', duration: '40 mo', progress: 61, status: 'on-track' as const, budget: '$620M',  risk: 45, icon: 'road'     },
  { id: 'lakeview-res',     name: 'Lakeview Residences Tower B',     type: 'Residential',    duration: '14 mo', progress: 47, status: 'on-track' as const, budget: '$195M',  risk: 22, icon: 'home'     },
  { id: 'civic-center',     name: 'Civic Center Renovation',         type: 'Government',     duration: '16 mo', progress: 88, status: 'on-track' as const, budget: '$88M',   risk: 19, icon: 'building' },
  { id: 'eastport-hotel',   name: 'Eastport Grand Hotel',            type: 'Hospitality',    duration: '26 mo', progress: 53, status: 'delayed'  as const, budget: '$310M',  risk: 61, icon: 'building' },
  { id: 'solar-farm-1',     name: 'Sunridge Solar Farm Phase 1',     type: 'Energy',         duration: '10 mo', progress: 94, status: 'on-track' as const, budget: '$72M',   risk: 12, icon: 'trees'    },
  { id: 'university-lib',   name: 'University Library Annex',        type: 'Education',      duration: '18 mo', progress: 37, status: 'planning' as const, budget: '$115M',  risk: 35, icon: 'building' },
  { id: 'waterfront-dev',   name: 'Waterfront Mixed Development',    type: 'Mixed Use',      duration: '32 mo', progress: 21, status: 'at-risk'  as const, budget: '$980M',  risk: 79, icon: 'trees'    },
  { id: 'southpark-tunnel', name: 'Southpark Road Tunnel',           type: 'Infrastructure', duration: '44 mo', progress: 15, status: 'planning' as const, budget: '$1.1B',  risk: 43, icon: 'road'     },
  { id: 'marina-plaza',     name: 'Marina Bay Plaza',                type: 'Commercial',     duration: '20 mo', progress: 76, status: 'on-track' as const, budget: '$255M',  risk: 27, icon: 'building' },
  { id: 'greenhill-villas', name: 'Greenhill Villas Estate',         type: 'Residential',    duration: '15 mo', progress: 62, status: 'on-track' as const, budget: '$160M',  risk: 18, icon: 'home'     },
  { id: 'transit-hub-d',    name: 'Transit Hub District D',          type: 'Transit',        duration: '28 mo', progress: 44, status: 'delayed'  as const, budget: '$540M',  risk: 71, icon: 'train'    },
  { id: 'tech-campus',      name: 'Tech Campus Phase 3',             type: 'Commercial',     duration: '18 mo', progress: 58, status: 'on-track' as const, budget: '$430M',  risk: 38, icon: 'building' },
  { id: 'stadium-roof',     name: 'City Stadium Roof Replacement',   type: 'Sports',         duration: '12 mo', progress: 83, status: 'on-track' as const, budget: '$95M',   risk: 24, icon: 'building' },
  { id: 'old-town-restore', name: 'Old Town Heritage Restoration',   type: 'Government',     duration: '24 mo', progress: 31, status: 'at-risk'  as const, budget: '$148M',  risk: 66, icon: 'building' },
  { id: 'airport-freight',  name: 'Airport Freight Terminal FX',     type: 'Aviation',       duration: '22 mo', progress: 9,  status: 'planning' as const, budget: '$375M',  risk: 41, icon: 'plane'    },
  { id: 'highland-park',    name: 'Highland Park Urban Renewal',     type: 'Mixed Use',      duration: '36 mo', progress: 48, status: 'delayed'  as const, budget: '$720M',  risk: 58, icon: 'trees'    },
]

export type ProjectStatus = 'on-track' | 'at-risk' | 'delayed' | 'planning'

export interface Project {
  id: string
  name: string
  type: string
  duration: string
  progress: number
  status: ProjectStatus
  budget: string
  risk: number
  icon: string
}
