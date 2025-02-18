import puppeteer from "puppeteer"
import * as path from "path"
import { Article } from "../types"

export class PdfGenerator {
  private outputDir: string

  constructor(outputDir: string) {
    this.outputDir = outputDir
  }

  async generate(article: Article): Promise<string> {
    const browser = await puppeteer.launch()
    try {
      const page = await browser.newPage()

      // Create HTML template
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .content { line-height: 1.6; }
            .metadata { color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${article.title}</h1>
          <div class="metadata">
            <p>Source: ${article.url}</p>
            ${article.publishDate ? `<p>Published: ${article.publishDate}</p>` : ""}
          </div>
          <div class="content">
            ${article.content}
          </div>
        </body>
        </html>
      `

      await page.setContent(html)

      const filename = `${this.sanitizeFilename(article.title)}.pdf`
      const outputPath = path.join(this.outputDir, filename)

      await page.pdf({
        path: outputPath,
        format: "A4",
        margin: {
          top: "40px",
          right: "40px",
          bottom: "40px",
          left: "40px",
        },
      })

      return outputPath
    } finally {
      await browser.close()
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }
}
