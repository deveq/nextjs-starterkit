import { z } from "zod"

export const exampleFormSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
})

export type ExampleFormValues = z.infer<typeof exampleFormSchema>
