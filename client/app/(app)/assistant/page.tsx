import type { Metadata } from "next"

import { AssistantView } from "@/components/assistant/assistant-view"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Ask MseFunded AI",
  description:
    "A materials science and engineering expert: ask any MSE question, get your CV or statement of purpose reviewed, and plan your career.",
  alternates: { canonical: routes.assistant },
  robots: { index: false, follow: true },
}

export default function AssistantPage() {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Ask MseFunded AI</h1>
      <AssistantView />
    </div>
  )
}
