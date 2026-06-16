import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { grammar, FIRST, FOLLOW, setToString, prodToString } from "@/lib/grammar"

export function GrammarPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Gramática</CardTitle>
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
            {"ε (épsilon) representa a produção vazia. E é o símbolo inicial."}
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
                <span>{setToString(FIRST[nt])}</span>
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
                <span>{setToString(FOLLOW[nt])}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
