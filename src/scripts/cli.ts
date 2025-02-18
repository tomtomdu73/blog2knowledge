import { fileURLToPath } from "url"
import { dirname } from "path"
import { program } from "commander"
import { BlogToPdf } from "../index"
import dotenv from "dotenv"
import path from "path"
import chalk from "chalk"
import ora from "ora"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

async function run() {
  program
    .name("blog2knowledge")
    .description("Export blog articles to PDF files using sitemap URL")
    .version("1.0.0")
    .requiredOption("-s, --sitemap <url>", "Sitemap URL to process")
    .option("-o, --output <directory>", "Output directory for PDFs", "./output")
    .option("--openai-key <key>", "OpenAI API key (can also be set via OPENAI_API_KEY env)")
    .option("--claude-key <key>", "Claude API key (can also be set via CLAUDE_API_KEY env)")
    .parse(process.argv)

  const options = program.opts()
  const spinner = ora("Starting export process").start()

  try {
    // Get API keys from command line args or environment variables
    const openaiApiKey = options.openaiKey || process.env.OPENAI_API_KEY
    const claudeApiKey = options.claudeKey || process.env.CLAUDE_API_KEY

    if (!openaiApiKey && !claudeApiKey) {
      throw new Error(
        "Either OpenAI or Claude API key must be provided via environment variables or command line arguments"
      )
    }

    // Create absolute path for output directory
    const outputDir = path.resolve(process.cwd(), options.output)

    spinner.text = "Initializing exporter"
    const exporter = new BlogToPdf({
      openaiApiKey,
      claudeApiKey,
      outputDir,
    })

    spinner.text = `Processing sitemap: ${options.sitemap}`
    await exporter.export(options.sitemap)

    spinner.succeed(chalk.green("Export completed successfully!"))
    console.log(chalk.blue(`\nPDFs have been saved to: ${outputDir}`))
  } catch (error) {
    spinner.fail(chalk.red("Export failed"))
    //@ts-ignore
    console.error(chalk.red(`\nError: ${error.message}`))
    process.exit(1)
  }
}

run().catch((error) => {
  console.error(chalk.red(`\nUnexpected error: ${error.message}`))
  process.exit(1)
})
