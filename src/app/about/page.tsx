export const metadata = {
  title: "소개",
  description: "이 프로젝트에 대한 소개 페이지입니다.",
}

export default function AboutPage({}: PageProps<"/about">) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">소개</h1>
      <p className="text-muted-foreground">
        Next.js 16, React 19, TypeScript, Tailwind CSS로 만들어진 모던 웹 스타터킷입니다.
      </p>
    </div>
  )
}
