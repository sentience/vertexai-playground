import fs from "fs/promises"
import { existsSync } from "fs"
import nodePath from "path"
import { ToolDefinition } from "../types.js"

/**
 * Tool for listing files in a directory
 */
export const listFilesTool: ToolDefinition = {
  name: "list_files",
  description:
    "List files and directories at a given path. If no path is provided, lists files in the current directory.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Optional relative path to list files from. Defaults to current directory if not provided.",
      },
    },
    required: [],
  },
  func: async (args: any): Promise<string> => {
    const path: string = args.path ?? "."
    const resolvedPath = nodePath.resolve(path)

    // Check if path exists and is a directory
    if (!existsSync(resolvedPath)) {
      throw new Error(`Directory not found at path ${path}`)
    }
    const stat = await fs.stat(resolvedPath)
    if (!stat.isDirectory()) {
      throw new Error(`Path ${path} is not a directory`)
    }

    try {
      const entries = await fs.readdir(resolvedPath)
      const entriesWithDirectoryMarkers = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = nodePath.join(resolvedPath, entry)
          try {
            const stats = await fs.stat(fullPath)
            return stats.isDirectory() ? `${entry}/` : entry
          } catch (error) {
            // If we can't stat the file for some reason, return it without a trailing slash
            return entry
          }
        }),
      )
      return JSON.stringify(entriesWithDirectoryMarkers)
    } catch (error) {
      throw new Error(
        `Error reading directory: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  },
}
