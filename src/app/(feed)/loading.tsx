import { PageSkeleton, RepoCardSkeleton, Skeleton } from "@/components/skeleton/skeleton";

export default function LoadingFeed() {
  return (
    <PageSkeleton>
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex flex-col gap-6">
        <RepoCardSkeleton />
        <RepoCardSkeleton />
      </div>
    </PageSkeleton>
  );
}
