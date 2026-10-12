import { AdminGate } from "@/components/admin/admin-gate"
import { ReportsList } from "@/components/admin/reports-list"

export default function AdminReportsPage() {
  return (
    <AdminGate>
      <ReportsList />
    </AdminGate>
  )
}
