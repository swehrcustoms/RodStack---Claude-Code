'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialDisplayName: string
  email: string
}

export function ProfileForm({ userId, initialDisplayName, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, display_name: displayName.trim() || null })

      if (upsertError) {
        setError(upsertError.message)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Display name"
        placeholder="Rod Builder"
        value={displayName}
        onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
      />
      <Input
        label="Email"
        value={email}
        disabled
        hint="Email cannot be changed here."
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Profile saved.</p>}
      <Button onClick={handleSave} loading={isPending} size="sm">
        Save profile
      </Button>
    </div>
  )
}
