import { PageSkeleton, Skeleton } from "@/components/skeleton/skeleton";

export default function LoadingAccount() {
  return (
    <PageSkeleton>
      <div className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-edge p-5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-44" />
      </div>
    </PageSkeleton>
  );
}
