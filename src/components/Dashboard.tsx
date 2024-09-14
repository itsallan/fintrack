'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function Dashboard({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to FinTrack, {user.email}</h1>
      <p className="mb-4">Your personal finance tracker and receipt manager</p>
      <div className="space-x-4">
        <Button asChild>
          <Link href="/dashboard">View Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/add-receipt">Add Receipt</Link>
        </Button>
      </div>
      <Button onClick={handleSignOut} className="mt-4">Sign out</Button>
    </div>
  )
}