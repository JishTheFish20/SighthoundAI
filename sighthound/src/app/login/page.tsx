'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navBar'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return alert(error.message)
      setMessage('Sign up successful! Please check your email to confirm.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return alert(error.message)
      router.push('/')
    }
  }

  return (
    <div className='min-h-screen bg-stone-50 text-white'>
        <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow text-stone-50 bg-stone-900">
            <h1 className="text-xl font-bold mb-4">{isSignup ? 'Sign Up' : 'Login'}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border p-2 rounded"
                required
                />
                <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border p-2 rounded"
                required
                />
                
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                {isSignup ? 'Sign Up' : 'Login'}
                </button>

            </form>
                <button
                onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    })
                    if (error) alert(error.message)
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded mt-4 cursor-pointer"
                >
                Continue with Google
                </button>
            <p className="mt-4 text-center text-sm">
                {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
                <button
                className="text-blue-600 underline cursor-pointer"
                onClick={() => setIsSignup(!isSignup)}
                >
                {isSignup ? 'Login' : 'Sign up'}
                </button>
            </p>

            {message && (
                <div className="bg-green-600 text-white text-sm rounded p-3 mt-4">
                    {message}
                </div>
                )}
        </div>
    </div>
  )
}
