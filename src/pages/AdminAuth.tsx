import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LOGIN_DOMAIN = "admin.local";

const toEmail = (login: string) => {
  const value = login.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${LOGIN_DOMAIN}`;
};

const AdminAuth = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login.trim() || !password) {
      setError("Введите логин и пароль");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: toEmail(login),
      password,
    });
    setLoading(false);
    if (authError) {
      setError("Неверный логин или пароль");
      return;
    }
    navigate("/admin", { replace: true });
  };

  return (
    <main className="dark min-h-screen flex items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <h1 className="mb-6 text-center text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Вход
        </h1>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          maxLength={64}
          className="h-12 w-full rounded-lg border border-border bg-secondary px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={72}
          className="h-12 w-full rounded-lg border border-border bg-secondary px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-primary text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
};

export default AdminAuth;
