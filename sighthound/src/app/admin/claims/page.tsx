'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ClaimWithSignedUrl {
  id: string
  user_id: string
  image_url: string
  signed_url: string
  description: string
  policy_tier: string
  payout: number | null
  damage_type: string[] | null
  created_at: string
  claim_verification: string
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimWithSignedUrl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllClaims = async () => {
      const { data: rawClaims, error } = await supabase
        .from('claims')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !rawClaims) {
        console.error('Error fetching claims:', error)
        setLoading(false)
        return
      }

      // Generate signed URLs for all images
      const claimsWithUrls = await Promise.all(
        rawClaims.map(async (claim) => {
          const filename = claim.image_url.split('/').pop() // extract file name
          const { data } = await supabase
            .storage
            .from('crash-images')
            .createSignedUrl(filename, 3600)

          return {
            ...claim,
            signed_url: data?.signedUrl ?? ''
          }
        })
      )

      setClaims(claimsWithUrls)
      setLoading(false)
    }

    fetchAllClaims()
  }, [])

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: All Claims</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading claims...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map(claim => (
            <div key={claim.id} className="border rounded-lg shadow bg-white overflow-hidden">
             <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={claim.signed_url}
                  alt="Crash"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <p><strong>User ID:</strong> {claim.user_id}</p>
                <p><strong>Description:</strong> {claim.description}</p>
                <p><strong>Policy:</strong> {claim.policy_tier}</p>
                <p><strong>Payout:</strong> {claim.payout !== null ? `$${claim.payout}` : 'Pending'}</p>
                {claim.damage_type && (
                  <p><strong>Damage:</strong> {claim.damage_type.join(', ')}</p>
                )}
                <p><strong>Claim Verification:</strong> {claim.claim_verification}</p>
                <p className="text-sm text-gray-500">
                  {new Date(claim.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
