import { AnthropicVertex } from "@anthropic-ai/vertex-sdk"
import * as readline from "readline/promises"
import { Agent } from "./agent/agent.js"

const projectId = "cross-camp-ai-enablement"
const region = "us-east5"

main()

async function main() {
  const client = new AnthropicVertex({
    projectId,
    region,
  })

  const agent = new Agent(client, getUserMessage, [])

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
