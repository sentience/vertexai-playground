import {
  GenerateContentRequest,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai"

const project = "cross-camp-pko-enablement"
const location = "us-central1"
const textModel = "gemini-1.5-flash-002"

const vertexAI = new VertexAI({ project, location })

const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  // The following parameters are optional
  // They can also be passed to individual content generation requests
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 256 },
  systemInstruction: {
    role: "system",
    parts: [{ text: "" }],
  },
})

async function generateContentStream() {
  const request: GenerateContentRequest = {
    contents: [
      { role: "user", parts: [{ text: "Tell me a Star Trek fact." }] },
    ],
    systemInstruction:
      "Return a response in Markdown, with every second word in bold.",
  }
  const streamingResult = await generativeModel.generateContentStream(request)
  for await (const chunk of streamingResult.stream) {
    console.log(chunk?.candidates?.[0]?.content?.parts?.[0]?.text)
  }
}

generateContentStream()
