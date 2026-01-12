import type { Bucket } from "@/types/bucket";
import type { FileItem } from "@/types/file";
import type { NavSection, QuickAccessItem, User } from "@/types/navigation";

export const navigationSections: NavSection[] = [
  {
    items: [
      { label: "All Buckets", href: "/buckets", icon: "database" },
      { label: "Recent", href: "/recent", icon: "clock" },
      { label: "Starred", href: "/favorites", icon: "star" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Settings", href: "/settings", icon: "settings" },
      { label: "Credentials", href: "/settings/credentials", icon: "key-round" },
    ],
  },
];

export const quickAccessItems: QuickAccessItem[] = [
  { label: "Production Assets", href: "/buckets/production-assets", color: "#3B82F6" },
  { label: "Backup Logs", href: "/buckets/backup-logs", color: "#F97316" },
];

export const currentUser: User = {
  name: "Jane Doe",
  email: "jane@example.com",
  sessionType: "Local Session",
};

export const mockBuckets: Bucket[] = [
  {
    id: "1",
    name: "assets-production-v1",
    region: "us-east-1",
    access: "PUBLIC",
    size: "45.2 GB",
    sizeBytes: 48535191552,
    createdAt: new Date("2023-10-24"),
  },
  {
    id: "2",
    name: "backups-daily-secure",
    region: "eu-central-1",
    access: "PRIVATE",
    size: "1.2 TB",
    sizeBytes: 1319413953536,
    createdAt: new Date("2023-09-12"),
  },
  {
    id: "3",
    name: "logs-archive-2023",
    region: "us-west-2",
    access: "LIFECYCLE",
    size: "890 MB",
    sizeBytes: 933232640,
    createdAt: new Date("2023-11-01"),
  },
  {
    id: "4",
    name: "staging-media-content",
    region: "ap-northeast-1",
    access: "PRIVATE",
    size: "12.5 GB",
    sizeBytes: 13421772800,
    createdAt: new Date("2023-08-15"),
  },
  {
    id: "5",
    name: "web-static-hosting",
    region: "us-east-1",
    access: "PUBLIC",
    size: "340 MB",
    sizeBytes: 356515840,
    createdAt: new Date("2023-07-20"),
  },
];

export const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "assets",
    type: "folder",
    lastModified: new Date("2023-10-24T14:20:00"),
    isPublic: false,
    keyPath: "assets/",
  },
  {
    id: "2",
    name: "project-brief-v2.pdf",
    type: "file",
    size: "2.4 MB",
    sizeBytes: 2516582,
    lastModified: new Date("2024-01-11T10:23:00"),
    mimeType: "application/pdf",
    storageClass: "Standard",
    etag: "d41d8cd98f00b204e9800998ecf8427e",
    isPublic: false,
    keyPath: "graphics/project-brief-v2.pdf",
  },
  {
    id: "3",
    name: "banner-hero.png",
    type: "file",
    size: "1.2 MB",
    sizeBytes: 1258291,
    lastModified: new Date("2024-01-10T16:45:00"),
    mimeType: "image/png",
    storageClass: "Standard",
    etag: "098f6bcd4621d373cade4e832627b4f6",
    isPublic: true,
    keyPath: "graphics/banner-hero.png",
  },
  {
    id: "4",
    name: "readme.md",
    type: "file",
    size: "4 KB",
    sizeBytes: 4096,
    lastModified: new Date("2023-10-20T09:12:00"),
    mimeType: "text/markdown",
    storageClass: "Standard",
    etag: "5d41402abc4b2a76b9719d911017c592",
    isPublic: false,
    keyPath: "graphics/readme.md",
  },
];

export const storageUsage = {
  used: 150,
  total: 200,
  unit: "GB",
  percentage: 75,
};
