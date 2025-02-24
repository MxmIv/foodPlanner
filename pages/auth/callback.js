// pages/auth/callback.js
'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        // Check if we have a hash in the URL
        if (window.location.hash) {
            // Handle the redirect automatically
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    router.push('/test-google')
                }
            })
        } else {
            const handleCallback = async () => {
                try {
                    const { code, error } = router.query

                    if (error) {
                        console.error('OAuth error:', error)
                        await router.push('/test-google?error=' + error)
                        return
                    }

                    if (code) {
                        const { error } = await supabase.auth.exchangeCodeForSession(code)
                        if (error) throw error
                    }

                    await router.push('/test-google')
                } catch (e) {
                    console.error('Session error:', e)
                    await router.push('/test-google?error=session')
                }
            }

            if (router.isReady) {
                handleCallback()
            }
        }
    }, [router.isReady, router.query])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-4 max-w-md rounded-lg bg-white shadow">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-gray-500">Processing authentication...</p>
            </div>
        </div>
    )
}
