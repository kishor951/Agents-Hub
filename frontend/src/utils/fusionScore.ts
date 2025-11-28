import { Agent } from '../types'

export interface FusionScore {
  overall: number
  compatibility: number
  skillSynergy: number
  traitHarmony: number
  traits: {
    complementary: string[]
    conflicting: string[]
    neutral: string[]
  }
  skillCombination: {
    unique: string[]
    duplicate: string[]
    total: number
  }
  recommendations: string[]
}

export const calculateFusionScore = (agentA: Agent & { fullData?: any }, agentB: Agent & { fullData?: any }): FusionScore => {
  const dataA = agentA.fullData || {}
  const dataB = agentB.fullData || {}

  // 1. Calculate Trait Harmony
  const traitsA = dataA.personality?.traits || []
  const traitsB = dataB.personality?.traits || []
  const { complementary, conflicting, neutral } = analyzeTraits(traitsA, traitsB)
  const traitHarmony = (complementary.length * 2 - conflicting.length) / Math.max(traitsA.length + traitsB.length, 1) * 100
  const normalizedTraitHarmony = Math.max(0, Math.min(100, traitHarmony))

  // 2. Calculate Skill Synergy
  const skillsA = extractSkills(dataA)
  const skillsB = extractSkills(dataB)
  const skillAnalysis = analyzeSkills(skillsA, skillsB)
  const skillSynergy = calculateSkillSynergy(skillAnalysis)

  // 3. Calculate Compatibility based on config breeding matrix
  const compatibility = calculateCompatibility(dataA, dataB)

  // 4. Calculate Overall Score (weighted average)
  const overall = (
    compatibility * 0.4 +
    normalizedTraitHarmony * 0.3 +
    skillSynergy * 0.3
  )

  // 5. Generate Recommendations
  const recommendations = generateRecommendations(
    agentA,
    agentB,
    complementary,
    conflicting,
    skillAnalysis
  )

  return {
    overall: Math.round(overall),
    compatibility: Math.round(compatibility),
    skillSynergy: Math.round(skillSynergy),
    traitHarmony: Math.round(normalizedTraitHarmony),
    traits: {
      complementary,
      conflicting,
      neutral
    },
    skillCombination: {
      unique: skillAnalysis.unique,
      duplicate: skillAnalysis.common,
      total: skillAnalysis.total
    },
    recommendations
  }
}

const analyzeTraits = (traitsA: string[], traitsB: string[]) => {
  const traitPairs: { [key: string]: string[] } = {
    // Complementary pairs
    'logical': ['creative', 'intuitive'],
    'precise': ['empathetic', 'collaborative'],
    'methodical': ['flexible', 'adaptable'],
    'technical': ['user-focused', 'creative'],
    'analytical': ['intuitive', 'creative'],
    'practical': ['theoretical', 'innovative'],
    'systematic': ['creative', 'spontaneous'],

    // Reverse mappings
    'creative': ['logical', 'systematic'],
    'intuitive': ['logical', 'precise'],
    'empathetic': ['precise', 'analytical'],
    'collaborative': ['precise', 'independent'],
    'flexible': ['methodical', 'rigid'],
    'adaptable': ['systematic', 'structured'],
    'user-focused': ['technical', 'data-focused'],
    'innovative': ['practical', 'traditional'],
  }

  const conflictPairs: { [key: string]: string[] } = {
    'rigid': ['flexible', 'adaptable'],
    'independent': ['collaborative', 'team-oriented'],
    'theoretical': ['practical'],
    'data-focused': ['user-focused'],
  }

  const complementary: string[] = []
  const conflicting: string[] = []
  const neutral: string[] = []

  traitsA.forEach(trait => {
    traitsB.forEach(otherTrait => {
      if (trait !== otherTrait) {
        if (traitPairs[trait]?.includes(otherTrait)) {
          if (!complementary.includes(`${trait} + ${otherTrait}`)) {
            complementary.push(`${trait} + ${otherTrait}`)
          }
        } else if (conflictPairs[trait]?.includes(otherTrait)) {
          if (!conflicting.includes(`${trait} vs ${otherTrait}`)) {
            conflicting.push(`${trait} vs ${otherTrait}`)
          }
        } else {
          if (!neutral.includes(`${trait} + ${otherTrait}`)) {
            neutral.push(`${trait} + ${otherTrait}`)
          }
        }
      }
    })
  })

  return { complementary, conflicting, neutral }
}

const extractSkills = (data: any): string[] => {
  const skills = new Set<string>()

  // From programming languages
  if (data.skills?.languages) {
    data.skills.languages.forEach((lang: any) => {
      skills.add(lang.name)
      if (lang.frameworks) {
        lang.frameworks.forEach((fw: string) => skills.add(fw))
      }
    })
  }

  // From specialization
  if (data.specialization?.focus_areas) {
    data.specialization.focus_areas.forEach((area: string) => {
      skills.add(area)
    })
  }

  // From tools
  if (data.tools?.categories) {
    data.tools.categories.forEach((cat: any) => {
      if (cat.tools) {
        cat.tools.forEach((tool: string) => skills.add(tool))
      }
    })
  }

  return Array.from(skills)
}

const analyzeSkills = (skillsA: string[], skillsB: string[]) => {
  const setA = new Set(skillsA.map(s => s.toLowerCase()))
  const setB = new Set(skillsB.map(s => s.toLowerCase()))

  const common = Array.from(setA).filter(s => setB.has(s))
  const uniqueA = Array.from(setA).filter(s => !setB.has(s))
  const uniqueB = Array.from(setB).filter(s => !setA.has(s))
  const unique = [...uniqueA, ...uniqueB]
  const total = new Set([...setA, ...setB]).size

  return {
    common,
    unique,
    total,
    synergy: unique.length / (common.length + 1) // Higher is better for unique skills
  }
}

const calculateSkillSynergy = (skillAnalysis: any): number => {
  // Balance between unique skills and common ground
  const uniqueRatio = skillAnalysis.unique.length / skillAnalysis.total * 100
  const commonRatio = skillAnalysis.common.length / skillAnalysis.total * 100

  // Optimal is 60% unique, 40% common
  const optimalScore = 100 - (Math.abs(uniqueRatio - 60) + Math.abs(commonRatio - 40)) / 2

  return Math.max(0, Math.min(100, optimalScore))
}

const calculateCompatibility = (dataA: any, dataB: any): number => {
  let score = 50 // Base score

  // Check breeding compatibility from config
  const compatibilityA = dataA.breeding?.good_partners || []
  const compatibilityB = dataB.breeding?.good_partners || []

  // Check if they mention each other as good partners
  const nameA = dataA.name?.toLowerCase() || ''
  const nameB = dataB.name?.toLowerCase() || ''

  if (compatibilityA.some((p: string) => p.toLowerCase().includes(nameB))) score += 20
  if (compatibilityB.some((p: string) => p.toLowerCase().includes(nameA))) score += 20

  // Check for poor partnerships
  const poorA = dataA.breeding?.poor_partners || []
  const poorB = dataB.breeding?.poor_partners || []

  if (poorA.some((p: string) => p.toLowerCase().includes(nameB))) score -= 20
  if (poorB.some((p: string) => p.toLowerCase().includes(nameA))) score -= 20

  // Different specializations increase compatibility
  const domainA = dataA.specialization?.primary_domain || ''
  const domainB = dataB.specialization?.primary_domain || ''

  if (domainA && domainB && domainA !== domainB) {
    score += 15
  }

  return Math.max(0, Math.min(100, score))
}

const generateRecommendations = (
  agentA: Agent & { fullData?: any },
  agentB: Agent & { fullData?: any },
  complementary: string[],
  conflicting: string[],
  skillAnalysis: any
): string[] => {
  const recommendations: string[] = []

  // Based on traits
  if (complementary.length > 0) {
    recommendations.push(`✓ Great trait combination: ${complementary[0]}`)
  }

  if (conflicting.length > 1) {
    recommendations.push(`⚠ Multiple conflicting traits detected - offspring may be unpredictable`)
  } else if (conflicting.length > 0) {
    recommendations.push(`⚠ Minor trait conflict: ${conflicting[0]} - manageable`)
  }

  // Based on skills
  if (skillAnalysis.unique.length > 10) {
    recommendations.push(`✓ Excellent skill diversity - hybrid will have broad capabilities`)
  }

  if (skillAnalysis.common.length > skillAnalysis.unique.length) {
    recommendations.push(`ℹ High skill overlap - offspring will be specialist in those areas`)
  }

  // Based on domains
  const dataA = agentA.fullData || {}
  const dataB = agentB.fullData || {}
  const domainA = dataA.specialization?.primary_domain
  const domainB = dataB.specialization?.primary_domain

  if (domainA && domainB && domainA !== domainB) {
    recommendations.push(`✓ Cross-domain expertise: ${domainA} + ${domainB} = unique hybrid`)
  }

  // Final recommendation
  if (skillAnalysis.unique.length > 5 && complementary.length >= 1) {
    recommendations.push(`🎯 Highly recommended breeding pair!`)
  } else if (conflicting.length > 2) {
    recommendations.push(`⚠ Risky breeding - consider other options`)
  }

  return recommendations
}

// Score interpretation
export const getScoreInterpretation = (score: number): { level: string; color: string; description: string } => {
  if (score >= 80) {
    return {
      level: 'Excellent',
      color: '#4ade80',
      description: 'Outstanding compatibility - highly recommended'
    }
  } else if (score >= 60) {
    return {
      level: 'Good',
      color: '#64c8ff',
      description: 'Good compatibility - recommended'
    }
  } else if (score >= 40) {
    return {
      level: 'Fair',
      color: '#fbbf24',
      description: 'Moderate compatibility - proceed with caution'
    }
  } else {
    return {
      level: 'Poor',
      color: '#ef4444',
      description: 'Low compatibility - not recommended'
    }
  }
}
