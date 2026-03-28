import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to TutorPal
        </h1>
        <p className="text-gray-600">
          Your personalized learning companion
        </p>
      </div>
    </div>
  )
}
