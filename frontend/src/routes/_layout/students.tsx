import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/_layout/students')({
  component: StudentsPage,
})

function StudentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
        Students
      </h2>
      <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
        Manage your student roster, track progress, and view performance metrics.
      </p>
      
      <div className="mt-12 w-full max-w-sm space-y-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="font-headline font-bold text-primary">JT</span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">Julian Thorne</h3>
            <p className="font-body text-sm text-primary">Advanced Calculus</p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <span className="font-headline font-bold text-secondary">ER</span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">Elena Rossi</h3>
            <p className="font-body text-sm text-primary">Modern Literature</p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center">
            <span className="font-headline font-bold text-tertiary">MK</span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">Marcus Kane</h3>
            <p className="font-body text-sm text-primary">Quantum Physics</p>
          </div>
        </div>
      </div>
    </div>
  )
}
