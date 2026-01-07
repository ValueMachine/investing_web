import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getQuote } from "@/lib/finnhub";
import { Loader2, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Holding {
  symbol: string;
  shares: number;
  price: number;
  change: number;
  changePercent: number;
  value: number;
  dailyPL: number;
}

const ITEMS_PER_PAGE = 5;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalDailyPL, setTotalDailyPL] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
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

      const promises = portfolioData.map(async (item) => {
        const quote = await getQuote(item.symbol);
        if (!quote) return null;

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

      const tValue = validHoldings.reduce((sum, h) => sum + h.value, 0);
      const tPL = validHoldings.reduce((sum, h) => sum + h.dailyPL, 0);

      // Sort by value descending for better chart visualization
      validHoldings.sort((a, b) => b.value - a.value);

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

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, holdings]);

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

  // Chunk holdings for carousel
  const groupedHoldings: Holding[][] = [];
  for (let i = 0; i < holdings.length; i += ITEMS_PER_PAGE) {
    groupedHoldings.push(holdings.slice(i, i + ITEMS_PER_PAGE));
  }

  // Prepare chart data
  const chartData = holdings.map(h => ({
    name: h.symbol,
    value: h.value
  }));

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Pie Chart */}
          <div className="lg:col-span-1 h-[300px] w-full flex items-center justify-center">
            {holdings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Chart Data Loading...
              </div>
            )}
          </div>

          {/* Right Column: Stats & List */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/20 rounded-lg">
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

            {/* Carousel for pagination */}
            {groupedHoldings.length > 0 ? (
              <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                  {groupedHoldings.map((group, groupIndex) => (
                    <CarouselItem key={groupIndex}>
                      <div className="space-y-3">
                        {group.map((h) => (
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
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                {/* Dots Navigation */}
                {count > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: count }).map((_, index) => (
                      <button
                        key={index}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all",
                          current === index ? "bg-primary w-4" : "bg-primary/20 hover:bg-primary/40"
                        )}
                        onClick={() => api?.scrollTo(index)}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </Carousel>
            ) : (
              !loading && !error && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No holdings found. Add data to Supabase.
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
