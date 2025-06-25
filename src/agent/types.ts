import { Anthropic } from "@anthropic-ai/sdk"

export type ToolDefinition = {
  name: string
  description: string
  input_schema: Anthropic.Tool.InputSchema
  func: (args: any) => Promise<string> | string
}
