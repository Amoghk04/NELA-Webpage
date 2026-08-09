export const ONBOARDING_OCCUPATIONS = [
  { id: 'student', label: 'Student' },
  { id: 'professional', label: 'Professional' },
  { id: 'freelancer', label: 'Freelancer' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'educator', label: 'Educator' },
  { id: 'hobbyist', label: 'Hobbyist' },
  { id: 'other', label: 'Other' },
] as const;

export const ONBOARDING_FIELDS = [
  { id: 'software', label: 'Software & Engineering' },
  { id: 'design', label: 'Design & Creative' },
  { id: 'business', label: 'Business & Finance' },
  { id: 'science', label: 'Science & Research' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'legal', label: 'Legal' },
  { id: 'other', label: 'Other' },
] as const;

export type OnboardingOccupationId =
  (typeof ONBOARDING_OCCUPATIONS)[number]['id'];
export type OnboardingFieldId = (typeof ONBOARDING_FIELDS)[number]['id'];
