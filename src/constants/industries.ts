/**
 * Comprehensive Industry List (Alphabetically Sorted)
 * Used across: Onboarding, New Scan Modal, Settings
 */

export const INDUSTRIES = [
  'Administrative & Support Services',
  'Aerospace & Defense',
  'Agriculture, Forestry, Fishing & Hunting',
  'Architecture & Urban Planning',
  'Arts & Culture',
  'Automotive',
  'Automotive Services & Repair',
  'Banking',
  'Biotechnology',
  'Chemical Industry',
  'Consulting & Advisory',
  'Construction',
  'Cybersecurity',
  'E-commerce',
  'Education & Training',
  'Fashion & Apparel & Textile',
  'Finance & Insurance',
  'Fintech & Digital Payments',
  'Food & Beverage',
  'Gaming & Interactive Media',
  'Health Care & Medical',
  'Hospitality & Accommodation',
  'HR & Recruitment',
  'Information Technology',
  'Legal Services',
  'Logistics & Supply Chain',
  'Management of Companies & Enterprises',
  'Manufacturing',
  'Maritime & Shipping',
  'Marketing & Advertising',
  'Media & Entertainment',
  'Mental Health & Wellness',
  'Mining & Quarrying',
  'Nonprofit & Social Enterprise',
  'Oil & Gas',
  'Pharmaceutical & Life Sciences',
  'Professional, Scientific & Technical Services',
  'Public Administration & Government',
  'Publishing & Print',
  'Real Estate & Property',
  'Renewable Energy & Clean Tech',
  'Restaurant & Food Services',
  'Retail Trade',
  'Security & Investigation Services',
  'Social Services & Community',
  'Sports & Fitness',
  'Technology (AI, Robotics & Emerging Tech)',
  'Telecommunications',
  'Tourism & Travel',
  'Transportation',
  'Utilities',
  'Waste Management & Environmental Services',
  'Wholesale Trade'
] as const

export type Industry = typeof INDUSTRIES[number]

/**
 * Check if a string is a valid industry
 */
export function isValidIndustry(value: string): value is Industry {
  return INDUSTRIES.includes(value as Industry)
}

/**
 * Get display name for an industry (fallback for unknown)
 */
export function getIndustryDisplayName(industry: string | null | undefined): string {
  if (!industry) return 'Unknown Industry'
  if (isValidIndustry(industry)) return industry
  return industry // Return as-is if not in list (for backward compat)
}
