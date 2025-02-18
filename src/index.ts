import { SitemapParser } from "./utils/sitemap"
import { ContentExtractor } from "./utils//content-extractor"
import { PdfGenerator } from "./utils/pdf-generator"
import * as fs from "fs/promises"
import * as path from "path"
import dotenv from "dotenv"

dotenv.config()

export class BlogToPdf {
  private sitemapParser: SitemapParser
  private contentExtractor: ContentExtractor
  private pdfGenerator: PdfGenerator

  constructor(options: { openaiApiKey?: string; claudeApiKey?: string; outputDir: string }) {
    this.sitemapParser = new SitemapParser()
    this.contentExtractor = new ContentExtractor(options.openaiApiKey, options.claudeApiKey)
    this.pdfGenerator = new PdfGenerator(options.outputDir)
  }

  async export(sitemapUrl: string): Promise<void> {
    try {
      // Parse sitemap
      const urls = await this.sitemapParser.parse(sitemapUrl)
      console.log(`Found ${urls.length} URLs in sitemap`)

      // Create output directory if it doesn't exist
      await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true })

      urls.slice(0, 1)

      // Process each URL
      for (const url of urls) {
        try {
          console.log(`Processing ${url}`)
          const article = await this.contentExtractor.extract(url)
          const pdfPath = await this.pdfGenerator.generate(article)
          console.log(`Generated PDF: ${pdfPath}`)
        } catch (error) {
          // @ts-ignore
          throw new Error(`Failed to process URL ${url}: ${error.message}`)
        }
      }
    } catch (error) {
      // @ts-ignore
      throw new Error(`Export failed: ${error.message}`)
    }
  }
}
