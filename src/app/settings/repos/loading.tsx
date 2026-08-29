import { PageSkeleton, Skeleton } from "@/components/skeleton/skeleton";

export default function LoadingRepos() {
  return (
    <PageSkeleton>
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-edge p-4">
            <Skeleton className="h-14 w-14 shrink-0" />
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
