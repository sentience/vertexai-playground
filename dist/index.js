import { HarmBlockThreshold, HarmCategory, VertexAI, } from "@google-cloud/vertexai";
const project = "cross-camp-pko-enablement";
const location = "us-central1";
const textModel = "gemini-1.5-flash-002";
const vertexAI = new VertexAI({ project, location });
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
});
async function generateContent() {
    const request = {
        contents: [
            { role: "user", parts: [{ text: "Tell me a Star Trek fact." }] },
        ],
    };
    const result = await generativeModel.generateContent(request);
    const response = result.response;
    console.log("Response: ", JSON.stringify(response));
}
generateContent();
