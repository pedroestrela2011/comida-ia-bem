import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, History, PlusCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };
type Conversa = { id: number; titulo: string; messages: Msg[] };

import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou a NutriPlus, sua assistente de nutrição. Pergunte-me qualquer coisa sobre alimentos e saúde!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedConversas, setSavedConversas] = useState<Conversa[]>([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [viewingConversa, setViewingConversa] = useState<Conversa | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ type: "chat", messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro na conexão");
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const salvarConversa = () => {
    if (messages.length <= 1) return;
    const firstUser = messages.find(m => m.role === "user");
    const titulo = firstUser?.content.slice(0, 50) || "Conversa";
    setSavedConversas(prev => [{ id: Date.now(), titulo, messages: [...messages] }, ...prev]);
    toast({ title: "Conversa salva!" });
  };

  const novaConversa = () => {
    setMessages([
      { role: "assistant", content: "Olá! Sou a NutriPlus, sua assistente de nutrição. Pergunte-me qualquer coisa sobre alimentos e saúde!" },
    ]);
  };

  const renderChat = (msgs: Msg[], readonly = false) => (
    <>
      <div ref={readonly ? undefined : scrollRef} className="flex-1 overflow-auto rounded-xl border border-border bg-card p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {!readonly && isLoading && msgs[msgs.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Pergunte sobre nutrição..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100svh-8rem)] max-w-3xl">
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">NutriPlus</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs sm:text-sm">
              <History className="h-3.5 w-3.5" /> Histórico ({savedConversas.length})
            </TabsTrigger>
          </TabsList>
          {activeTab === "chat" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={salvarConversa} disabled={messages.length <= 1} className="flex-1 sm:flex-initial text-xs">
                <History className="mr-1 h-3.5 w-3.5" /> Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={novaConversa} className="flex-1 sm:flex-initial text-xs">
                <PlusCircle className="mr-1 h-3.5 w-3.5" /> Nova
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="chat" className="flex flex-col flex-1 min-h-0 mt-0">
          {renderChat(messages)}
        </TabsContent>

        <TabsContent value="historico" className="flex-1 min-h-0 overflow-auto mt-0">
          {viewingConversa ? (
            <div className="flex flex-col h-full">
              <Button variant="ghost" size="sm" onClick={() => setViewingConversa(null)} className="self-start mb-2">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
              </Button>
              <p className="text-sm font-semibold text-foreground mb-2">{viewingConversa.titulo}</p>
              {renderChat(viewingConversa.messages, true)}
            </div>
          ) : savedConversas.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma conversa salva ainda.</p>
              <p className="text-sm mt-1">Inicie uma conversa e clique em "Salvar".</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedConversas.map(c => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setViewingConversa(c)}>
                  <p className="font-semibold text-foreground text-sm">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.messages.length} mensagens</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
