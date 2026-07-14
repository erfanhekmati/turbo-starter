import { DataTableSkeleton, PageHeaderSkeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <PageHeaderSkeleton />
      <DataTableSkeleton />
    </div>
  );
}
