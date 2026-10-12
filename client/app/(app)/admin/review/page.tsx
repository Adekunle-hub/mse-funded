import { AdminGate } from "@/components/admin/admin-gate"
import { ReviewQueue } from "@/components/admin/review-queue"

export default function AdminReviewPage() {
  return (
    <AdminGate>
      <ReviewQueue />
    </AdminGate>
  )
}
