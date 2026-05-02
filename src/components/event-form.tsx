'use client'

import { useActionState } from 'react'
import { createEventAction } from '@/app/(dashboard)/events/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: { message?: string } = {}

export function EventForm() {
  const [state, formAction, pending] = useActionState(createEventAction, initialState)

  return (
    <form action={formAction} className="max-w-2xl">
      <Card className="rounded-[2rem] border-border/60 shadow-sm">
        <CardHeader className="space-y-2 p-6 sm:p-8">
          <CardTitle className="text-2xl">Event details</CardTitle>
          <CardDescription>
            Create the event shell. Warehouse will photograph the pullsheet before counting starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-6 pt-0 sm:grid-cols-2 sm:p-8 sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" name="name" placeholder="Jones wedding" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">Event date</Label>
            <Input id="event_date" name="event_date" type="date" required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
              {pending ? 'Creating…' : 'Create event'}
            </Button>
          </div>
          {state.message ? <p className="text-sm text-destructive sm:col-span-2">{state.message}</p> : null}
        </CardContent>
      </Card>
    </form>
  )
}
