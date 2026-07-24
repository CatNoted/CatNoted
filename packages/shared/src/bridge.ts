import { BlockNode } from './block.js';
import { CanvasElement } from './canvas.js';
import { GraphNode, GraphEdge } from './graph.js';

export interface ImportResult {
  blocks: BlockNode[];
  frontmatter: Record<string, any>;
  tags: string[];
  backlinks: string[];
}

export interface ExportData {
  blocks: BlockNode[];
  canvasElements?: CanvasElement[];
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
  frontmatter?: Record<string, any>;
}

export function parseMarkdown(markdown: string): ImportResult {
  const result: ImportResult = {
    blocks: [],
    frontmatter: {},
    tags: [],
    backlinks: []
  };

  let content = markdown.replace(/\r/g, '');

  // Extract frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);
  if (match && match[1]) {
    const yaml = match[1];
    yaml.split('\n').forEach((line: string) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        result.frontmatter[key] = value;
      }
    });
    content = content.replace(frontmatterRegex, '');
  }

  // Extract tags and backlinks
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  const backlinkRegex = /\[\[(.*?)\]\]/g;

  let tagMatch;
  while ((tagMatch = tagRegex.exec(content)) !== null) {
    if (tagMatch[1] && !result.tags.includes(tagMatch[1])) {
      result.tags.push(tagMatch[1]);
    }
  }

  let backlinkMatch;
  while ((backlinkMatch = backlinkRegex.exec(content)) !== null) {
    if (backlinkMatch[1] && !result.backlinks.includes(backlinkMatch[1])) {
      result.backlinks.push(backlinkMatch[1]);
    }
  }

  // Very basic block parsing
  const lines = content.split('\n');
  let currentBlockId = 1;
  let inCodeBlock = false;
  let codeContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === undefined) continue;

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.blocks.push({
          id: `block-${currentBlockId++}`,
          type: 'code',
          content: codeContent.join('\n')
        });
        inCodeBlock = false;
        codeContent = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    if (line.trim() === '---') {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'divider',
        content: '---'
      });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'heading',
        content: headingMatch[2],
        properties: { level: headingMatch[1].length as 1|2|3|4|5|6 }
      });
      continue;
    }

    const todoMatch = line.match(/^-\s+\[([ xX])\]\s+(.*)/);
    if (todoMatch && todoMatch[1] && todoMatch[2]) {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'todo',
        content: todoMatch[2],
        properties: { listType: 'todo', checked: todoMatch[1].toLowerCase() === 'x' }
      });
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    if (bulletMatch && bulletMatch[1]) {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'bullet',
        content: bulletMatch[1],
        properties: { listType: 'bullet' }
      });
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)/);
    if (orderedMatch && orderedMatch[1]) {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'ordered',
        content: orderedMatch[1],
        properties: { listType: 'ordered' }
      });
      continue;
    }

    const quoteMatch = line.match(/^>\s+(.*)/);
    if (quoteMatch && quoteMatch[1]) {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'quote',
        content: quoteMatch[1]
      });
      continue;
    }

    if (line.trim() !== '') {
      result.blocks.push({
        id: `block-${currentBlockId++}`,
        type: 'text',
        content: line
      });
    }
  }

  return result;
}

export function exportToMarkdown(data: ExportData): string {
  let md = '';

  if (data.frontmatter && Object.keys(data.frontmatter).length > 0) {
    md += '---\n';
    for (const [key, value] of Object.entries(data.frontmatter)) {
      md += `${key}: ${value}\n`;
    }
    md += '---\n\n';
  }

  for (const block of data.blocks) {
    switch (block.type) {
      case 'heading':
        md += `${'#'.repeat((block.properties?.level as number) || 1)} ${block.content}\n\n`;
        break;
      case 'bullet':
        md += `- ${block.content}\n`;
        break;
      case 'ordered':
        md += `1. ${block.content}\n`;
        break;
      case 'todo':
        md += `- [${block.properties?.checked ? 'x' : ' '}] ${block.content}\n`;
        break;
      case 'quote':
        md += `> ${block.content}\n\n`;
        break;
      case 'code':
        md += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
        break;
      case 'divider':
        md += `---\n\n`;
        break;
      default:
        md += `${block.content}\n\n`;
    }
  }

  if (data.graphNodes && data.graphNodes.length > 0) {
    md += `\n## Graph Nodes\n\n`;
    for (const node of data.graphNodes) {
      md += `- ${node.label} (${node.type})\n`;
    }
    md += `\n`;
  }

  if (data.graphEdges && data.graphEdges.length > 0) {
    md += `## Graph Edges\n\n`;
    for (const edge of data.graphEdges) {
      md += `- ${edge.source} -> ${edge.target} (${edge.type})\n`;
    }
    md += `\n`;
  }

  if (data.canvasElements && data.canvasElements.length > 0) {
    md += `## Canvas Elements\n\n`;
    for (const element of data.canvasElements) {
      if (element.type === 'note' && element.text) {
        md += `- Note: ${element.text}\n`;
      } else {
        md += `- ${element.type} at (${element.x}, ${element.y})\n`;
      }
    }
    md += `\n`;
  }

  return md.trim();
}

export function exportToJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function exportToHtml(data: ExportData): string {
  let html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>\n';
  html += 'body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }\n';
  html += 'img { max-width: 100%; }\n';
  html += 'blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 1rem; }\n';
  html += 'code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }\n';
  html += 'pre code { display: block; padding: 1rem; overflow-x: auto; }\n';
  html += 'ul { list-style-type: disc; }\n';
  html += 'ol { list-style-type: decimal; }\n';
  html += '</style>\n</head>\n<body>\n';

  let inList: 'ul' | 'ol' | null = null;
  const closeListIfOpen = (currentType: 'ul' | 'ol' | null) => {
    if (inList && inList !== currentType) {
      html += `</${inList}>\n`;
      inList = null;
    }
  };

  for (const block of data.blocks) {
    const blockListType = block.type === 'bullet' || block.type === 'todo' ? 'ul' : block.type === 'ordered' ? 'ol' : null;

    closeListIfOpen(blockListType);

    if (blockListType && !inList) {
      html += `<${blockListType}>\n`;
      inList = blockListType;
    }

    switch (block.type) {
      case 'heading': {
        const level = block.properties?.level || 1;
        html += `<h${level}>${escapeHtml(block.content)}</h${level}>\n`;
        break;
      }
      case 'bullet':
        html += `<li>${escapeHtml(block.content)}</li>\n`;
        break;
      case 'ordered':
        html += `<li>${escapeHtml(block.content)}</li>\n`;
        break;
      case 'todo':
        html += `<li><input type="checkbox" ${block.properties?.checked ? 'checked' : ''} disabled> ${escapeHtml(block.content)}</li>\n`;
        break;
      case 'quote':
        html += `<blockquote>${escapeHtml(block.content)}</blockquote>\n`;
        break;
      case 'code':
        html += `<pre><code>${escapeHtml(block.content)}</code></pre>\n`;
        break;
      case 'divider':
        html += `<hr />\n`;
        break;
      default:
        html += `<p>${escapeHtml(block.content)}</p>\n`;
    }
  }

  closeListIfOpen(null);

  if (data.graphNodes && data.graphNodes.length > 0) {
    html += `<h2>Graph Nodes</h2>\n<ul>\n`;
    for (const node of data.graphNodes) {
      html += `<li>${escapeHtml(node.label)} (${escapeHtml(node.type)})</li>\n`;
    }
    html += `</ul>\n`;
  }

  if (data.graphEdges && data.graphEdges.length > 0) {
    html += `<h2>Graph Edges</h2>\n<ul>\n`;
    for (const edge of data.graphEdges) {
      html += `<li>${escapeHtml(edge.source)} -&gt; ${escapeHtml(edge.target)} (${escapeHtml(edge.type)})</li>\n`;
    }
    html += `</ul>\n`;
  }

  if (data.canvasElements && data.canvasElements.length > 0) {
    html += `<h2>Canvas Elements</h2>\n<ul>\n`;
    for (const element of data.canvasElements) {
      if (element.type === 'note' && element.text) {
        html += `<li>Note: ${escapeHtml(element.text)}</li>\n`;
      } else {
        html += `<li>${escapeHtml(element.type)} at (${element.x}, ${element.y})</li>\n`;
      }
    }
    html += `</ul>\n`;
  }

  html += '</body>\n</html>';
  return html;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
