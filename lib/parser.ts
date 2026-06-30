// ============================================================================
// Análise descendente preditiva (LL(1)) baseada em pilha + utilitários
// ============================================================================
import {
  EOF,
  EPSILON,
  type Grammar,
  type ParseTable,
  grammar as defaultGrammar,
  TABLE as defaultTable,
  isNonTerminal,
  isTerminal,
  prodToString,
} from "./grammar"

function tokenizeSentence(sentence: string, g: Grammar): string[] {
  const cleaned = sentence.replace(/\s+/g, "")
  const tokens: string[] = []
  const terminals = [...g.terminals].sort((a, b) => b.length - a.length)

  for (let i = 0; i < cleaned.length; ) {
    const match = terminals.find((terminal) => cleaned.startsWith(terminal, i))
    if (match) {
      tokens.push(match)
      i += match.length
      continue
    }

    tokens.push(cleaned[i])
    i++
  }

  return tokens
}

export type StepStatus = "expand" | "match" | "accept" | "error"

export type ParseStep = {
  iter: number
  stack: string // topo à direita, ex: "$E"
  input: string // restante da entrada, ex: "i+i$"
  action: string
  status: StepStatus
}

export type ParseResult = {
  steps: ParseStep[]
  accepted: boolean
}

const MAX_ITER = 500

/**
 * Executa a análise sintática de uma sentença e retorna todos os passos.
 * Cada passo mostra a pilha e a entrada ANTES da ação ser aplicada.
 */
export function parse(
  sentence: string,
  g: Grammar = defaultGrammar,
  table: ParseTable = defaultTable,
): ParseResult {
  const steps: ParseStep[] = []
  const stack: string[] = [EOF, g.start] // topo = último elemento
  const input: string[] = tokenizeSentence(sentence, g).concat(EOF)
  let iter = 0
  let accepted = false

  while (iter < MAX_ITER) {
    iter++
    const top = stack[stack.length - 1]
    const a = input[0]
    const stackStr = stack.join("")
    const inputStr = input.join("")

    if (top === EOF && a === EOF) {
      steps.push({ iter, stack: stackStr, input: inputStr, action: `Sentença aceita em ${iter} iterações`, status: "accept" })
      accepted = true
      break
    }

    if (isTerminal(g, top) || top === EOF) {
      if (top === a) {
        stack.pop()
        input.shift()
        steps.push({ iter, stack: stackStr, input: inputStr, action: `Lê '${top}'`, status: "match" })
      } else {
        steps.push({
          iter,
          stack: stackStr,
          input: inputStr,
          action: `Erro: esperava '${top}', encontrou '${a}'`,
          status: "error",
        })
        break
      }
      continue
    }

    // top é não-terminal
    if (isNonTerminal(g, top)) {
      const prod = table[top]?.[a]
      if (prod === undefined) {
        steps.push({
          iter,
          stack: stackStr,
          input: inputStr,
          action: `Erro: não há regra para [${top}, '${a}']`,
          status: "error",
        })
        break
      }
      stack.pop()
      // empilha em ordem reversa (ε não empilha nada)
      for (let i = prod.length - 1; i >= 0; i--) stack.push(prod[i])
      steps.push({
        iter,
        stack: stackStr,
        input: inputStr,
        action: `${top} → ${prodToString(prod)}`,
        status: "expand",
      })
      continue
    }

    steps.push({ iter, stack: stackStr, input: inputStr, action: `Erro inesperado`, status: "error" })
    break
  }

  return { steps, accepted }
}

/**
 * Gera uma sentença aleatória válida fazendo uma derivação mais à esquerda
 * com escolhas randômicas de produção. Possui limites para evitar recursão
 * infinita; reinicia caso ultrapasse os limites.
 */
export function generateSentence(g: Grammar = defaultGrammar, maxLength = 14): string {
  const MAX_STEPS = 60

  for (let attempt = 0; attempt < 400; attempt++) {
    let form: string[] = [g.start]
    let steps = 0
    let ok = true

    while (form.some((s) => isNonTerminal(g, s))) {
      steps++
      if (steps > MAX_STEPS || form.length > maxLength + 6) {
        ok = false
        break
      }
      const idx = form.findIndex((s) => isNonTerminal(g, s))
      const nt = form[idx]
      const prods = g.productions[nt]

      // Heurística: à medida que a forma cresce, prioriza produções que
      // encurtam (ex.: ε) para a derivação terminar.
      let prod: string[]
      if (form.length > maxLength) {
        const shortest = [...prods].sort((p1, p2) => p1.length - p2.length)
        prod = shortest[0]
      } else if (nt === g.start && prods.length > 1) {
        prod = prods[prods.length - 1]
      } else {
        prod = prods[Math.floor(Math.random() * prods.length)]
      }

      form = [...form.slice(0, idx), ...prod, ...form.slice(idx + 1)]
    }

    if (ok) {
      const sentence = form.join("")
      if (sentence.length > 0 && sentence.length <= maxLength) return sentence
      if (sentence.length > 0 && attempt > 200) return sentence
    }
  }

  return g.start === "S" ? "aa" : g.terminals[0] ?? "" // fallback seguro
}

// ----------------------------------------------------------------------------
// Construtor de sentença (derivação interativa)
// ----------------------------------------------------------------------------
export type DerivationEntry = {
  // forma sentencial ANTES de aplicar a produção
  before: string[]
  // não-terminal expandido (mais à esquerda)
  nonTerminal: string
  // produção aplicada
  production: string[]
}

/** Índice do não-terminal mais à esquerda, ou -1 se for sentença terminal. */
export function leftmostNonTerminalIndex(g: Grammar, form: string[]): number {
  return form.findIndex((s) => isNonTerminal(g, s))
}

/** Aplica a produção ao não-terminal mais à esquerda, devolvendo a nova forma. */
export function applyProduction(form: string[], idx: number, production: string[]): string[] {
  return [...form.slice(0, idx), ...production, ...form.slice(idx + 1)]
}

/** Apenas os terminais (a sentença final), ignorando ε implícito. */
export function formToSentence(g: Grammar, form: string[]): string {
  return form.filter((s) => s !== EPSILON && isTerminal(g, s)).join("")
}
