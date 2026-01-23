import { Skeleton } from "@/components/ui/skeleton";

type StatItem = {
  label: string;
  value: string | number;
};

type StatsBarProps = {
  stats: StatItem[];
  isLoading?: boolean;
  className?: string;
};

export const StatsBar = ({
  stats,
  isLoading = false,
  className = "",
}: StatsBarProps) => {
  return (
    <div
      className={`w-full flex flex-col md:flex-row gap-4 md:bg-white/20 md:rounded-[25px] overflow-hidden ${className}`}
    >
      {isLoading ? (
        <>
          {[...Array(stats.length || 3)].map((_, i) => (
            <div
              key={i}
              className="flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md"
            >
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </>
      ) : (
        <>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/20 md:bg-transparent rounded-[25px] md:rounded-none flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md"
            >
              <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
                {stat.label}
              </span>
              <span className="text-2xl font-bold text-left w-full">
                {stat.value}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
