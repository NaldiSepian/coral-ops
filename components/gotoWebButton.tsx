import Link from "next/link";
import { Button } from "./ui/button";

export function GotoWebButton() {
  return (
    <>
      <Link href="https://coral.web.id" target="_blank">
        <Button className="flex items-center gap-2 bg-orange-600 text-white" size="sm">
          <span>coral.web.id</span>
        </Button>
      </Link>
    </>
  );
}
