import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

export async function POST(req: NextRequest) {
  const { description, damageTypes } = await req.json()

  // Authenticate using service account JSON
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  })
  const token = await auth.getAccessToken()

  const prompt = `
A user submitted a car insurance claim.

Description: "${description}"
Detected damage types from image analysis: [${damageTypes.join(', ')}]

Does the description align with the actual detected damage? If not, explain what appears to be inaccurate or exaggerated.`

  // Vertex AI endpoint for Gemini 2.5 Flash
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_GCP_PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-flash:streamGenerateContent`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    })
  })

  if (!response.ok) {
    return NextResponse.json({ validation: 'Validation failed.' }, { status: 500 })
  }

  const reader = response.body?.getReader()
  let text = ''
  const decoder = new TextDecoder()

  while (reader) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const match = chunk.match(/"text"\s*:\s*"([^"]*)"/)
    if (match) text += match[1]
  }

  return NextResponse.json({ validation: text.trim() })
}
