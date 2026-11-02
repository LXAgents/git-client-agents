import ReactMarkdown, { type Components } from 'react-markdown'

const components: Components = {
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2" />,
}

// Markdown for the agent's answers and reports. Raw HTML in the text is shown as text, never
// rendered, and links open in a new tab.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 break-words [&_code]:rounded [&_code]:bg-overlay [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-canvas-inset [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-line [&_td]:px-2 [&_th]:border [&_th]:border-line [&_th]:px-2 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-fg-muted">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
