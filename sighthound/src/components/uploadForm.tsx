'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function UploadForm() {
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [policy, setPolicy] = useState('Basic')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [damageTypes, setDamageTypes] = useState<string[]>([])
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  const [claimValidation, setClaimValidation] = useState<string | null>(null)
  const [claimReport, setClaimReport] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setDamageTypes([])
    setAnnotatedImage(null)
    setPayout(null)
    setClaimValidation(null)
    setClaimReport(null)

    if (!image) {
      setError('No image selected.')
      return
    }

    setUploading(true)

    const fileExt = image.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('crash-images')
      .upload(fileName, image)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/crash-images/${fileName}`

    const { data: sessionData } = await supabase.auth.getSession()
    const user_id = sessionData?.session?.user?.id ?? null

    if (!user_id) {
      setError('You must be logged in to submit a claim.')
      setUploading(false)
      return
    }

    // Store initial claim
    const { error: insertError } = await supabase.from('claims').insert({
      user_id,
      image_url: imageUrl,
      description,
      policy_tier: policy
    })

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
      return
    }

    // 🔍 YOLO damage prediction
    const fastApiResponse = await fetch("https://car-damage-api-442009244853.europe-west1.run.app/predict", {
      method: "POST",
      body: (() => {
        const formData = new FormData()
        formData.append("file", image)
        return formData
      })(),
    })

    if (!fastApiResponse.ok) {
      setError("Failed to analyze image.")
      setUploading(false)
      return
    }

    const result = await fastApiResponse.json()
    const detected = result.damage_type || []
    setDamageTypes(detected)
    setAnnotatedImage(`data:image/png;base64,${result.image}`)

    const damageCosts: { [key: string]: number } = {
      dent: 500,
      scratch: 200,
      crack: 800,
      "glass shatter": 1000,
      "light broken": 300,
      "tire flat": 150
    }

    const policyCaps: { [key: string]: number } = {
      Basic: 1000,
      Standard: 3000,
      Premium: 10000,
    }

    const rawCost = detected.reduce(
      (sum: number, type: string) => sum + (damageCosts[type] || 0),
      0
    )
    const cappedPayout = Math.min(rawCost, policyCaps[policy] || 0)
    setPayout(cappedPayout)

    // ✅ Gemini validation
    const validationRes = await fetch('/api/validateClaim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        damageTypes: detected
      })
    })
    const valData = await validationRes.json()
    setClaimValidation(valData.validation || '')

    // 🧾 Gemini summary
    const reportRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Summarize this car insurance claim:\nDescription: ${description}\nDetected damage: ${detected.join(', ')}\nPolicy: ${policy}\nEstimated payout: $${cappedPayout}`
          }]
        }]
      })
    })
    const reportJson = await reportRes.json()
    const report = reportJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    setClaimReport(report)

    // Update claim with final data
    await supabase
      .from('claims')
      .update({
        payout: cappedPayout,
        damage_type: detected,
        claim_verification: valData.validation,
        claim_report: report
      })
      .eq('image_url', imageUrl)

    setUploading(false)
    setMessage('Claim uploaded and analyzed successfully!')
    setImage(null)
    setPreviewUrl(null)
    setDescription('')
    setPolicy('Basic')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setImage(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div className="mb-4">
        <label htmlFor="image-upload" className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition">
          {image ? (
            <div>
              <p className="font-medium text-gray-700">Selected: {image.name}</p>
              <p className="text-sm text-gray-500">Click to change</p>
              {previewUrl && (
                <div className="mt-4 text-center">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded shadow" />
                  <p className="text-xs text-gray-500 mt-2">Image preview</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-gray-600">Click to upload or drag image here</p>
              <p className="text-sm text-gray-400">JPG, PNG, or GIF (max 10MB)</p>
            </div>
          )}
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} required className="hidden" />
      </div>

      <textarea placeholder="Describe the incident..." value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" rows={4} required />

      <select value={policy} onChange={e => setPolicy(e.target.value)} className="w-full border p-2 rounded">
        <option>Basic</option>
        <option>Standard</option>
        <option>Premium</option>
      </select>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Submit Claim'}
      </button>

      {message && (
        <div className="bg-green-100 text-green-700 text-sm p-3 rounded mt-2 text-center">{message}</div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded mt-2 text-center">{error}</div>
      )}

      {annotatedImage && (
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Predicted Damage & Estimate</h2>
          <div className="flex flex-col items-center space-y-3">
            <img src={annotatedImage} alt="Annotated" className="max-w-full rounded shadow-md" />
            <p className="text-sm text-gray-600">Damage detected: {damageTypes.join(", ") || "None"}</p>
            <p className="text-md font-medium text-blue-700">Estimated payout: ${payout}</p>
          </div>
        </div>
      )}

      {claimValidation && (
        <div className="mt-4 bg-yellow-100 p-3 rounded text-sm">
          <strong>Validation:</strong> {claimValidation}
        </div>
      )}

      {claimReport && (
        <div className="mt-4 bg-gray-100 p-3 rounded text-sm">
          <strong>Claim Summary:</strong> {claimReport}
        </div>
      )}
    </form>
  )
}
