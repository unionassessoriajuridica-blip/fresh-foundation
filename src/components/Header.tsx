import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">FacilitaAdv</h1>
        </div>
        
        <Button variant="purple" className="px-6">
          Entrar / Criar Conta
        </Button>
      </div>
    </header>
  );
};

export default Header;