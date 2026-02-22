const fuelTypes = ["Todos", "Gasolina", "Etanol", "Diesel", "GNV"];

const FuelTypeFilter = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (type: string) => void;
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {fuelTypes.map((type) => {
        const isActive = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
};

export default FuelTypeFilter;
