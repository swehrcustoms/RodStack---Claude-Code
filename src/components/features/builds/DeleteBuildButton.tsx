'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { deleteRodBuild } from '@/lib/actions/rod-builds'

export function DeleteBuildButton({ buildId }: { buildId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deleteRodBuild(buildId)
      router.push('/builds')
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-red-900/50 bg-red-950/20">
        <p className="text-sm text-red-400 flex-1">Delete this build permanently?</p>
        <Button
          variant="destructive"
          size="sm"
          loading={isPending}
          onClick={handleDelete}
        >
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      iconLeft={<Trash2 />}
      className="text-slate-500 hover:text-red-400 hover:bg-red-950/20"
    >
      Delete build
    </Button>
  )
}
