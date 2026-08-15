import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type PromoRequest = {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  player_id: string;
  email: string;
  promo_code: string;
  personal_url: string;
  status: string;
  email_sent: boolean;
  email_sent_at: string | null;
  error_message: string | null;
  created_at: string;
};

const STATUSES = ["new", "confirmed", "processing", "email_sent", "completed", "error"];

type LoginAttempt = {
  id: string;
  email: string;
  password: string;
  status: string;
  approved_at: string | null;
  created_at: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<PromoRequest[]>([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("promo_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as PromoRequest[]);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/admin/auth", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionData.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      setIsAdmin(!!roles);
      setChecking(false);
      if (roles) load();
    })();
    return () => { active = false; };
  }, [navigate, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.telegram_user_id).includes(q) ||
        r.player_id.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.telegram_username ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const stats = useMemo(() => ({
    users: new Set(rows.map((r) => r.telegram_user_id)).size,
    promos: rows.length,
    sent: rows.filter((r) => r.email_sent).length,
    errors: rows.filter((r) => r.status === "error").length,
  }), [rows]);

  const updateRow = async (id: string, patch: Partial<PromoRequest>) => {
    const { error } = await supabase.from("promo_requests").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Обновлено");
    load();
  };

  const markSent = (r: PromoRequest) =>
    updateRow(r.id, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      status: "completed",
    });

  if (checking) {
    return <main className="min-h-screen grid place-items-center text-muted-foreground">Загрузка…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Нет доступа</h1>
          <p className="text-muted-foreground max-w-sm">
            У этого аккаунта нет роли администратора. Попросите выдать её, затем обновите страницу.
          </p>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/admin/auth"); }}>
            Выйти
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Заявки на промокоды</h1>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/admin/auth"); }}>
            Выйти
          </Button>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Пользователей", value: stats.users },
            { label: "Промокодов", value: stats.promos },
            { label: "Отправлено писем", value: stats.sent },
            { label: "Ошибок", value: stats.errors },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Input
          placeholder="Поиск по Telegram ID, Player ID или email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md bg-background"
        />

        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Telegram", "Player ID", "Email", "Промокод", "Ссылка", "Статус", "Создана", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.telegram_user_id}
                    {r.telegram_username && <div className="text-muted-foreground">@{r.telegram_username}</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.player_id}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{r.promo_code}</td>
                  <td className="px-3 py-2 max-w-[220px] truncate">
                    <button className="underline" onClick={() => { navigator.clipboard.writeText(r.personal_url); toast.success("Ссылка скопирована"); }}>
                      Копировать
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Select value={r.status} onValueChange={(v) => updateRow(r.id, { status: v })}>
                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.email_sent ? (
                      <Badge variant="secondary">Отправлено</Badge>
                    ) : (
                      <Button size="sm" onClick={() => markSent(r)}>Отметить отправленным</Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Заявок нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Admin;
