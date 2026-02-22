import { ArrowLeft, Star, Fuel, MessageSquare, TrendingUp, ChevronRight, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const influenceLevels = [
  { name: "Iniciante", minPoints: 0, icon: "🌱" },
  { name: "Colaborador", minPoints: 500, icon: "🔥" },
  { name: "Influente", minPoints: 2000, icon: "⭐" },
  { name: "Especialista", minPoints: 5000, icon: "💎" },
  { name: "Embaixador", minPoints: 10000, icon: "👑" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.display_name || user?.email || "Usuário";
  const points = profile?.points || 0;
  const level = profile?.influence_level || "Iniciante";
  const currentLevelIdx = influenceLevels.findIndex((l) => l.name === level);
  const nextLevel = influenceLevels[currentLevelIdx + 1];
  const progressToNext = nextLevel
    ? ((points - influenceLevels[currentLevelIdx].minPoints) /
        (nextLevel.minPoints - influenceLevels[currentLevelIdx].minPoints)) * 100
    : 100;

  const stats = [
    { icon: Fuel, label: "Abastecimentos", value: profile?.total_refuels || 0 },
    { icon: MessageSquare, label: "Avaliações", value: profile?.reviews_count || 0 },
    { icon: TrendingUp, label: "Preços atualizados", value: profile?.price_updates || 0 },
    { icon: Star, label: "Pontos", value: points },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-display font-semibold text-foreground">Meu Perfil</h1>
          <button className="p-1">
            <Settings size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg text-foreground">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {level}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">{points} pts</span>
            </div>
          </div>
        </div>

        {nextLevel && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>{level}</span>
              <span>{nextLevel.name} ({nextLevel.minPoints} pts)</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-lg border border-border p-3 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon size={18} className="text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-lg text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2">
        <h2 className="font-display font-semibold text-foreground mb-3">Níveis de Influência</h2>
        <div className="space-y-2">
          {influenceLevels.map((lvl) => {
            const isUnlocked = points >= lvl.minPoints;
            const isCurrent = lvl.name === level;
            return (
              <div
                key={lvl.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : isUnlocked
                    ? "border-border bg-card"
                    : "border-border bg-secondary/30 opacity-50"
                }`}
              >
                <span className="text-lg">{lvl.icon}</span>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {lvl.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2">{lvl.minPoints} pts</span>
                </div>
                {isCurrent && <span className="text-[10px] text-primary font-semibold">ATUAL</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Total gasto em combustível</div>
            <div className="font-display text-2xl font-bold text-foreground">
              R$ {(profile?.total_spent || 0).toLocaleString("pt-BR")}
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-muted-foreground text-sm hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
