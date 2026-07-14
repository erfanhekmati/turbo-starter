'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBreadcrumbs,
  Navbar,
  ProfileMenu,
  ProfileMenuSkeleton,
  ScrollArea,
  SidebarNav,
  ThemeToggle,
  toast,
  useSidebarCollapsed,
} from '@repo/ui';
import {
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth';
import { getApiClient } from '@/lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [collapsed, setCollapsed] = useSidebarCollapsed({
    storageKey: 'admin-sidebar-collapsed',
  });

  async function handleLogout() {
    try {
      await getApiClient().auth.logout();
    } catch {
      // ignore and continue clearing the local session
    }

    toast.success('Signed out');
    router.replace('/login');
    router.refresh();
  }

  const items = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="size-4" />,
      active: pathname.startsWith('/dashboard'),
    },
    {
      label: 'Users',
      href: '/users',
      icon: <Users className="size-4" />,
      active: pathname.startsWith('/users'),
    },
    {
      label: 'Audit',
      href: '/audit',
      icon: <Shield className="size-4" />,
      active: pathname.startsWith('/audit'),
    },
    {
      label: 'Files',
      href: '/files',
      icon: <FileText className="size-4" />,
      active: pathname.startsWith('/files'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="size-4" />,
      active: pathname.startsWith('/settings'),
    },
  ];

  const currentPage =
    items.find((item) => pathname.startsWith(item.href))?.label ?? 'Page';
  const breadcrumbItems = [
    { label: 'Home', href: '/dashboard' },
    { label: currentPage },
  ];

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : '';

  return (
    <div className="flex h-svh">
      <SidebarNav
        logo={<Link href="/dashboard">Turbo Starter Admin</Link>}
        items={items}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        storageKey={null}
        renderLink={(item, content) => (
          <Link key={item.href} href={item.href}>
            {content}
          </Link>
        )}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar
          links={
            <AppBreadcrumbs
              items={breadcrumbItems}
              renderLink={(item, label) => (
                <Link href={item.href}>{label}</Link>
              )}
            />
          }
          actions={
            <>
              <ThemeToggle />
              {isUserLoading ? (
                <ProfileMenuSkeleton />
              ) : user ? (
                <ProfileMenu
                  name={displayName || user.email}
                  email={user.email}
                  role={user.roles.length > 0 ? user.roles.join(', ') : undefined}
                  onSettings={() => router.push('/settings')}
                  onLogout={handleLogout}
                />
              ) : null}
            </>
          }
        />
        <main className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">{children}</div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
