/**
 * 轻量 Markdown 渲染器
 * 支持：**bold**、*italic*、`code`、### 标题、- 列表、> 引用、\n\n 段落
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  let html = text
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // 标题 ### ## #
    .replace(/^### (.+)$/gm, '<h4 style="font-size:15px;font-weight:700;color:#1A1714;margin:16px 0 8px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:17px;font-weight:700;color:#1A1714;margin:18px 0 8px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:20px;font-weight:700;color:#1A1714;margin:20px 0 10px">$1</h2>')

    // 粗体 **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#1A1714">$1</strong>')

    // 斜体 *text*
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#3D3830">$1</em>')

    // 行内代码 `code`
    .replace(/`(.+?)`/g, '<code style="font-family:monospace;background:#EDE9E1;padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>')

    // 引用 > text
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #6B5ECD;padding:6px 12px;margin:10px 0;background:#EEE9FF;border-radius:0 8px 8px 0;color:#3D3830;font-style:italic">$1</blockquote>')

    // 无序列表 - item
    .replace(/^[-•] (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')

    // 水平线
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #EDE9E1;margin:16px 0">')

    // 段落（双换行）
    .replace(/\n\n/g, '</p><p style="margin:0 0 10px;line-height:1.8">')

    // 单换行 → <br>
    .replace(/\n/g, '<br>');

  // 包裹 <li> 为 <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br>)?)+/g, (match) => {
    const items = match.replace(/<br>/g, '');
    return `<ul style="margin:8px 0;padding-left:20px;list-style:disc">${items}</ul>`;
  });

  // 段落包裹
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<blockquote')) {
    html = `<p style="margin:0 0 10px;line-height:1.8">${html}</p>`;
  }

  return html;
}
