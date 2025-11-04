// AST (forest) LaTeX Parser and Validator

export const validateAstLatex = (latex) => {
  const errors = [];
  const warnings = [];

  if (!/\\begin\{forest\}/.test(latex) || !/\\end\{forest\}/.test(latex)) {
    errors.push("Missing \\begin{forest} or \\end{forest} environment");
  }

  // Basic bracket balance check for forest content
  const content = extractForestContent(latex);
  if (content) {
    const open = (content.match(/\[/g) || []).length;
    const close = (content.match(/\]/g) || []).length;
    if (open !== close) warnings.push("Unbalanced [ ] brackets (parser will attempt best effort)");
  }

  return { isValid: errors.length === 0, errors, warnings };
};

const extractForestContent = (latex) => {
  const m = latex.match(/\\begin\{forest\}([\s\S]*?)\\end\{forest\}/);
  return m ? m[1] : '';
};

// A minimal parser for forest bracket trees of the form: [ label , ...children... ]
// Notes:
// - Edge labels (edge label={node[...] {text}}) are currently ignored.
// - This parser is best-effort and expects reasonably formatted forest trees produced by this app.
export const parseAstLatex = (latex) => {
  // Clean preamble and extract forest block
  let content = extractForestContent(
    latex
      .replace(/\\documentclass\{[^}]*\}/g, '')
      .replace(/\\usepackage\{[^}]*\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
  ).trim();

  if (!content) throw new Error('Could not find forest content');

  // Remove possible config lines like: for tree ={grow'= 0,}
  content = content.replace(/(^|\n)\s*for\s+tree\s*=\s*\{[^}]*\}\s*/g, '\n');

  // Remove edge label specs entirely to avoid mis-parsing them as nodes
  content = content.replace(/,\s*edge\s+label=\{node\[[^\]]*\]\{[^}]*\}\}/g, '');

  // Collapse whitespace
  content = content.replace(/\s+/g, ' ').trim();

  // Expect a single top-level [ ... ]
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error('Invalid forest bracket structure');

  const rootText = content.slice(start, end + 1);

  let pos = 0;
  const s = rootText;

  const skipSpaces = () => {
    while (pos < s.length && /\s/.test(s[pos])) pos++;
  };

  const parseNode = () => {
    skipSpaces();
    if (s[pos] !== '[') throw new Error('Expected [ at ' + pos);
    pos++; // skip [
    skipSpaces();

    // Read label until ',' or ']' or '['
    let label = '';
    while (pos < s.length && s[pos] !== ',' && s[pos] !== ']' && s[pos] !== '[') {
      label += s[pos++];
    }
    label = label.trim();

    const node = { value: label, children: [], label: '' };

    skipSpaces();
    // Children: zero or more child nodes (each begins with '[')
    while (pos < s.length && s[pos] !== ']') {
      if (s[pos] === ',') {
        pos++; // skip comma before next token
        skipSpaces();
        continue;
      }
      if (s[pos] === '[') {
        const child = parseNode();
        node.children.push(child);
        skipSpaces();
        continue;
      }
      // Unknown token: advance one char defensively
      pos++;
      skipSpaces();
    }

    if (s[pos] !== ']') throw new Error('Expected ] at ' + pos);
    pos++; // skip ]
    skipSpaces();
    return node;
  };

  const tree = parseNode();
  return tree;
};

export default { validateAstLatex, parseAstLatex };


