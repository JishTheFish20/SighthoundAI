'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching role:', error)
        }

        if (data?.role === 'admin') {
          setIsAdmin(true)
        }
      }
    }

    fetchUserAndRole()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.push('/login')
  }

  return (
    <nav className="bg-stone-900 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-yellow-300">
          Sighthound AI
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/claims" className="hover:text-yellow-300">
            Your Claims
          </Link>
          {isAdmin && (
            <Link href="/admin/claims" className="hover:text-yellow-300">
              Admin Dashboard
            </Link>
          )}
          {user ? (
            <>
              <span className="text-sm text-gray-300">{user.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-yellow-300">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
