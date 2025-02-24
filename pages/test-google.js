// pages/test-google.js
'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function TestGoogle() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Check for error in URL
        if (router.query.error) {
            setError(router.query.error)
        }

        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [router.query.error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                        Authentication error: {error}
                    </div>
                )}

                {session ? (
                    <div className="p-4 bg-white rounded-lg shadow">
                        <p className="mb-4">Logged in as: {session.user.email}</p>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <Auth
                            supabaseClient={supabase}
                            view="sign_in"
                            appearance={{ theme: ThemeSupa }}
                            theme="dark"
                            showLinks={false}
                            providers={['google']}
                            redirectTo="http://localhost:3000/auth/callback"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
