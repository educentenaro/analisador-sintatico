"use client"

import { useState } from "react"
import { Binary, Layers, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GrammarPanel } from "@/components/grammar-panel"
import { ParsingTable } from "@/components/parsing-table"
import { StackAnalyzer } from "@/components/stack-analyzer"

export default function Page() {
  const [sentence, setSentence] = useState("cid")
  const [tab, setTab] = useState("analise")

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
            <StackAnalyzer sentence={sentence} onSentenceChange={setSentence} />
          </TabsContent>

          <TabsContent value="referencia" className="space-y-6">
            <GrammarPanel />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary">Tabela de Parsing LL(1)</CardTitle>
              </CardHeader>
              <CardContent>
                <ParsingTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Analisador Sintático - Eduardo Centenaro e Luís Giaretta
      </footer>
    </main>
  )
}
