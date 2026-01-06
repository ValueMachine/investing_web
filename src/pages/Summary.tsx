import { Navigation } from "@/components/Navigation";
import { investmentSummary } from "@/data";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Streamdown } from "streamdown";
import summaryCover from "@/assets/summary-cover.jpg";

export default function Summary() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pb-24">
        {/* Header */}
        <div className="relative h-[40vh] min-h-[400px] flex items-end pb-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={summaryCover} 
              alt="Summary Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
          <div className="container relative z-10 px-4">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {investmentSummary.title}
            </h1>
            <p className="text-2xl text-muted-foreground animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              {investmentSummary.subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl mt-12">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 space-y-16">
              {investmentSummary.sections.map((section, index) => (
                <section key={index} className="space-y-6">
                  <h2 className="font-display text-3xl font-bold text-primary border-l-4 border-accent pl-4">
                    {section.title}
                  </h2>
                  <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    <Streamdown>{section.content}</Streamdown>
                  </div>
                  {index < investmentSummary.sections.length - 1 && (
                    <Separator className="mt-12 opacity-50" />
                  )}
                </section>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
