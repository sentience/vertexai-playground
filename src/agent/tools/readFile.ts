import fs from "fs/promises"
import { existsSync } from "fs"
import nodePath from "path"
import { ToolDefinition } from "../types.js"

/**
 * Tool for reading file contents
 */
export const readFileTool: ToolDefinition = {
  name: "read_file",
  description:
    "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The relative path of a file in the working directory.",
      },
    },
    required: ["path"],
  },
  func: async (args: any): Promise<string> => {
    const path: string = args.path
    const resolvedPath = nodePath.resolve(path)

    // Check if file exists (using sync check for simplicity)
    if (!existsSync(resolvedPath)) {
      throw new Error(`File not found at path ${path}`)
    }

    try {
      return fs.readFile(resolvedPath, "utf-8")
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error))
    }
  },
}
