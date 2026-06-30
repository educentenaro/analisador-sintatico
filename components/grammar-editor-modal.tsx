"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EPSILON, type Grammar } from "@/lib/grammar"
import { cn } from "@/lib/utils"

type GrammarDraftRow = {
  symbol: string
  productions: string
}

type GrammarDraft = {
  start: string
  terminals: string
  rows: GrammarDraftRow[]
}

type GrammarEditorModalProps = {
  open: boolean
  grammar: Grammar
  onClose: () => void
  onApply: (grammar: Grammar) => void
}

function toDraft(grammar: Grammar): GrammarDraft {
  return {
    start: grammar.start,
    terminals: grammar.terminals.join(", "),
    rows: grammar.nonTerminals.map((symbol) => ({
      symbol,
      productions: grammar.productions[symbol].map((production) => (production.length === 0 ? EPSILON : production.join(" "))).join(" | "),
    })),
  }
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseProductionText(value: string) {
  const parts = value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length === 0) return [[]]

  return parts.map((part) => {
    if (part === EPSILON) return []
    return part.split(/\s+/).filter(Boolean)
  })
}

function buildGrammar(draft: GrammarDraft): { grammar?: Grammar; errors: string[] } {
  const errors: string[] = []
  const nonTerminals = draft.rows.map((row) => row.symbol.trim()).filter(Boolean)
  const terminals = splitList(draft.terminals)
  const start = draft.start.trim()

  if (!start) errors.push("Defina o símbolo inicial.")
  if (nonTerminals.length === 0) errors.push("Adicione pelo menos um não-terminal.")
  if (terminals.length === 0) errors.push("Adicione pelo menos um terminal.")

  const uniqueNonTerminals = new Set(nonTerminals)
  const uniqueTerminals = new Set(terminals)

  if (uniqueNonTerminals.size !== nonTerminals.length) errors.push("Os não-terminais não podem repetir nomes.")
  if (uniqueTerminals.size !== terminals.length) errors.push("Os terminais não podem repetir nomes.")

  for (const symbol of uniqueNonTerminals) {
    if (uniqueTerminals.has(symbol)) {
      errors.push(`O símbolo "${symbol}" não pode ser terminal e não-terminal ao mesmo tempo.`)
    }
  }

  if (start && !uniqueNonTerminals.has(start)) {
    errors.push("O símbolo inicial precisa existir na lista de não-terminais.")
  }

  const productions: Record<string, string[][]> = {}
  const validSymbols = new Set([...nonTerminals, ...terminals])

  for (const row of draft.rows) {
    const symbol = row.symbol.trim()
    if (!symbol) continue
    const parsedProductions = parseProductionText(row.productions)
    productions[symbol] = parsedProductions

    for (const production of parsedProductions) {
      for (const token of production) {
        if (!validSymbols.has(token)) {
          errors.push(`A produção de ${symbol} usa o símbolo "${token}" que não existe na gramática.`)
        }
      }
    }
  }

  if (Object.keys(productions).length !== uniqueNonTerminals.size) {
    errors.push("Cada não-terminal precisa de uma linha de produção.")
  }

  if (errors.length > 0) return { errors }

  return {
    errors: [],
    grammar: {
      start,
      nonTerminals,
      terminals,
      productions,
    },
  }
}

export function GrammarEditorModal({ open, grammar, onClose, onApply }: GrammarEditorModalProps) {
  const [draft, setDraft] = useState<GrammarDraft>(() => toDraft(grammar))
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setDraft(toDraft(grammar))
    setErrors([])
  }, [open, grammar])

  if (!open) return null

  const updateRow = (index: number, patch: Partial<GrammarDraftRow>) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }))
  }

  const addRow = () => {
    setDraft((current) => ({
      ...current,
      rows: [...current.rows, { symbol: "", productions: "" }],
    }))
  }

  const removeRow = (index: number) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const handleApply = () => {
    const result = buildGrammar(draft)
    if (!result.grammar) {
      setErrors(result.errors)
      return
    }

    setErrors([])
    onApply(result.grammar)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border bg-background shadow-2xl" onClick={onClose}>
        <div className="flex max-h-[90dvh] flex-col" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Editar gramática</h2>
              <p className="text-sm text-muted-foreground">
                Ajuste símbolo inicial, terminais e produções sem editar o código.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar modal">
              <X className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 overflow-y-auto px-5 py-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Parâmetros gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="grammar-start">
                      Símbolo inicial
                    </label>
                    <input
                      id="grammar-start"
                      value={draft.start}
                      onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="grammar-terminals">
                      Terminais
                    </label>
                    <textarea
                      id="grammar-terminals"
                      value={draft.terminals}
                      onChange={(event) => setDraft((current) => ({ ...current, terminals: event.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      placeholder="a, b, c"
                    />
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Separe símbolos por vírgula. Use <span className="font-mono text-foreground">ε</span> para produção vazia.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Validação</CardTitle>
                </CardHeader>
                <CardContent>
                  {errors.length > 0 ? (
                    <ul className="space-y-2 text-sm text-destructive">
                      {errors.map((error) => (
                        <li key={error} className="flex gap-2">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum erro detectado no formulário ainda. Clique em aplicar para recalcular FIRST, FOLLOW e a tabela.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-primary">Produções</h3>
                  <p className="text-sm text-muted-foreground">
                    Escreva cada alternativa separada por <span className="font-mono">|</span> e cada símbolo separado por espaço.
                  </p>
                </div>
                <Button variant="outline" onClick={addRow} className="gap-2">
                  <Plus className="size-4" />
                  Adicionar regra
                </Button>
              </div>

              <div className="space-y-3">
                {draft.rows.map((row, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="space-y-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Não-terminal
                          </label>
                          <input
                            value={row.symbol}
                            onChange={(event) => updateRow(index, { symbol: event.target.value })}
                            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            placeholder="S"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Produções
                          </label>
                          <textarea
                            value={row.productions}
                            onChange={(event) => updateRow(index, { productions: event.target.value })}
                            rows={3}
                            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            placeholder="a A a | b B a"
                          />
                          <p className="text-xs text-muted-foreground">
                            Exemplo: <span className="font-mono text-foreground">a A a | ε</span>
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                          className={cn("mt-6 text-muted-foreground hover:text-destructive")}
                          aria-label={`Remover regra ${row.symbol || index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleApply}>Aplicar alterações</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}