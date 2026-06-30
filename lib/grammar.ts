// ============================================================================
// Motor de Análise Sintática com Tabela
// ----------------------------------------------------------------------------
// Gramática de referência:
//
//   S -> bAb | aBa
//   A -> bBb | aAc
//   B -> cCa | ε
//   C -> aDb
//   D -> bSc
//
// ============================================================================

export const EPSILON = "ε"
export const EOF = "$"

export type Grammar = {
  start: string
  nonTerminals: string[]
  terminals: string[]
  // Cada produção é uma lista de símbolos. ε é representado por [] (lista vazia).
  productions: Record<string, string[][]>
}

export type GrammarAnalysis = {
  first: SymbolSet
  follow: SymbolSet
  table: ParseTable
  columns: string[]
}

export function cloneGrammar(g: Grammar): Grammar {
  return {
    start: g.start,
    nonTerminals: [...g.nonTerminals],
    terminals: [...g.terminals],
    productions: Object.fromEntries(
      Object.entries(g.productions).map(([nt, prods]) => [
        nt,
        prods.map((prod) => [...prod]),
      ]),
    ),
  }
}

export const grammar: Grammar = {
  start: "S",
  nonTerminals: ["S", "A", "B", "C", "D"],
  terminals: ["a", "b", "c"],
  productions: {
    S: [["a", "A", "a"], ["b", "B", "a"]],
    A: [["b", "B", "b"], ["a", "C", "a"]],
    B: [["c", "C", "c"], []],
    C: [["b", "D", "a"], ["a"]],
    D: [["c", "S", "b"]],
  },
}

export function isNonTerminal(g: Grammar, sym: string) {
  return g.nonTerminals.includes(sym)
}

export function isTerminal(g: Grammar, sym: string) {
  return g.terminals.includes(sym)
}

// Representação legível de uma produção ("TX", "+TX", "ε", ...)
export function prodToString(symbols: string[]) {
  return symbols.length === 0 ? EPSILON : symbols.join("")
}

// ----------------------------------------------------------------------------
// FIRST
// ----------------------------------------------------------------------------
export type SymbolSet = Record<string, Set<string>>

export function computeFirst(g: Grammar): SymbolSet {
  const first: SymbolSet = {}
  for (const nt of g.nonTerminals) first[nt] = new Set()

  // FIRST de uma sequência de símbolos
  const firstOfSequence = (seq: string[]): Set<string> => {
    const result = new Set<string>()
    if (seq.length === 0) {
      result.add(EPSILON)
      return result
    }
    let allEpsilon = true
    for (const sym of seq) {
      if (isTerminal(g, sym)) {
        result.add(sym)
        allEpsilon = false
        break
      }
      // não-terminal
      const f = first[sym] ?? new Set<string>()
      for (const t of f) if (t !== EPSILON) result.add(t)
      if (!f.has(EPSILON)) {
        allEpsilon = false
        break
      }
    }
    if (allEpsilon) result.add(EPSILON)
    return result
  }

  let changed = true
  while (changed) {
    changed = false
    for (const nt of g.nonTerminals) {
      for (const prod of g.productions[nt]) {
        const before = first[nt].size
        for (const t of firstOfSequence(prod)) first[nt].add(t)
        if (first[nt].size !== before) changed = true
      }
    }
  }

  return first
}

export function firstOfSequence(g: Grammar, first: SymbolSet, seq: string[]): Set<string> {
  const result = new Set<string>()
  if (seq.length === 0) {
    result.add(EPSILON)
    return result
  }
  let allEpsilon = true
  for (const sym of seq) {
    if (isTerminal(g, sym)) {
      result.add(sym)
      allEpsilon = false
      break
    }
    const f = first[sym] ?? new Set<string>()
    for (const t of f) if (t !== EPSILON) result.add(t)
    if (!f.has(EPSILON)) {
      allEpsilon = false
      break
    }
  }
  if (allEpsilon) result.add(EPSILON)
  return result
}

// ----------------------------------------------------------------------------
// FOLLOW
// ----------------------------------------------------------------------------
export function computeFollow(g: Grammar, first: SymbolSet): SymbolSet {
  const follow: SymbolSet = {}
  for (const nt of g.nonTerminals) follow[nt] = new Set()
  follow[g.start].add(EOF)

  let changed = true
  while (changed) {
    changed = false
    for (const nt of g.nonTerminals) {
      for (const prod of g.productions[nt]) {
        for (let i = 0; i < prod.length; i++) {
          const B = prod[i]
          if (!isNonTerminal(g, B)) continue
          const beta = prod.slice(i + 1)
          const firstBeta = firstOfSequence(g, first, beta)
          const before = follow[B].size
          for (const t of firstBeta) if (t !== EPSILON) follow[B].add(t)
          if (firstBeta.has(EPSILON)) {
            for (const t of follow[nt]) follow[B].add(t)
          }
          if (follow[B].size !== before) changed = true
        }
      }
    }
  }

  return follow
}

// ----------------------------------------------------------------------------
// Tabela de Parsing LL(1)
// ----------------------------------------------------------------------------
// table[NãoTerminal][terminal] = produção (lista de símbolos) | undefined
export type ParseTable = Record<string, Record<string, string[] | undefined>>

export function buildParseTable(g: Grammar, first: SymbolSet, follow: SymbolSet): ParseTable {
  const table: ParseTable = {}
  const cols = [...g.terminals, EOF]
  for (const nt of g.nonTerminals) {
    table[nt] = {}
    for (const c of cols) table[nt][c] = undefined
  }

  for (const nt of g.nonTerminals) {
    for (const prod of g.productions[nt]) {
      const firstAlpha = firstOfSequence(g, first, prod)
      for (const t of firstAlpha) {
        if (t !== EPSILON) table[nt][t] = prod
      }
      if (firstAlpha.has(EPSILON)) {
        for (const t of follow[nt]) table[nt][t] = prod
      }
    }
  }

  return table
}

// ----------------------------------------------------------------------------
// Dados pré-computados, prontos para a UI
// ----------------------------------------------------------------------------
export const FIRST = computeFirst(grammar)
export const FOLLOW = computeFollow(grammar, FIRST)
export const TABLE = buildParseTable(grammar, FIRST, FOLLOW)
export const COLUMNS = [...grammar.terminals, EOF]

export function setToString(set: Set<string>) {
  // ε por último para leitura mais natural
  const arr = [...set].filter((s) => s !== EPSILON)
  if (set.has(EPSILON)) arr.push(EPSILON)
  return `{ ${arr.join(", ")} }`
}

export function buildGrammarAnalysis(g: Grammar): GrammarAnalysis {
  const first = computeFirst(g)
  const follow = computeFollow(g, first)
  const table = buildParseTable(g, first, follow)
  const columns = [...g.terminals, EOF]

  return { first, follow, table, columns }
}
