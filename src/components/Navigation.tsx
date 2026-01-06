import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Calendar, ExternalLink, Home } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "首页", icon: Home },
    { href: "/summary", label: "年度报告", icon: BarChart3 },
    { href: "/weekly", label: "每周复盘", icon: Calendar },
  ];

  const externalLinks = [
    { href: "https://bytedance.larkoffice.com/wiki/Fl1iwNCqiitLqcka8YHcRrj9nGb", label: "Lark 投资总结" },
    { href: "https://bytedance.larkoffice.com/docx/XGBldg85woRHiXx31o3c1GCknvf", label: "Lark 每周复盘" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="font-display text-xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity">
              投资总结 2025
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              
              return (
                <Link key={link.href} href={link.href}>
                  <a
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground border-l pl-4">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                {link.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
