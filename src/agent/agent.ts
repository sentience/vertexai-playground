import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import { Anthropic } from "@anthropic-ai/sdk"
import { BadRequestError } from "@anthropic-ai/vertex-sdk/core/error.mjs"

export type ToolDefinition = {
  name: string
  description: string
  input_schema: Anthropic.Tool.InputSchema
  func: (args: JSON) => [string, boolean]
}

export class Agent {
  constructor(
    private client: AnthropicVertex,
    private getUserMessage: () => Promise<string>,
    private tools: ToolDefinition[],
  ) {}

  async run() {
    const conversation: Anthropic.MessageParam[] = []

    console.log("Chat with Claude (use 'ctrl-c' to quit)")

    while (true) {
      const userMessage: Anthropic.MessageParam = {
        role: "user",
        content: await this.getUserMessage(),
      }
      conversation.push(userMessage)

      try {
        const result = await this.runInference(conversation)
        conversation.push(this.messageToMessageParam(result))

        for (const message of result.content) {
          switch (message.type) {
            case "text":
              console.log(`\n\u001b[93mClaude\u001b[0m: ${message.text}\n`)
          }
        }
      } catch (error) {
        if (error instanceof BadRequestError) {
          console.error("BadRequestError:", error.message)
        } else {
          console.error("Error:", error)
        }
      }
    }
  }

  private runInference(
    conversation: Anthropic.MessageParam[],
  ): Promise<Anthropic.Message> {
    const anthropicTools: Anthropic.ToolUnion[] = this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }))

    return this.client.messages.create({
      model: "claude-3-7-sonnet@20250219",
      max_tokens: 1024,
      messages: conversation,
      tools: anthropicTools,
    })
  }

  private messageToMessageParam(
    message: Anthropic.Message,
  ): Anthropic.MessageParam {
    return {
      role: message.role,
      content: message.content
        .map((c) => {
          switch (c.type) {
            case "text":
              return c.text
            default:
              // Handle other content types if needed
              return ""
          }
        })
        .join(""),
    }
  }
}
