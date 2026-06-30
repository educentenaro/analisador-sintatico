"use client"

import { useMemo, useState } from "react"
import { BookOpen, Layers, SlidersHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GrammarPanel } from "@/components/grammar-panel"
import { ParsingTable } from "@/components/parsing-table"
import { StackAnalyzer } from "@/components/stack-analyzer"
import { GrammarEditorModal } from "@/components/grammar-editor-modal"
import { buildGrammarAnalysis, cloneGrammar, grammar } from "@/lib/grammar"

export default function Page() {
  const [sentence, setSentence] = useState("aa")
  const [tab, setTab] = useState("analise")
  const [grammarConfig, setGrammarConfig] = useState(() => cloneGrammar(grammar))
  const [grammarEditorOpen, setGrammarEditorOpen] = useState(false)

  const grammarAnalysis = useMemo(() => buildGrammarAnalysis(grammarConfig), [grammarConfig])

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
            <TabsTrigger value="analise" className="gap-2">
              <Layers className="size-4" />
              <span className="hidden sm:inline">Análise por Pilha</span>
              <span className="sm:hidden">Pilha</span>
            </TabsTrigger>
            <TabsTrigger value="referencia" className="gap-2">
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">Referência</span>
              <span className="sm:hidden">Regras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analise">
            <StackAnalyzer
              sentence={sentence}
              onSentenceChange={setSentence}
              grammar={grammarConfig}
              table={grammarAnalysis.table}
              columns={grammarAnalysis.columns}
            />
          </TabsContent>

          <TabsContent value="referencia" className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGrammarEditorOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SlidersHorizontal className="size-4" />
                Editar gramática
              </button>
            </div>

            <GrammarPanel
              grammar={grammarConfig}
              first={grammarAnalysis.first}
              follow={grammarAnalysis.follow}
              onEditGrammar={() => setGrammarEditorOpen(true)}
            />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary">Tabela de Parsing LL(1)</CardTitle>
              </CardHeader>
              <CardContent>
                <ParsingTable
                  grammar={grammarConfig}
                  table={grammarAnalysis.table}
                  columns={grammarAnalysis.columns}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GrammarEditorModal
        open={grammarEditorOpen}
        grammar={grammarConfig}
        onClose={() => setGrammarEditorOpen(false)}
        onApply={setGrammarConfig}
      />

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Analisador Sintático - Eduardo Centenaro e Luís Giaretta
      </footer>
    </main>
  )
}
