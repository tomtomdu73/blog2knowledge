export interface Article {
  url: string
  title: string
  content: string
  publishDate?: string
}

export interface SitemapUrl {
  loc: string[]
  lastmod?: string[]
}
