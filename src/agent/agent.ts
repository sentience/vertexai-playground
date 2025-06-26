import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import { Anthropic } from "@anthropic-ai/sdk"
import { BadRequestError } from "@anthropic-ai/vertex-sdk/core/error.mjs"
import { ToolDefinition } from "./types.js"

export class Agent {
  constructor(
    private client: AnthropicVertex,
    private getUserMessage: () => Promise<string>,
    private getToolConsent: (toolDescription: string) => Promise<boolean>,
    private showAgentMessage: (message: string) => void,
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
              this.showAgentMessage(message.text)
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

    const toolDescription = `${name}(${JSON.stringify(input)})`

    if (!(await this.getToolConsent(toolDescription)))
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
      content: message.content,
    }
  }
}
