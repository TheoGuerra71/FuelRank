import { Star, MapPin, Tag, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { StationWithPrices } from "@/hooks/useStations";

const sealConfig = {
  trusted: { icon: ShieldCheck, label: "Confiável", className: "text-success bg-success/10" },
  observation: { icon: AlertTriangle, label: "Em Observação", className: "text-warning bg-warning/10" },
  complaints: { icon: ShieldAlert, label: "Reclamações", className: "text-destructive bg-destructive/10" },
};

const StationCard = ({ station, index }: { station: StationWithPrices; index: number }) => {
  const navigate = useNavigate();
  const seal = sealConfig[station.seal];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      onClick={() => navigate(`/station/${station.id}`)}
      className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99] shadow-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate">{station.name}</h3>
            {station.has_promotion && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <Tag size={10} /> Promo
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <MapPin size={12} />
            <span className="truncate">{station.address}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Star size={14} className="text-warning fill-warning" />
          <span className="text-sm font-semibold text-foreground">{Number(station.rating).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({station.review_count})</span>
        </div>
      </div>

      {station.prices.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {station.prices.slice(0, 3).map((fuel) => (
            <div key={fuel.fuel_type} className="bg-background rounded-md px-3 py-1.5 flex-1 min-w-0 border border-border">
              <div className="text-[10px] text-muted-foreground truncate">{fuel.fuel_type}</div>
              <div className="font-display font-bold text-foreground">
                R$ {fuel.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${seal.className}`}>
          <seal.icon size={12} />
          <span className="font-medium">{seal.label}</span>
        </div>
        {station.has_promotion && station.promotion_text && (
          <span className="text-[10px] text-primary font-medium truncate max-w-[50%]">
            {station.promotion_text}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StationCard;
