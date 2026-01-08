import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Phone, Mail, MessageCircle, QrCode } from "lucide-react";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  type: 'wechat' | 'official_account' | 'phone' | 'email' | string;
  label: string;
  value?: string;
  image_url?: string;
}

export function ContactFooter() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error("Error fetching contacts:", error);
      } else if (data) {
        setContacts(data);
      }
    };
    fetchContacts();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'wechat': return <MessageCircle className="w-4 h-4" />;
      case 'official_account': return <QrCode className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p className="font-display italic text-lg mb-8">"在分歧中上涨，在共振中前行"</p>
        
        {/* Contact Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center">
              {contact.image_url ? (
                // QR Code Types (WeChat, Official Account) - Using HoverCard
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                      {getIcon(contact.type)}
                      <span>{contact.label}</span>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-48 p-0 border-none shadow-lg">
                    <img 
                      src={contact.image_url} 
                      alt={contact.label}
                      className="w-full h-auto rounded-lg"
                    />
                  </HoverCardContent>
                </HoverCard>
              ) : (
                // Text Types (Phone, Email)
                <a 
                  href={contact.type === 'phone' ? `tel:${contact.value}` : contact.type === 'email' ? `mailto:${contact.value}` : '#'}
                  className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 hover:text-primary transition-colors"
                >
                  {getIcon(contact.type)}
                  <span>{contact.label}: {contact.value}</span>
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm">© 2025 投资总结与每周复盘 | Designed with Editorial Insight</p>
      </div>
    </footer>
  );
}
