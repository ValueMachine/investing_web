import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getQuote } from "@/lib/finnhub";
import { Loader2, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Holding {
  symbol: string;
  shares: number;
  price: number;
  change: number;
  changePercent: number;
  value: number;
  dailyPL: number;
}

export function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalDailyPL, setTotalDailyPL] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get portfolio from Supabase
      const { data: portfolioData, error: dbError } = await supabase
        .from("portfolio")
        .select("*");

      if (dbError) throw dbError;
      if (!portfolioData || portfolioData.length === 0) {
        setHoldings([]);
        setTotalValue(0);
        setTotalDailyPL(0);
        setLoading(false);
        return;
      }

      // 2. Fetch quotes for each symbol
      const promises = portfolioData.map(async (item) => {
        const quote = await getQuote(item.symbol);
        if (!quote) return null;

        // Finnhub quote: c = current, d = change, dp = percent change
        const price = quote.c;
        const change = quote.d;
        const changePercent = quote.dp;
        
        return {
          symbol: item.symbol,
          shares: item.shares,
          price,
          change,
          changePercent,
          value: price * item.shares,
          dailyPL: change * item.shares,
        };
      });

      const results = await Promise.all(promises);
      const validHoldings = results.filter((h): h is Holding => h !== null);

      // 3. Calculate totals
      const tValue = validHoldings.reduce((sum, h) => sum + h.value, 0);
      const tPL = validHoldings.reduce((sum, h) => sum + h.dailyPL, 0);

      setHoldings(validHoldings);
      setTotalValue(tValue);
      setTotalDailyPL(tPL);
    } catch (err: any) {
      console.error("Portfolio fetch error:", err);
      setError("Failed to load portfolio data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
  };

  const formatPL = (val: number) => {
    return `${val > 0 ? "+" : ""}${formatCurrency(val)}`;
  };

  return (
    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-display text-2xl text-primary">
          Investment Portfolio
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && <div className="text-destructive text-sm mb-4">{error}</div>}
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Value</div>
            <div className="text-3xl font-bold font-display">{formatCurrency(totalValue)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Daily P/L</div>
            <div className={`text-3xl font-bold font-display flex items-center gap-2 ${totalDailyPL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {totalDailyPL >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {formatPL(totalDailyPL)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {holdings.map((h) => (
            <div key={h.symbol} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
              <div>
                <div className="font-bold text-lg">{h.symbol}</div>
                <div className="text-xs text-muted-foreground">{h.shares} Shares</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(h.value)}</div>
                <div className={`text-xs ${h.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(h.price)} ({formatPercent(h.changePercent)})
                </div>
              </div>
            </div>
          ))}
          {holdings.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No holdings found. Add data to Supabase.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
