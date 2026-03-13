import fs from 'fs/promises'
import path from 'path'

// List of markdown files to index for the guide bot
const KNOWLEDGE_FILES = [
  'CHARACTERS.md',
  'RELATIONSHIPS.md',
  'GAME-MECHANICS.md',
  'FACTIONS.md',
  'guidebotcomplete.md',
  'PROMPT-3-BSD-BRIEF.md',
  'PROMPT-6-DUEL-SYSTEM.md',
  'master-plan-bsd.md',
  'ui-worldbuilding-spec.md',
  'bungouphase2.md',
  'BungouArchive-ContinuationGuide.md',
  'bsd-character-update.md',
  'bungouarchivegamev2biile.md',
]

const BASE_DIR = path.resolve(process.cwd())


let knowledgeCache: Record<string, string> = {}

// Relationship index: { 'dazai|oda': [excerpt, ...] }
let relationshipIndex: Record<string, string[]> = {}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function makeRelKey(a: string, b: string) {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  return na < nb ? `${na}|${nb}` : `${nb}|${na}`
}

function parseRelationshipsMd(content: string) {
  const rels: Record<string, string[]> = {}
  // Split into paragraphs
  const paras = content.split(/\n\s*\n/)
  for (const para of paras) {
    // Look for CHARACTERS line
    const charLine = para.match(/CHARACTERS\s+([\w\-]+)\s*[×x]\s*([\w\-]+)/i)
    if (charLine) {
      const a = charLine[1]
      const b = charLine[2]
      const key = makeRelKey(a, b)
      if (!rels[key]) rels[key] = []
      rels[key].push(para.trim())
    } else {
      // Also handle trios (× ... × ...)
      const trioLine = para.match(/CHARACTERS\s+([\w\-]+)\s*[×x]\s*([\w\-]+)\s*[×x]\s*([\w\-]+)/i)
      if (trioLine) {
        const names = [trioLine[1], trioLine[2], trioLine[3]]
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) {
            const key = makeRelKey(names[i], names[j])
            if (!rels[key]) rels[key] = []
            rels[key].push(para.trim())
          }
        }
      }
    }
  }
  return rels
}

export async function loadKnowledgeFiles() {
  const result: Record<string, string> = {}
  let relMd = ''
  for (const file of KNOWLEDGE_FILES) {
    try {
      const filePath = path.join(BASE_DIR, file)
      const content = await fs.readFile(filePath, 'utf8')
      result[file] = content
      if (file.toLowerCase().includes('relationship')) relMd = content
    } catch (e) {
      // Ignore missing files
    }
  }
  knowledgeCache = result
  // Build relationship index
  if (relMd) relationshipIndex = parseRelationshipsMd(relMd)
  return result
}

export function getKnowledgeCache() {
  return knowledgeCache
}

// Simple search: returns file excerpts containing the query
export function searchKnowledge(query: string, maxResults = 3): Array<{file: string, excerpt: string}> {
  const results: Array<{file: string, excerpt: string}> = []
  const q = query.toLowerCase()
  for (const [file, content] of Object.entries(knowledgeCache)) {
    const idx = content.toLowerCase().indexOf(q)
    if (idx !== -1) {
      // Get 300 chars before and after
      const start = Math.max(0, idx - 300)
      const end = Math.min(content.length, idx + 300)
      results.push({ file, excerpt: content.slice(start, end) })
      if (results.length >= maxResults) break
    }
  }
  return results
}

// Relationship search: uses the index for instant lookup, falls back to fuzzy scan
export function searchRelationship(nameA: string, nameB: string, maxResults = 2): Array<{file: string, excerpt: string}> {
  const results: Array<{file: string, excerpt: string}> = []
  const key = makeRelKey(nameA, nameB)
  if (relationshipIndex[key]) {
    for (const para of relationshipIndex[key]) {
      results.push({ file: 'RELATIONSHIPS.md', excerpt: para })
      if (results.length >= maxResults) return results
    }
  }
  // Fallback: fuzzy scan
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const a = norm(nameA)
  const b = norm(nameB)
  for (const [file, content] of Object.entries(knowledgeCache)) {
    if (!file.toLowerCase().includes('relationship')) continue
    const paras = content.split(/\n\s*\n/)
    for (const para of paras) {
      const p = norm(para)
      if (p.includes(a) && p.includes(b)) {
        results.push({ file, excerpt: para.trim() })
        if (results.length >= maxResults) return results
      }
    }
  }
  return results
}

// Call this at server start
loadKnowledgeFiles()
