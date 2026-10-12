import { AdminGate } from "@/components/admin/admin-gate"
import { SourcesManager } from "@/components/admin/sources-manager"

export default function AdminSourcesPage() {
  return (
    <AdminGate>
      <SourcesManager />
    </AdminGate>
  )
}
