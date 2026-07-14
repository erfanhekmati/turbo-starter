import { PageHeaderSkeleton, UserCardSkeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <PageHeaderSkeleton description={false} />
      <UserCardSkeleton />
    </div>
  );
}
