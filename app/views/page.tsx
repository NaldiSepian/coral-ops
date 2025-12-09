// Redirect user ke views sesuai role
import { getUserRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ViewsPage() {
  const role = await getUserRole();
  if (role === "Supervisor") return redirect("/views/spv");
  if (role === "Manager") return redirect("/views/manager");
  if (role === "Teknisi") return redirect("/views/teknisi");
  return redirect("/login");
}
