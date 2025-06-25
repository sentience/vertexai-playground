import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import * as readline from "readline/promises"

const projectId = "cross-camp-ai-enablement"
const region = "us-east5"

class Agent {
  constructor(
    private client: AnthropicVertex,
    private getUserMessage: () => Promise<string>,
  ) {}

  async run() {
    const userMessage = await this.getUserMessage()
    const result = await this.client.messages.create({
      model: "claude-3-7-sonnet@20250219",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    })
    console.log(JSON.stringify(result, null, 2))
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
  const userMessage = await rl.question("Enter your message for Claude: ")

  // Close the readline interface
  rl.close()

  return userMessage
}
