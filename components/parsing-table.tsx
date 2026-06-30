import { prodToString, type Grammar, type ParseTable } from "@/lib/grammar"
import { cn } from "@/lib/utils"

type Highlight = { nonTerminal: string; terminal: string } | null

type CellSelection = {
  nonTerminal: string
  terminal: string
  production: string[]
}

export function ParsingTable({
  grammar,
  table,
  columns,
  highlight = null,
  activeNonTerminal = null,
  onSelectCell,
}: {
  grammar: Grammar
  table: ParseTable
  columns: string[]
  highlight?: Highlight
  activeNonTerminal?: string | null
  onSelectCell?: (cell: CellSelection) => void
}) {
  const interactive = typeof onSelectCell === "function"

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="border border-primary/30 px-3 py-2 text-left font-semibold">
              <span className="sr-only">Não-terminal</span>
            </th>
            {columns.map((c) => (
              <th key={c} className="border border-primary/30 px-3 py-2 font-mono font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grammar.nonTerminals.map((nt) => (
            <tr key={nt} className={cn("even:bg-muted/40", activeNonTerminal === nt && "bg-accent/10")}>
              <th className="border bg-secondary px-3 py-2 text-center font-mono font-bold text-primary">
                {nt}
              </th>
              {columns.map((c) => {
                const prod = table[nt]?.[c]
                const isActive = highlight && highlight.nonTerminal === nt && highlight.terminal === c
                const canSelect = interactive && activeNonTerminal === nt && Boolean(prod)
                return (
                  <td
                    key={c}
                    className={cn(
                      "border px-1 py-1 text-center font-mono",
                      prod ? "text-foreground" : "text-muted-foreground/30",
                      isActive && "bg-accent/30 ring-2 ring-inset ring-accent",
                    )}
                  >
                    {prod ? (
                      <button
                        type="button"
                        onClick={() => onSelectCell?.({ nonTerminal: nt, terminal: c, production: prod })}
                        disabled={!canSelect}
                        className={cn(
                          "w-full rounded-md px-2 py-1 text-center transition-colors",
                          canSelect
                            ? "cursor-pointer hover:bg-primary/10"
                            : interactive
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-default",
                        )}
                        aria-label={`${nt} com entrada ${c}: ${prodToString(prod)}`}
                      >
                        {`${nt} → ${prodToString(prod)}`}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
