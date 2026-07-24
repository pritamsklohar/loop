

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#1C1C1F] border border-white/5 rounded-xl ${className}`}
    />
  );
}
