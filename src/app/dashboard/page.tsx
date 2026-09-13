export const metadata = {
  title: "대시보드",
  description: "대시보드 페이지입니다.",
}

export default function DashboardPage({}: PageProps<"/dashboard">) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground">
        여기에 대시보드 콘텐츠를 추가하세요.
      </p>
    </div>
  )
}
