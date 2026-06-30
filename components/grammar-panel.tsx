import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prodToString, setToString, type Grammar, type SymbolSet } from "@/lib/grammar"

type GrammarPanelProps = {
  grammar: Grammar
  first: SymbolSet
  follow: SymbolSet
  onEditGrammar?: () => void
}

export function GrammarPanel({ grammar, first, follow, onEditGrammar }: GrammarPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Gramática</CardTitle>
          {onEditGrammar && (
            <CardAction>
              <Button variant="outline" size="sm" onClick={onEditGrammar} className="gap-2">
                <Settings2 className="size-4" />
                Editar
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-mono text-sm">
            {grammar.nonTerminals.map((nt) => (
              <li key={nt} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-primary">{nt}</span>
                <span className="text-muted-foreground">→</span>
                <span>
                  {grammar.productions[nt].map((p, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 text-muted-foreground">|</span>}
                      {prodToString(p)}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {`ε (épsilon) representa a produção vazia. ${grammar.start} é o símbolo inicial.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Conjuntos First</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-mono text-sm">
            {grammar.nonTerminals.map((nt) => (
              <li key={nt} className="flex items-baseline gap-2">
                <span className="font-semibold text-primary">First({nt})</span>
                <span className="text-muted-foreground">=</span>
                <span>{setToString(first[nt])}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Conjuntos Follow</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-mono text-sm">
            {grammar.nonTerminals.map((nt) => (
              <li key={nt} className="flex items-baseline gap-2">
                <span className="font-semibold text-primary">Follow({nt})</span>
                <span className="text-muted-foreground">=</span>
                <span>{setToString(follow[nt])}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
