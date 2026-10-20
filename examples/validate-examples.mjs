// Checks the map and automaton examples used in the article; no network, inference or UI action.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

async function parser(name) {
  const source = await readFile(new URL('../new-frontend/src/utils/' + name, import.meta.url), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const {parseKmapLatex} = await parser('kmapParser.js');
const {parseFsaTikz} = await parser('fsaTikzParser.js');
const source = await readFile(new URL('kmap-four-variable.tex', import.meta.url), 'utf8');
const map = parseKmapLatex(source);
assert.equal(map.tableSize, '4x4');
assert.deepEqual(map.implicants, [[15,10]]);
assert.equal(map.cornerImplicant, true);
const terms = source.match(/\\manualterms\{([^}]+)\}/)[1].split(',').map(Number);
const evaluate = n => Number((!(n & 4) && !(n & 1)) || (Boolean(n & 8) && Boolean(n & 2)));
assert.deepEqual(terms, Array.from({length:16}, (_,n) => evaluate(n)));
const gray = [0,1,3,2];
const grid = gray.flatMap(ab => gray.map(cd => terms[4*ab+cd]));
assert.deepEqual(map.cellValues.map(Number), grid);
const corners = [0,2,8,10], block = [15,14,11,10];
assert.ok([...corners,...block].every(n => terms[n] === 1));
assert.deepEqual(corners.filter(n => block.includes(n)), [10]);
assert.deepEqual([...new Set([...corners,...block])].sort((a,b)=>a-b),
                 terms.flatMap((v,n)=>v?[n]:[]));
console.log('PASS map: all 16 function values, Gray layout, two valid four-cell groups, overlap at 10.');

const before = parseFsaTikz(await readFile(new URL('fsa-input.tex', import.meta.url), 'utf8'));
const after = parseFsaTikz(await readFile(new URL('fsa-modified.tex', import.meta.url), 'utf8'));
assert.deepEqual(after.nodes, before.nodes);
const signature = e => [e.sourceId,e.targetId,e.label].join(':');
const oldEdges = before.edges.map(signature).sort();
const newEdges = after.edges.map(signature).sort();
assert.equal(oldEdges.length, 2);
assert.equal(newEdges.length, 3);
assert.deepEqual(newEdges.filter(e => !oldEdges.includes(e)), ['q0:q0:b']);
assert.equal(before.nodes.find(n=>n.id==='q0').isStart, true);
assert.equal(before.nodes.find(n=>n.id==='q1').isAccepting, true);
assert.deepEqual(newEdges.filter(e => e !== 'q0:q0:b'), oldEdges);
console.log('PASS automata: retained hosted outputs differ only by the b-loop at q0.');
