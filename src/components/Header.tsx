import { Calendar, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { profile, signOut } = useAuth();

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'student': return 'Aluno';
      case 'teacher': return 'Professor';
      case 'staff': return 'Colaborador';
      case 'library_admin': return 'Bibliotecário';
      default: return 'Usuário';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SENAC Biblioteca</h1>
              <p className="text-xs text-muted-foreground">Sistema de Agendamento</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {profile && (
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Bem-vindo,</span>
              <span className="font-medium">{profile.full_name}</span>
              <span className="text-xs px-2 py-1 bg-accent rounded-full text-accent-foreground">
                {getUserTypeLabel(profile.role)}
              </span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Minhas Reservas
              </DropdownMenuItem>
              {(profile?.role === 'library_admin') && (
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Administração
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}