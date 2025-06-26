import fs from "fs/promises"
import { existsSync } from "fs"
import nodePath from "path"
import { ToolDefinition } from "../types.js"

/**
 * Tool for editing file contents
 */
export const editFileTool: ToolDefinition = {
  name: "edit_file",
  description:
    "Make edits to a text file. Replaces 'old_str' with 'new_str' in the given file. 'old_str' and 'new_str' MUST be different from each other. If the file specified with path doesn't exist, it will be created.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The relative path of a file in the working directory.",
      },
      old_str: {
        type: "string",
        description: "The string to replace in the file.",
      },
      new_str: {
        type: "string",
        description: "The new string to replace with.",
      },
    },
    required: ["path", "old_str", "new_str"],
  },
  func: async (args: any): Promise<string> => {
    const path: string = args.path
    const oldStr: string = args.old_str
    const newStr: string = args.new_str
    const resolvedPath = nodePath.resolve(path)

    // Validate that old_str and new_str are different
    if (oldStr === newStr) {
      throw new Error(
        "'old_str' and 'new_str' must be different from each other",
      )
    }

    try {
      let fileContent: string

      // Check if file exists
      if (existsSync(resolvedPath) && oldStr !== "") {
        // Read existing file content
        fileContent = await fs.readFile(resolvedPath, "utf-8")

        // Check if old_str exists in the file
        if (!fileContent.includes(oldStr)) {
          return `No changes made: String '${oldStr}' not found in the file.`
        }

        // Replace all occurrences of old_str with new_str
        const splitParts = fileContent.split(oldStr)
        const newContent = splitParts.join(newStr)

        // Write the modified content back to the file
        await fs.writeFile(resolvedPath, newContent, "utf-8")

        // Count replacements - splitParts.length - 1 gives the number of delimiters (oldStr) found
        const occurrences = splitParts.length - 1
        return `Successfully made ${occurrences} replacement${occurrences !== 1 ? "s" : ""} in ${path}`
      } else if (oldStr === "") {
        await fs.writeFile(resolvedPath, newStr, "utf-8")
        return `Created new file ${path} with the provided content`
      }

      // Throw error for the case where the file doesn't exist and oldStr is not empty
      throw new Error(`File ${path} does not exist.`)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error))
    }
  },
}
