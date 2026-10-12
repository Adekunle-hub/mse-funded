import { Suspense } from "react"

import { AdminGate } from "@/components/admin/admin-gate"
import { Loading } from "@/components/admin/admin-ui"
import { ListingsManager } from "@/components/admin/listings-manager"

export default function AdminListingsPage() {
  return (
    <AdminGate>
      <Suspense fallback={<Loading />}>
        <ListingsManager />
      </Suspense>
    </AdminGate>
  )
}
