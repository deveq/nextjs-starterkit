import { Separator } from "@/components/ui/separator"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      <Separator />
      <footer className="bg-background py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {year} Next.js 스타터킷. All rights reserved.</p>
      </footer>
    </>
  )
}
