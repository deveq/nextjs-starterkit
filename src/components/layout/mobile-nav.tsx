"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_LINKS } from "@/constants/nav"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import { cn } from "cn"

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
      >
        <MenuIcon />
        <span className="sr-only">메뉴 열기</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-80">
          <nav className="mt-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                    "w-full justify-start",
                    isActive && "font-medium"
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
