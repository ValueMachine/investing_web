import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getQuote, getCompanyProfile } from "@/lib/finnhub";
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, Settings, Trash2, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  price: number;
  change: number;
  changePercent: number;
  value: number;
  dailyPL: number;
  industry?: string;
}

const ITEMS_PER_PAGE = 5;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalDailyPL, setTotalDailyPL] = useState(0);
  const [sectorAllocations, setSectorAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Management state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: portfolioData, error: dbError } = await supabase
        .from("portfolio")
        .select("*")
        .order("symbol");

      if (dbError) throw dbError;
      if (!portfolioData || portfolioData.length === 0) {
        setHoldings([]);
        setTotalValue(0);
        setTotalDailyPL(0);
        setSectorAllocations({});
        setLoading(false);
        return;
      }

      const promises = portfolioData.map(async (item): Promise<Holding | null> => {
        const [quote, profile] = await Promise.all([
          getQuote(item.symbol),
          getCompanyProfile(item.symbol)
        ]);
        
        if (!quote) return null;

        const price = quote.c;
        const change = quote.d;
        const changePercent = quote.dp;
        const industry = profile?.finnhubIndustry || "Others";
        
        return {
          id: item.id,
          symbol: item.symbol,
          shares: item.shares,
          price,
          change,
          changePercent,
          value: price * item.shares,
          dailyPL: change * item.shares,
          industry
        };
      });

      const results = await Promise.all(promises);
      const validHoldings = results.filter((h): h is Holding => h !== null);

      const tValue = validHoldings.reduce((sum, h) => sum + h.value, 0);
      const tPL = validHoldings.reduce((sum, h) => sum + h.dailyPL, 0);

      // Sort by value descending for better chart visualization
      validHoldings.sort((a, b) => b.value - a.value);

      // Calculate sector allocation
      const sectors: Record<string, number> = {};
      validHoldings.forEach(h => {
        const industry = h.industry || "Others";
        sectors[industry] = (sectors[industry] || 0) + h.value;
      });

      // Normalize to percentages
      const allocations: Record<string, number> = {};
      for (const [sector, value] of Object.entries(sectors)) {
        if (tValue > 0) {
          allocations[sector] = (value / tValue) * 100;
        }
      }

      setHoldings(validHoldings);
      setTotalValue(tValue);
      setTotalDailyPL(tPL);
      setSectorAllocations(allocations);
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

  // Auth Handler
  const handleAuth = () => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (!adminPassword) {
      toast.error("Admin password not configured in environment variables.");
      return;
    }

    if (password === adminPassword) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      setIsManageOpen(true);
      setPassword("");
      toast.success("Access granted");
    } else {
      toast.error("Incorrect password");
    }
  };

  const handleManageClick = () => {
    if (isAuthenticated) {
      setIsManageOpen(true);
    } else {
      setShowPasswordDialog(true);
    }
  };

  // Management Handlers
  const handleAdd = async () => {
    if (!supabase || !newSymbol || !newShares) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("portfolio").insert([
        { symbol: newSymbol.toUpperCase(), shares: Number(newShares) }
      ]);
      if (error) throw error;
      setNewSymbol("");
      setNewShares("");
      fetchData();
      toast.success("Holding added");
    } catch (err) {
      console.error("Error adding holding:", err);
      toast.error("Failed to add holding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("portfolio").delete().eq("id", id);
      if (error) throw error;
      fetchData();
      toast.success("Holding removed");
    } catch (err) {
      console.error("Error deleting holding:", err);
      toast.error("Failed to remove holding");
    }
  };

  const handleUpdateShares = async (id: string, newShares: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("portfolio").update({ shares: newShares }).eq("id", id);
      if (error) throw error;
      fetchData();
      toast.success("Shares updated");
    } catch (err) {
      console.error("Error updating shares:", err);
      toast.error("Failed to update shares");
    }
  };

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

  // Custom Tooltip for PieChart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm">
          <div className="font-bold mb-1">{data.name}</div>
          <div className="text-muted-foreground">Market Value: <span className="text-foreground font-mono">{formatCurrency(data.value)}</span></div>
          <div className="text-muted-foreground">Portfolio: <span className="text-foreground font-mono">{percent.toFixed(2)}%</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-display text-2xl text-primary">
          Investment Portfolio
        </CardTitle>
        <div className="flex gap-2">
          {/* Password Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Admin Access</DialogTitle>
                <DialogDescription>
                  Please enter the admin password to manage holdings.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 py-4">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="password" className="sr-only">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
                <Button type="submit" size="sm" className="px-3" onClick={handleAuth}>
                  <Lock className="h-4 w-4" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Management Dialog */}
          <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleManageClick}>
              <Settings className="h-4 w-4" />
              Manage
            </Button>
            
            {isAuthenticated && (
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Holdings</DialogTitle>
                  <DialogDescription>
                    Add, remove, or update your portfolio positions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Add New Form */}
                  <div className="grid grid-cols-7 gap-4 items-end bg-muted/30 p-4 rounded-lg">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="symbol">Symbol</Label>
                      <Input 
                        id="symbol" 
                        placeholder="e.g. AAPL" 
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="shares">Shares</Label>
                      <Input 
                        id="shares" 
                        type="number" 
                        placeholder="0" 
                        value={newShares}
                        onChange={(e) => setNewShares(e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button onClick={handleAdd} disabled={isSubmitting || !newSymbol || !newShares} className="w-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Holdings List */}
                  <div className="space-y-2">
                    <Label>Current Holdings</Label>
                    <div className="border rounded-md divide-y">
                      {holdings.map((h) => (
                        <div key={h.id} className="grid grid-cols-7 gap-4 p-3 items-center">
                          <div className="col-span-3 font-bold">{h.symbol}</div>
                          <div className="col-span-3">
                            <Input 
                              type="number" 
                              defaultValue={h.shares}
                              className="h-8"
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val !== h.shares && !isNaN(val)) {
                                  handleUpdateShares(h.id, val);
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDelete(h.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {holdings.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No holdings yet. Add one above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>

          <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && <div className="text-destructive text-sm mb-4">{error}</div>}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Pie Chart & Allocation */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="h-[300px] w-full flex items-center justify-center">
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Chart Data Loading...
                </div>
              )}
            </div>

            {/* Asset Classification Text */}
            {Object.keys(sectorAllocations).length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 text-sm">
                <div className="font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Asset Allocation</div>
                <div className="space-y-1">
                  {Object.entries(sectorAllocations)
                    .sort(([, a], [, b]) => b - a)
                    .map(([sector, percent]) => (
                      <div key={sector} className="flex justify-between items-center">
                        <span className="text-muted-foreground truncate mr-2" title={sector}>{sector}</span>
                        <span className="font-mono font-medium">{percent.toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
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
                              <div className="font-bold text-lg flex items-center gap-2">
                                {h.symbol}
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                                  {h.industry}
                                </span>
                              </div>
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
