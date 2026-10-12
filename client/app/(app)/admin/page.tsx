import { AdminGate } from "@/components/admin/admin-gate"
import { AdminSummary } from "@/components/admin/admin-summary"

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminSummary />
    </AdminGate>
  )
}
