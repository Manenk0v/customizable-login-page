import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Добро пожаловать</h1>
        <p className="text-xl text-muted-foreground">Современная система аутентификации</p>
        <Link to="/login">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full">
            Перейти к входу
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
