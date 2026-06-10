/**
 * AI Personality Configuration
 */

const PERSONALITY_PROMPTS: Record<string, string> = {
  friendly: 'You are a friendly and encouraging AI tutor. Be supportive, motivating, and celebrate student progress. Use positive language and emojis occasionally.',
  professional: 'You are a professional academic tutor. Be formal, structured, and focus on clarity. Use precise academic language without emojis.',
  socratic: 'You are a Socratic tutor who guides students through questioning. Ask thought-provoking questions that help students discover answers themselves. Encourage critical thinking.',
  concise: 'You are a concise tutor. Give brief, direct answers. Be efficient and to-the-point without unnecessary elaboration.',
  detailed: 'You are a thorough tutor. Provide detailed explanations with examples, analogies, and comprehensive coverage of topics.',
}

/**
 * Get the current AI personality system prompt
 */
export function getAISystemPrompt(): string {
  const personality = localStorage.getItem('ai_personality') || 'friendly'
  
  if (personality === 'custom') {
    const customPrompt = localStorage.getItem('ai_custom_prompt') || ''
    return customPrompt || PERSONALITY_PROMPTS.friendly
  }
  
  return PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.friendly
}

/**
 * Prepend personality to a user prompt
 */
export function withPersonality(userPrompt: string): string {
  const systemPrompt = getAISystemPrompt()
  return `${systemPrompt}\n\n${userPrompt}`
}
