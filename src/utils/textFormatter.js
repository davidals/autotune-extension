/**
 * Utility functions for text formatting
 */

export class TextFormatter {
  /**
   * Cleans up markdown text for Slack compatibility
   * @param {string} markdown - The markdown text to clean
   * @returns {string} The cleaned text
   */
  static cleanMarkdownForSlack(markdown) {
    return markdown
      .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines (3+ → 2)
      .replace(/- \n+/g, '- ')  // Fix lists breaking unexpectedly
      .replace(/\n\s*>\s*\n/g, '\n> ')  // Ensure blockquotes don't create extra spaces
      .replace(/\n\s*```\n/g, '\n```\n'); // Ensure code blocks stay formatted correctly
  }

  /**
   * Converts Slack HTML to markdown
   * @param {string} html - The HTML to convert
   * @returns {string} The markdown text
   */
  static convertSlackHtmlToMarkdown(html) {
    return html
      .replace(/<b>(.*?)<\/b>/g, '**$1**')  // Bold
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')  // Strong text
      .replace(/<i>(.*?)<\/i>/g, '*$1*')  // Italics
      .replace(/<em>(.*?)<\/em>/g, '*$1*')  // Emphasis
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')  // Blockquotes
      .replace(/<br\s*\/?>/g, '\n')  // Line breaks
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')  // Paragraphs
      .replace(/<ul>(.*?)<\/ul>/gs, (match, items) => '\n' + items.replace(/<li>(.*?)<\/li>/g, '- $1')) // Preserve bullet lists
      .replace(/<ol>(.*?)<\/ol>/gs, (match, items) => '\n' + items.replace(/<li>(.*?)<\/li>/g, (m, item, i) => `${i + 1}. ${item}`)) // Preserve numbered lists
      .replace(/<code>(.*?)<\/code>/g, '`$1`') // Inline code
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, codeBlock) => `\n\`\`\`\n${codeBlock.trim()}\n\`\`\`\n`) // Multiline code blocks
      .replace(/<\/?[^>]+(>|$)/g, ""); // Strip remaining HTML tags
  }
} 