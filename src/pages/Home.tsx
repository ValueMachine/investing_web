import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, BarChart3, Calendar } from "lucide-react";
import { Portfolio } from "@/components/Portfolio";
import heroImg from "@/assets/hero.jpg";
import summaryCover from "@/assets/summary-cover.jpg";
import weeklyCover from "@/assets/weekly-cover.jpg";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImg} 
              alt="Financial Markets" 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
          
          <div className="container relative z-10 px-4 text-center pb-12">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
              在分化与共振中前行
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              2025 年度投资回顾与每周实盘复盘
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Link href="/summary">
                <Button size="lg" className="text-lg px-8 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
                  阅读年度报告
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/weekly">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-background/50 backdrop-blur-sm border-primary text-primary hover:bg-background/80">
                  浏览每周复盘
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <Portfolio />
          </div>
        </section>

        {/* Featured Sections */}
        <section className="py-24 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            
            {/* Investment Summary Card */}
            <Link href="/summary">
              <a className="group block h-full">
                <Card className="h-full overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-card">
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                    <img 
                      src={summaryCover}
                      alt="Investment Summary"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-8">
                    <div className="flex items-center gap-2 text-[#9e7c0d] mb-2">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wider">Annual Report</span>
                    </div>
                    <CardTitle className="font-display text-3xl mb-2 group-hover:text-primary transition-colors">
                      2025 年度投资报告
                    </CardTitle>
                    <CardDescription className="text-base line-clamp-2">
                      回顾2025年全球市况，深入分析投资组合表现与归因，以及2026年AI与加密货币市场的展望。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      阅读全文 <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>

            {/* Weekly Review Card */}
            <Link href="/weekly">
              <a className="group block h-full">
                <Card className="h-full overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-card">
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                    <img 
                      src={weeklyCover}
                      alt="Weekly Reviews"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-8">
                    <div className="flex items-center gap-2 text-[#9e7c0d] mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wider">Weekly Journal</span>
                    </div>
                    <CardTitle className="font-display text-3xl mb-2 group-hover:text-primary transition-colors">
                      每周实盘复盘
                    </CardTitle>
                    <CardDescription className="text-base line-clamp-2">
                      记录每周市场动态、操作逻辑与心路历程，见证从波动中成长的真实轨迹。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      浏览列表 <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>

          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-display italic text-lg mb-4">"在分歧中上涨，在共振中前行"</p>
          <p className="text-sm">© 2025 投资总结与每周复盘 | Designed with Editorial Insight</p>
        </div>
      </footer>
    </div>
  );
}
