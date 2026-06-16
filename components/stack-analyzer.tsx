"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  FastForward,
  RotateCcw,
  Shuffle,
  StepForward,
  WandSparkles,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { grammar } from "@/lib/grammar"
import {
  applyProduction,
  formToSentence,
  leftmostNonTerminalIndex,
  parse,
  generateSentence,
  type ParseStep,
} from "@/lib/parser"
import { ParsingTable } from "@/components/parsing-table"
import { TABLE } from "@/lib/grammar"

const EXAMPLES = ["id", "cid", "idvid", "cideid", "idveid", "cidvid"]

function rowClasses(step: ParseStep, isCurrent: boolean) {
  return cn(
    "transition-colors",
    step.status === "accept" && "bg-accent/20",
    step.status === "error" && "bg-destructive/15",
    step.status === "expand" && "bg-primary/[0.04]",
    isCurrent && "outline outline-2 -outline-offset-2 outline-primary",
  )
}

export function StackAnalyzer({
  sentence,
  onSentenceChange,
}: {
  sentence: string
  onSentenceChange: (value: string) => void
}) {
  const [shown, setShown] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState<string[]>([grammar.start])

  const { steps, accepted } = useMemo(() => parse(sentence), [sentence])

  // Reinicia o traço sempre que a sentença mudar (inclusive vinda de fora)
  useEffect(() => {
    setShown(0)
  }, [sentence])

  const handleChange = (value: string) => {
    onSentenceChange(value)
    setShown(0)
  }

  const handleGenerate = () => {
    handleChange(generateSentence())
  }

  const openManualGeneration = () => {
    setManualOpen(true)
    setManualForm([grammar.start])
    setShown(0)
  }

  const closeManualGeneration = () => {
    setManualOpen(false)
    setManualForm([grammar.start])
  }

  const handleManualCellSelect = ({ nonTerminal, terminal }: { nonTerminal: string; terminal: string }) => {
    if (!manualOpen) return
    const activeIndex = leftmostNonTerminalIndex(grammar, manualForm)
    if (activeIndex === -1 || manualForm[activeIndex] !== nonTerminal) return

    const production = TABLE[nonTerminal][terminal]
    if (!production) return

    setManualForm((currentForm) => {
      const index = leftmostNonTerminalIndex(grammar, currentForm)
      if (index === -1 || currentForm[index] !== nonTerminal) return currentForm
      return applyProduction(currentForm, index, production)
    })
  }

  const manualIndex = leftmostNonTerminalIndex(grammar, manualForm)
  const manualCurrent = manualIndex === -1 ? null : manualForm[manualIndex]
  const manualSentence = formToSentence(grammar, manualForm)
  const manualFinished = manualIndex === -1
  const manualCanFinalize = manualFinished && manualSentence.length > 0
  const manualRowOptions = useMemo(() => {
    if (!manualCurrent) return []

    return Object.entries(TABLE[manualCurrent]).filter(([, production]) => Boolean(production)) as Array<[
      string,
      string[],
    ]>
  }, [manualCurrent])

  const finalizeManualSentence = () => {
    if (!manualCanFinalize) return
    handleChange(manualSentence)
    closeManualGeneration()
  }

  const next = () => setShown((s) => Math.min(s + 1, steps.length))
  const resolve = () => setShown(steps.length)
  const reset = () => setShown(0)

  const visible = steps.slice(0, shown)
  const current = shown > 0 ? steps[shown - 1] : null
  const finished = shown >= steps.length && steps.length > 0
  const highlight =
    current && current.status === "expand"
      ? { nonTerminal: current.stack.slice(-1), terminal: current.input[0] }
      : null

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Coluna de controles */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Sentença de entrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                value={sentence}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Ex.: cid"
                spellCheck={false}
                aria-label="Sentença de entrada"
                className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
              <div className="flex shrink-0 gap-2">
                <Button onClick={handleGenerate} className="gap-2">
                  <Shuffle className="size-4" />
                  Gerar
                </Button>
                <Button variant="outline" onClick={openManualGeneration} className="gap-2">
                  <WandSparkles className="size-4" />
                  Manual
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Exemplos rápidos</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleChange(ex)}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-xs transition-colors hover:bg-secondary",
                      sentence === ex && "border-primary bg-primary/10 text-primary",
                    )}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Passos da pilha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={reset} disabled={shown === 0} className="gap-2">
                <RotateCcw className="size-4" />
                Reiniciar
              </Button>
              <Button onClick={next} disabled={finished} className="gap-2">
                <StepForward className="size-4" />
                Próximo passo
              </Button>
              <Button variant="secondary" onClick={resolve} disabled={finished} className="gap-2">
                <FastForward className="size-4" />
                Resolver
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-mono font-medium">
                {shown}
              </span>
            </div>

            {finished && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
                  accepted
                    ? "border-accent/40 bg-accent/15 text-accent-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {accepted ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                {accepted ? "Sentença aceita pela gramática." : "Sentença rejeitada: erro sintático."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna do traço */}
      <div className="lg:col-span-3">
        <Card className="flex h-full flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base text-primary">
              Traço da análise
              {current && (
                <Badge variant="outline" className="font-mono font-normal">
                  {current.action}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="max-h-[420px] overflow-y-auto rounded-lg border">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-secondary">
                  <tr>
                    <th className="border-b px-3 py-2 text-left font-semibold">#</th>
                    <th className="border-b px-3 py-2 text-left font-semibold">Pilha</th>
                    <th className="border-b px-3 py-2 text-left font-semibold">Entrada</th>
                    <th className="border-b px-3 py-2 text-left font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        {'Clique em "Próximo passo" ou "Resolver" para iniciar a análise.'}
                      </td>
                    </tr>
                  )}
                  {visible.map((step, i) => (
                    <tr key={i} className={rowClasses(step, i === shown - 1)}>
                      <td className="border-b px-3 py-2 font-mono font-semibold text-muted-foreground">
                        {step.iter}
                      </td>
                      <td className="border-b px-3 py-2 font-mono font-medium">{step.stack}</td>
                      <td className="border-b px-3 py-2 font-mono">{step.input}</td>
                      <td className="border-b px-3 py-2 font-mono text-xs">{step.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de parsing sincronizada */}
      <div className="lg:col-span-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">
              Tabela de Parsing{" "}
              <span className="font-normal text-muted-foreground">
                — a célula usada no passo atual fica destacada
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParsingTable
              highlight={highlight}
              activeNonTerminal={manualOpen ? manualCurrent : null}
              onSelectCell={manualOpen ? handleManualCellSelect : undefined}
            />
          </CardContent>
        </Card>
      </div>

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <WandSparkles className="size-5" />
                  Geração manual
                </h2>
                <p className="text-sm text-muted-foreground">
                  Escolha uma das opções válidas para expandir o símbolo mais à esquerda.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeManualGeneration} aria-label="Fechar modal">
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Forma atual</p>
                      <p className="mt-1 font-mono text-lg font-semibold">{manualForm.join("") || "ε"}</p>
                    </div>
                    <div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                      {manualCurrent ? `Expandindo ${manualCurrent}` : "Concluída"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-background px-3 py-2">
                      <p className="text-xs text-muted-foreground">Próximo não-terminal</p>
                      <p className="mt-1 font-mono text-sm font-medium">{manualCurrent ?? "nenhum"}</p>
                    </div>
                    <div className="rounded-lg border bg-background px-3 py-2">
                      <p className="text-xs text-muted-foreground">Sentença parcial</p>
                      <p className="mt-1 font-mono text-sm font-medium">{manualSentence || "ε"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="size-3.5" />
                  <span>A tabela abaixo mostra onde clicar agora. A linha destacada é o símbolo que ainda precisa ser expandido.</span>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-primary">Caminho atual</p>
                    <span className="text-xs text-muted-foreground">
                      {manualRowOptions.length} {manualRowOptions.length === 1 ? "opção válida" : "opções válidas"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {manualRowOptions.map(([terminal, production]) => (
                      <span
                        key={terminal}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs",
                          production.length === 0 ? "border-accent/40 bg-accent/10 text-accent-foreground" : "bg-muted/40",
                        )}
                      >
                        <span className="font-semibold text-primary">{terminal}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{production.length === 0 ? "ε" : production.join("")}</span>
                      </span>
                    ))}
                  </div>

                  {!manualFinished ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Clique nas células da linha <span className="font-mono font-semibold text-foreground">{manualCurrent}</span>.
                      Se houver uma célula com <span className="font-mono font-semibold text-foreground">ε</span>, ela indica o passo que esvazia esse símbolo.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-accent-foreground">
                      A forma já contém somente terminais. Você já pode finalizar a sentença.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={finalizeManualSentence} disabled={!manualCanFinalize} className="gap-2">
                    Finalizar sentença
                  </Button>
                  <Button variant="outline" onClick={closeManualGeneration}>
                    Cancelar
                  </Button>
                </div>

                {manualOpen && !manualFinished && (
                  <p className="text-xs text-muted-foreground">
                    Escolha uma produção para o símbolo {manualCurrent} até que sobrem apenas terminais.
                  </p>
                )}

                {manualOpen && manualFinished && (
                  <p className="text-xs text-accent-foreground">
                    Sentença pronta: {manualSentence || "ε"}. Agora você pode finalizar.
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-secondary/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary">Tabela interativa</p>
                  <span className="text-xs text-muted-foreground">Apenas a linha ativa responde ao clique</span>
                </div>

                <div className="max-h-[420px] overflow-y-auto rounded-lg border bg-background">
                  <ParsingTable
                    highlight={highlight}
                    activeNonTerminal={manualCurrent}
                    onSelectCell={handleManualCellSelect}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
