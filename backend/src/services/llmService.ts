import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
})

export async function queryAgent(
  personaPrompt: string,
  skills: string[],
  query: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    // Return mock response for demo
    return `[Demo Mode] As an agent with skills in ${skills.join(', ')}, I would help you with: ${query}. My expertise includes ${personaPrompt}.`
  }

  try {
    const systemPrompt = `You are an AI agent with the following persona: ${personaPrompt}. Your skills are: ${skills.join(', ')}. Respond helpfully based on your skills and persona.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'No response generated.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    return `Error querying agent: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
