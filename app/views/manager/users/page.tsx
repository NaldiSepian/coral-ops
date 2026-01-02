"use client";

import { useState } from "react";
import { UsersList } from "@/components/user/users-list";

export default function ManagerUsersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">
            Lihat daftar teknisi, manager, dan supervisor.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Daftar User</h2>
        <UsersList refreshTrigger={refreshTrigger} isReadOnly={true} />
      </div>
    </section>
  );
}