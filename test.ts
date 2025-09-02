import FirecrawlClient from "@mendable/firecrawl-js";
import "dotenv/config";

async function main() {
  const client = new FirecrawlClient({ apiKey: process.env.FIRECRAWL_API_KEY });

  const result = await client.extract({
    urls: ["https://tecmicro.ao/*"],
    prompt: "quero um sensor de temperatura calibrado.",
    schema: {
      type: "object",
      properties: {
        produto: { type: "string" },
        preco: { type: "string" },
        link: { type: "string" }
      },
      required: ["produto", "preco", "link"]
    },
    showSources: true
  });

  console.log("Resultado final:", JSON.stringify(result, null, 2));
}

main();
