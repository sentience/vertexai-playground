import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import { Anthropic } from "@anthropic-ai/sdk"
import { BadRequestError } from "@anthropic-ai/vertex-sdk/core/error.mjs"
import * as readline from "readline/promises"

const projectId = "cross-camp-ai-enablement"
const region = "us-east5"

class Agent {
  constructor(
    private client: AnthropicVertex,
    private getUserMessage: () => Promise<string>,
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
        const result: Anthropic.Message = await this.client.messages.create({
          model: "claude-3-7-sonnet@20250219",
          max_tokens: 1024,
          messages: conversation,
        })
        conversation.push(this.messageToMessageParam(result))

        for (const message of result.content) {
          switch (message.type) {
            case "text":
              console.log(`\u001b[93mClaude\u001b[0m: ${message.text}`)
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

main()

async function main() {
  const client = new AnthropicVertex({
    projectId,
    region,
  })

  const agent = new Agent(client, getUserMessage)

  await agent.run()
}

async function getUserMessage(): Promise<string> {
  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // Prompt user for input
  const userMessage = await rl.question("\u001b[94mYou\u001b[0m: ")

  // Close the readline interface
  rl.close()

  return userMessage
}
