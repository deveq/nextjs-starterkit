"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_LINKS } from "@/constants/nav"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

interface NavProps {
  className?: string
}

export function Nav({ className }: NavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
              isActive && "font-medium"
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
