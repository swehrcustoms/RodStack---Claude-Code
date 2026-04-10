'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { signOut } from '@/lib/actions/auth'

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={isPending}
      onClick={handleSignOut}
      iconLeft={<LogOut />}
    >
      Sign out
    </Button>
  )
}
