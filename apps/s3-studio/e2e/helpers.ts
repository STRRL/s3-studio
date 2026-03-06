import { expect, type Page } from "@playwright/test";
import type { StorageProviderConfig } from "./providers";

export function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function rowByName(page: Page, name: string) {
  return page.locator("tbody tr").filter({ hasText: name }).first();
}

export async function createAndConnectProfile(
  page: Page,
  provider: StorageProviderConfig,
  profileName: string
) {
  await page.goto("/");
  await expect(page.getByText("New Profile")).toBeVisible();
  await page.getByPlaceholder("My S3 Connection").fill(profileName);
  await page.getByPlaceholder("AKIAIOSFODNN7EXAMPLE").fill(provider.accessKeyId);
  await page
    .getByPlaceholder("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
    .fill(provider.secretAccessKey);
  await page.getByPlaceholder("us-east-1").fill(provider.region);
  await page.getByPlaceholder("my-bucket").fill(provider.bucket);
  await page.getByPlaceholder("https://s3.example.com").fill(provider.endpoint);
  await page.getByRole("button", { name: "Test Connection" }).click();
  await expect(page.getByText("Connection successful")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Create Profile" }).click();
  await expect(
    page.locator("nav").getByRole("button", { name: provider.bucket })
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "New Folder" })).toBeVisible();
}

export async function createFolder(page: Page, folderName: string) {
  await page.getByRole("button", { name: "New Folder" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create New Folder" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Folder name").fill(folderName);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(rowByName(page, folderName)).toBeVisible({ timeout: 30_000 });
}

export async function uploadFile(
  page: Page,
  filename: string,
  content: string
) {
  await page.locator('input[type="file"]').setInputFiles({
    name: filename,
    mimeType: "text/plain",
    buffer: Buffer.from(content, "utf-8"),
  });
  await expect(rowByName(page, filename)).toBeVisible({ timeout: 30_000 });
}

export async function openProfileSettings(page: Page, profileName: string) {
  const profileRow = page.locator("aside").getByText(profileName).locator("..");
  await profileRow.locator('button[title="Profile options"]').click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
}

export async function deleteProfileViaSettings(page: Page, profileName: string) {
  await openProfileSettings(page, profileName);
  const modal = page.locator(".fixed.inset-0").filter({ hasText: "Edit Profile" });
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Delete" }).click();
}
