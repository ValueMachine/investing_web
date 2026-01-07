import { Navigation } from "@/components/Navigation";
import { weeklyReviews as staticReviews, type WeeklyReview } from "@/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";
import { Calendar as CalendarIcon, Search, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import weeklyCover from "@/assets/weekly-cover.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Weekly() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reviews, setReviews] = useState<WeeklyReview[]>(staticReviews);
  const [isLoading, setIsLoading] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      if (!supabase) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('weekly_reviews')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching reviews:', error);
          return;
        }

        if (data && data.length > 0) {
          const dbReviews: WeeklyReview[] = data.map(item => ({
            id: item.id,
            title: item.title,
            date: item.date,
            content: item.content,
            images: item.images
          }));
          
          const dbIds = new Set(dbReviews.map(r => r.id));
          const filteredStatic = staticReviews.filter(r => !dbIds.has(r.id));
          
          const combinedReviews = [...dbReviews, ...filteredStatic].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setReviews(combinedReviews); 
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Lightbox logic
  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Custom Image Component for Streamdown
  const CustomImage = (props: any) => {
    return (
      <img
        {...props}
        className="rounded-lg shadow-md my-6 max-w-full h-auto cursor-zoom-in hover:opacity-95 transition-opacity"
        onClick={() => openLightbox(props.src)}
      />
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);
  
  const filteredReviews = reviews.filter(review => 
    review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pb-24">
        {/* Header */}
        <div className="relative h-[30vh] min-h-[300px] flex items-end pb-12 overflow-hidden mb-12">
          <div className="absolute inset-0 z-0">
            <img 
              src={weeklyCover} 
              alt="Weekly Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          <div className="container relative z-10 px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              每周实盘复盘
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              记录市场脉搏，沉淀投资思考
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar / List */}
            <aside className="w-full md:w-1/3 lg:w-1/4 space-y-6 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索复盘..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span>History ({filteredReviews.length})</span>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div 
                      key={review.id} 
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(review.id);
                        if (el) {
                          const offset = 80;
                          const bodyRect = document.body.getBoundingClientRect().top;
                          const elementRect = el.getBoundingClientRect().top;
                          const elementPosition = elementRect - bodyRect;
                          const offsetPosition = elementPosition - offset;

                          window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                          });
                        }
                      }}
                      className="block p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs text-[#9e7c0d] mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        {review.date}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {review.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {review.content.substring(0, 60)}...
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 space-y-12 min-w-0">
              {filteredReviews.map((review) => (
                <section key={review.id} id={review.id} className="scroll-mt-24">
                  <Card className="overflow-hidden border-none shadow-sm">
                    <CardHeader className="bg-muted/30 border-b p-6 md:p-8">
                      <div className="flex items-center gap-2 text-accent font-medium mb-2">
                        <CalendarIcon className="w-4 h-4" />
                        {review.date}
                      </div>
                      <CardTitle className="font-display text-2xl md:text-3xl text-primary">
                        {review.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-muted-foreground">
                        <Streamdown components={{ img: CustomImage }}>
                          {review.content}
                        </Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              ))}
              
              {filteredReviews.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  {isLoading ? "加载中..." : "没有找到匹配的复盘记录"}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-[110]"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </Button>

          <div className="relative w-full h-full p-12 flex items-center justify-center">
            <img 
              src={lightboxSrc} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
