import * as cheerio from "cheerio"
import axios from "axios"
import { OpenAI } from "openai"
import { Article } from "../types"
import Anthropic from "@anthropic-ai/sdk"

type LLMProvider = "openai" | "claude"

export class ContentExtractor {
  private openai?: OpenAI
  private claude?: Anthropic
  private provider?: LLMProvider

  constructor(openaiApiKey?: string, claudeApiKey?: string) {
    if (!openaiApiKey && !claudeApiKey) {
      throw new Error("Either OPENAI_API_KEY or CLAUDE_API_KEY must be provided")
    }

    if (claudeApiKey) {
      this.claude = new Anthropic({ apiKey: claudeApiKey })
      this.provider = "claude"
    } else if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey })
      this.provider = "openai"
    }
  }

  async extract(url: string): Promise<Article> {
    try {
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      // Remove unnecessary elements
      $("nav, header, footer, script, style, iframe, .comments, .sidebar").remove()

      // Handle images - make sure they have absolute URLs
      $("img").each((_, elem) => {
        const src = $(elem).attr("src")
        if (src && !src.startsWith("http")) {
          const baseUrl = new URL(url).origin
          $(elem).attr("src", new URL(src, baseUrl).href)
        }
      })

      // Simplify HTML to basic elements for better Markdown conversion
      $("*").removeAttr("class").removeAttr("id").removeAttr("style")

      const title = $("h1").first().text().trim() || "Untitled"
      const content = $("body").html() || ""

      return {
        url,
        title,
        content: await this.cleanWithLLM(content),
      }
    } catch (error) {
      throw new Error(`Failed to extract content from ${url}: ${(error as Error).message}`)
    }
  }

  private async cleanWithLLM(content: string): Promise<string> {
    try {
      const prompt =
        "Extract the main article content from the HTML, removing any navigation, ads, or irrelevant elements. Return clean text with proper formatting."

      if (this.provider === "claude" && this.claude) {
        const response = await this.claude.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nHTML Content:\n${content}`,
            },
          ],
        })
        return response.content[0].text
      } else if (this.provider === "openai" && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content,
            },
          ],
        })
        return response.choices[0].message.content || ""
      }

      throw new Error("No LLM provider configured")
    } catch (error) {
      // @ts-ignore
      throw new Error(`Failed to clean content with ${this.provider}: ${error.message}`)
    }
  }
}
