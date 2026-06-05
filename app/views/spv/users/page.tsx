"use client";

import { useState } from "react";
import { AddUserDialog } from "@/components/user/add-user-dialog";
import { UsersList } from "@/components/user/users-list";

interface User {
  id: string;
  email: string;
  nama: string;
  peran: string;
}

export default function UsersManagementPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserAdded = (user: User) => {
    // Trigger refresh of users list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah, atau nonaktifkan akun teknisi, manager, atau supervisor.
          </p>
        </div>
        <AddUserDialog onUserAdded={handleUserAdded} />
      </header>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Daftar User</h2>
        <UsersList refreshTrigger={refreshTrigger} />
      </div>
    </section>
  );
}
