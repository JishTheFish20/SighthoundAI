'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ClaimWithSignedUrl {
  id: string
  description: string
  policy_tier: string
  payout: number | null
  damage_type: string[] | null
  created_at: string
  image_url: string
  signed_url: string
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimWithSignedUrl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserClaims = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user_id = sessionData?.session?.user?.id

      if (!user_id) {
        setClaims([])
        setLoading(false)
        return
      }

      const { data: rawClaims, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (error || !rawClaims) {
        console.error('Error fetching claims:', error)
        setLoading(false)
        return
      }

      // Generate signed URLs for each image
      const claimsWithUrls = await Promise.all(
        rawClaims.map(async (claim) => {
          const path = claim.image_url.split('/').pop() // assumes filename only
          const { data } = await supabase
            .storage
            .from('crash-images')
            .createSignedUrl(path, 3600)

          return {
            ...claim,
            signed_url: data?.signedUrl ?? ''
          }
        })
      )

      setClaims(claimsWithUrls)
      setLoading(false)
    }

    fetchUserClaims()
  }, [])

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Claims</h1>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : claims.length === 0 ? (
        <p className="text-gray-400 text-center">No claims yet.</p>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => (
            <div key={claim.id} className="border rounded-lg shadow bg-white overflow-hidden">
             <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={claim.signed_url}
                  alt="Crash"
                  className="w-full h-full object-cover"
                />
              </div>
              <p><strong>Description:</strong> {claim.description}</p>
              <p><strong>Policy:</strong> {claim.policy_tier}</p>
              <p><strong>Payout:</strong> {claim.payout !== null ? `$${claim.payout}` : 'Pending'}</p>
              {claim.damage_type && (
                <p><strong>Damage:</strong> {claim.damage_type.join(', ')}</p>
              )}
              <p className="text-sm text-gray-500">{new Date(claim.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
