import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import { Anthropic } from "@anthropic-ai/sdk"
import { BadRequestError } from "@anthropic-ai/vertex-sdk/core/error.mjs"
import { ToolDefinition } from "./types.js"

export class Agent {
  constructor(
    private client: AnthropicVertex,
    private getUserMessage: () => Promise<string>,
    private getUserConsent: () => Promise<boolean>,
    private tools: ToolDefinition[],
  ) {}

  async run() {
    const conversation: Anthropic.MessageParam[] = []

    console.log("Chat with Claude (use 'ctrl-c' to quit)")

    let readUserInput = true
    while (true) {
      if (readUserInput) {
        const userMessage: Anthropic.MessageParam = {
          role: "user",
          content: await this.getUserMessage(),
        }
        conversation.push(userMessage)
      }

      try {
        const result = await this.runInference(conversation)
        conversation.push(this.messageToMessageParam(result))

        const toolResults: Anthropic.ContentBlockParam[] = []

        for (const message of result.content) {
          switch (message.type) {
            case "text":
              console.log(`\n\u001b[93mClaude\u001b[0m: ${message.text}\n`)
              break
            case "tool_use":
              const result = await this.executeTool(
                message.id,
                message.name,
                message.input,
              )
              toolResults.push(result)
          }
        }

        if (toolResults.length === 0) {
          readUserInput = true
          continue
        }
        readUserInput = false
        conversation.push({
          role: "user",
          content: toolResults,
        })
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

  private async executeTool(
    id: string,
    name: string,
    input: unknown,
  ): Promise<Anthropic.ContentBlockParam> {
    const tool = this.tools.find((t) => t.name === name)
    if (!tool) {
      return {
        tool_use_id: id,
        type: "tool_result",
        content: `tool not found`,
        is_error: true,
      }
    }

    console.log(
      `\n\u001b[92mTool\u001b[0m: ${name}(${JSON.stringify(input)})\n`,
    )
    if (!(await this.getUserConsent()))
      return {
        tool_use_id: id,
        type: "tool_result",
        content: `User did not consent to tool execution`,
        is_error: true,
      }

    try {
      return {
        tool_use_id: id,
        type: "tool_result",
        content: await tool.func(input),
      }
    } catch (error) {
      return {
        tool_use_id: id,
        type: "tool_result",
        content: error instanceof Error ? error.message : String(error),
        is_error: true,
      }
    }
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
              return {
                type: "text" as const,
                text: c.text,
              }
            case "tool_use":
              return c
            default:
              // Handle other content types if needed
              return null
          }
        })
        .filter((c) => !!c),
    }
  }
}
