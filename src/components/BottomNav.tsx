import { Fuel, MapPin, Plus, Search, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: "/", icon: MapPin, label: "Postos" },
    { path: "/search", icon: Search, label: "Buscar" },
    { path: "/add-station", icon: Plus, label: "Novo", isSpecial: true }, // O botão que faltava!
    { path: "/refuels", icon: Fuel, label: "Histórico" },
    { path: "/ranking", icon: Trophy, label: "Ranking" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          if (tab.isSpecial) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center -mt-8"
              >
                <div className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all">
                  <tab.icon size={24} />
                </div>
                <span className="text-[10px] font-medium mt-1 text-primary">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;