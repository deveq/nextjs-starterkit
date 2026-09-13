import { SITE_CONFIG } from "@/constants/site"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Separator } from "@/components/ui/separator"

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold">{SITE_CONFIG.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <Separator />
    </>
  )
}
