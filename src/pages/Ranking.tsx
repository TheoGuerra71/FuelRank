import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const Ranking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: ranking = [] } = useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, points, influence_level")
        .order("points", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-display font-semibold text-foreground">Ranking</h1>
          <div className="w-6" />
        </div>

        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-4 pt-4">
            {[1, 0, 2].map((idx) => {
              const u = ranking[idx];
              if (!u) return null;
              const isFirst = idx === 0;
              return (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className={`${isFirst ? "w-16 h-16" : "w-12 h-12"} rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground ${isFirst ? "border-2 border-primary/30" : ""}`}>
                    {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className={`text-xs font-semibold mt-1 ${idx === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">{u.display_name}</span>
                  <span className="text-[10px] text-primary font-semibold">{u.points} pts</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-2">
        {ranking.slice(3).map((u, i) => (
          <motion.div
            key={u.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-center gap-3 bg-card rounded-lg border p-3 ${
              u.user_id === user?.id ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            <span className="w-8 text-center font-display font-bold text-muted-foreground">{i + 4}</span>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
              {u.display_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {u.display_name}
                {u.user_id === user?.id && (
                  <span className="ml-1 text-[10px] text-primary">(você)</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{u.influence_level}</div>
            </div>
            <span className="text-sm font-display font-bold text-primary">{u.points}</span>
          </motion.div>
        ))}
        {ranking.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum usuário no ranking</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Ranking;
