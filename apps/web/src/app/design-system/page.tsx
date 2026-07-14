"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SettingsIcon, ZapIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActionMenu,
  Alert,
  AlertDescription,
  AlertTitle,
  AvatarWithStatus,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationDialog,
  CurrencyInput,
  DashboardCard,
  DataTable,
  DeleteDialog,
  FileUpload,
  FloatingActionButton,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDialog,
  Input,
  InformationCard,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
  PhoneInput,
  PricingCard,
  ProductCard,
  ProfileMenu,
  SearchInput,
  SettingsMenu,
  Skeleton,
  StatisticsCard,
  Steps,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  UserCard,
  UserCardSkeleton,
  toast,
} from "@repo/ui";

import { invoiceColumns, invoiceData } from "./demo-table-columns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
});

export default function DesignSystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [columnsVisible, setColumnsVisible] = useState({ email: true, phone: false });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  function onSubmit(values: z.infer<typeof profileSchema>) {
    toast.success("Profile saved", `${values.name} <${values.email}>`);
    setFormDialogOpen(false);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Design System</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button size="icon" variant="outline">
            <ZapIcon />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Inputs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Text</Label>
            <Input placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="jane@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>Number</Label>
            <Input type="number" placeholder="42" />
          </div>
          <div className="space-y-1.5">
            <Label>Search</Label>
            <SearchInput placeholder="Search..." />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <CurrencyInput placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <PhoneInput placeholder="(555) 000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label>OTP</Label>
            <InputOTP maxLength={4}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Textarea</Label>
          <Textarea placeholder="Write a message..." />
        </div>
        <div className="space-y-1.5">
          <Label>File Upload</Label>
          <FileUpload value={files} onValueChange={setFiles} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Form</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Your full name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save</Button>
          </form>
        </Form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dialogs & Drawer</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setConfirmOpen(true)}>Confirmation Dialog</Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete Dialog
          </Button>
          <Button variant="outline" onClick={() => setFormDialogOpen(true)}>
            Form Dialog
          </Button>
        </div>
        <ConfirmationDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Publish changes?"
          description="This will make your changes visible to all users."
          onConfirm={() => {
            toast.success("Changes published");
            setConfirmOpen(false);
          }}
        />
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemName="the invoice"
          onDelete={() => {
            toast.error("Invoice deleted");
            setDeleteOpen(false);
          }}
        />
        <FormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          title="Edit profile"
          description="Update your profile details."
          footer={
            <>
              <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>Save changes</Button>
            </>
          }
        >
          <Input placeholder="Name" {...form.register("name")} />
          <Input placeholder="Email" {...form.register("email")} />
        </FormDialog>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dropdowns</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ProfileMenu
            name="Erfan Hekmati"
            email="erfanhekmati8@gmail.com"
            role="ADMIN"
            onProfile={() => toast.info("Open profile")}
            onSettings={() => toast.info("Open settings")}
            onLogout={() => toast.warning("Logged out")}
          />
          <ActionMenu
            actions={[
              { label: "Duplicate", onSelect: () => toast.info("Duplicated") },
              {
                label: "Delete",
                variant: "destructive",
                separatorBefore: true,
                onSelect: () => toast.error("Deleted"),
              },
            ]}
          />
          <SettingsMenu
            label="Columns"
            toggles={[
              {
                label: "email",
                checked: columnsVisible.email,
                onCheckedChange: (v) => setColumnsVisible((c) => ({ ...c, email: v })),
              },
              {
                label: "phone",
                checked: columnsVisible.phone,
                onCheckedChange: (v) => setColumnsVisible((c) => ({ ...c, phone: v })),
              },
            ]}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Toasts</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => toast.success("Saved successfully")}>Success</Button>
          <Button onClick={() => toast.error("Something went wrong")}>Error</Button>
          <Button onClick={() => toast.warning("Check your input")}>Warning</Button>
          <Button onClick={() => toast.loading("Uploading...")}>Loading</Button>
          <Button
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
                loading: "Saving...",
                success: "Saved!",
                error: "Failed to save",
              })
            }
          >
            Promise Toast
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Table (TanStack)</h2>
        <DataTable
          columns={invoiceColumns}
          data={invoiceData}
          enableRowSelection
          searchPlaceholder="Search invoices..."
          exportFilename="invoices.csv"
          bulkActions={(rows, clear) => (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  toast.error(`Deleted ${rows.length} invoices`);
                  clear();
                }}
              >
                Delete selected
              </Button>
            </>
          )}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard title="Revenue" description="Last 30 days">
            <Skeleton className="h-32 w-full" />
          </DashboardCard>
          <StatisticsCard label="Active Users" value="2,340" change={12.4} icon={<ZapIcon />} />
          <ProductCard
            imageUrl="https://picsum.photos/seed/product/400"
            imageAlt="Product"
            name="Wireless Headphones"
            description="Noise-cancelling, 30h battery"
            price="$129.00"
            badge="New"
            onAddToCart={() => toast.success("Added to cart")}
          />
          <UserCard
            name="Priya Nair"
            role="Engineer"
            email="priya@example.com"
            status="online"
            actions={
              <ActionMenu
                actions={[{ label: "Message", onSelect: () => toast.info("Opening chat") }]}
              />
            }
          />
          <PricingCard
            name="Pro"
            price="$29"
            description="For growing teams"
            features={["Unlimited projects", "Priority support", "Advanced analytics"]}
            highlighted
            badge="Popular"
            onCtaClick={() => toast.success("Upgraded to Pro")}
          />
          <InformationCard
            icon={<SettingsIcon className="size-4" />}
            title="Two-factor auth"
            description="Add an extra layer of security to your account."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Badges & Alerts</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Success</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="pending">Pending</Badge>
        </div>
        <div className="space-y-3">
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Try again.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>New version available.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Your subscription expires soon.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Skeletons & Avatar</h2>
        <div className="flex flex-wrap items-center gap-4">
          <UserCardSkeleton />
          <AvatarWithStatus name="Erfan Hekmati" status="online" />
          <AvatarWithStatus name="Sam Lee" status="away" />
          <AvatarWithStatus name="No Image" status="offline" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Steps</h2>
        <Steps
          steps={[
            { label: "Email", description: "Enter your address" },
            { label: "Verify", description: "Confirm the code" },
            { label: "Complete", description: "Set your details" },
          ]}
          currentStep={1}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tabs & Accordion</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>Summary content goes here.</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>Detailed content goes here.</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Is this accessible?</AccordionTrigger>
            <AccordionContent>Yes, built on Radix primitives.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <FloatingActionButton onClick={() => toast.info("FAB clicked")}>
        <ZapIcon />
      </FloatingActionButton>
    </div>
  );
}
