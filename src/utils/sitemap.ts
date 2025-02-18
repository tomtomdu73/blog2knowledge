import axios from "axios"
import { parseStringPromise } from "xml2js"
import { SitemapUrl } from "../types"

export class SitemapParser {
  async parse(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(sitemapUrl)
      const result = await parseStringPromise(response.data)

      const urls = result.urlset.url as SitemapUrl[]
      return urls.map((url) => url.loc[0])
    } catch (error) {
      // @ts-ignore
      throw new Error(`Failed to parse sitemap: ${error.message}`)
    }
  }
}
