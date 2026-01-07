import { Navigation } from "@/components/Navigation";
import { investmentSummary } from "@/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";
import { Calendar as CalendarIcon, Search, Loader2, X, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import summaryCover from "@/assets/summary-cover.jpg";
import { Button } from "@/components/ui/button";

// Reusing types from Weekly but adapted for Summary context
interface Report {
  id: string;
  title: string;
  date: string;
  content: string;
  images?: string[];
}

export default function Summary() {
  const [searchTerm, setSearchTerm] = useState("");
  // Convert the existing static summary to the new list format
  const staticReport: Report = {
    id: "2025-annual-static",
    title: investmentSummary.title,
    date: "2025-12-31",
    content: investmentSummary.sections.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n")
  };
  
  const [reports, setReports] = useState<Report[]>([staticReport]);
  const [isLoading, setIsLoading] = useState(false);

  // Lightbox state (copied from Weekly.tsx)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      if (!supabase) return;
      
      try {
        setIsLoading(true);
        // Fetch from the new 'annual_reports' table
        const { data, error } = await supabase
          .from('annual_reports')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching annual reports:', error);
          return;
        }

        if (data && data.length > 0) {
          const dbReports: Report[] = data.map(item => ({
            id: item.id,
            title: item.title,
            date: item.date,
            content: item.content,
            images: item.images
          }));
          
          // Merge with static report (if not duplicated by ID or similar key)
          // Here we just prepend dbReports to static for now, or replace if DB covers it.
          // Let's keep the static one as a fallback/historical record unless overwritten.
          
          setReports([...dbReports, staticReport]); 
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Lightbox logic
  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  }, [lightboxImages.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  }, [lightboxImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pb-24">
        {/* Header */}
        <div className="relative h-[30vh] min-h-[300px] flex items-end pb-12 overflow-hidden mb-12">
          <div className="absolute inset-0 z-0">
            <img 
              src={summaryCover} 
              alt="Summary Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          <div className="container relative z-10 px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              年度投资报告
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              深度复盘与未来展望
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar List */}
            <aside className="w-full md:w-1/3 lg:w-1/4 space-y-6 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索报告..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Reports ({filteredReports.length})</span>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div 
                      key={report.id} 
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(report.id);
                        if (el) {
                          const offset = 80;
                          const bodyRect = document.body.getBoundingClientRect().top;
                          const elementRect = el.getBoundingClientRect().top;
                          const elementPosition = elementRect - bodyRect;
                          const offsetPosition = elementPosition - offset;
                          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                        }
                      }}
                      className="block p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs text-[#9e7c0d] mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        {report.date}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {report.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {report.content.substring(0, 60)}...
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-12 min-w-0">
              {filteredReports.map((report) => (
                <section key={report.id} id={report.id} className="scroll-mt-24">
                  <Card className="overflow-hidden border-none shadow-sm">
                    <CardHeader className="bg-muted/30 border-b p-6 md:p-8">
                      <div className="flex items-center gap-2 text-accent font-medium mb-2">
                        <BarChart3 className="w-4 h-4" />
                        {report.date}
                      </div>
                      <CardTitle className="font-display text-2xl md:text-3xl text-primary">
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      
                      {/* Images */}
                      {report.images && report.images.length > 0 && (
                        <div className="mb-8 space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            年度图表
                          </h4>
                          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <div className="flex w-max space-x-4 p-4">
                              {report.images.map((img, index) => (
                                <div key={index} className="relative overflow-hidden rounded-md border bg-muted/50 group cursor-zoom-in">
                                  <img
                                    src={img}
                                    alt={`Report chart ${index + 1}`}
                                    className="h-[300px] w-auto object-contain transition-transform group-hover:scale-105"
                                    loading="lazy"
                                    onClick={() => openLightbox(report.images!, index)}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-center pb-2 md:hidden">
                              <span className="text-xs text-muted-foreground">← 滑动查看更多 →</span>
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-muted-foreground">
                        <Streamdown>{report.content}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              ))}
              
              {filteredReports.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  {isLoading ? "加载中..." : "暂无年度报告数据"}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-[110]"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 z-[110]"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </Button>

          <div className="relative w-full h-full p-12 flex items-center justify-center" onClick={closeLightbox}>
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 z-[110]"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight className="w-10 h-10" />
          </Button>
        </div>
      )}
    </div>
  );
}
