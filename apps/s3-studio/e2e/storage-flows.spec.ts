import { expect, test, type Page } from "@playwright/test";
import { getConfiguredProviders, type StorageProviderConfig } from "./providers";

const providers = getConfiguredProviders();

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowByName(page: Page, name: string) {
  return page.locator("tbody tr").filter({ hasText: name }).first();
}

async function createAndConnectProfile(
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
  await expect(page.getByText("Connection successful")).toBeVisible({
    timeout: 60_000,
  });

  await page.getByRole("button", { name: "Create Profile" }).click();
  await expect(
    page.locator("nav").getByRole("button", { name: provider.bucket })
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "New Folder" })).toBeVisible();
}

test.describe("S3 Studio real storage E2E", () => {
  if (providers.length === 0) {
    test("skip when no E2E provider env vars are configured", async () => {
      test.skip(
        true,
        "No provider config found. Set E2E_R2_* and/or E2E_SUPABASE_* env vars."
      );
    });
    return;
  }

  for (const provider of providers) {
    test(`main file flow on ${provider.label}`, async ({ page }) => {
      test.setTimeout(5 * 60_000);

      const id = randomId();
      const profileName = `E2E ${provider.label} ${id}`;
      const folderName = `e2e-folder-${id}`;
      const initialFileName = `e2e-upload-${id}.txt`;
      const renamedFileName = `e2e-renamed-${id}.txt`;
      const fileBody = `s3-studio-e2e:${provider.id}:${id}`;

      await createAndConnectProfile(page, provider, profileName);

      await page.getByRole("button", { name: "New Folder" }).click();
      const createFolderDialog = page
        .getByRole("dialog")
        .filter({ hasText: "Create New Folder" });
      await expect(createFolderDialog).toBeVisible();
      await createFolderDialog.getByPlaceholder("Folder name").fill(folderName);
      await createFolderDialog.getByRole("button", { name: "Create" }).click();

      const folderRow = rowByName(page, folderName);
      await expect(folderRow).toBeVisible({ timeout: 30_000 });

      await folderRow.getByRole("button", { name: folderName }).click();
      await expect(page.locator("[data-slot='breadcrumb-page']").getByText(folderName)).toBeVisible();

      await page.locator('input[type="file"]').setInputFiles({
        name: initialFileName,
        mimeType: "text/plain",
        buffer: Buffer.from(fileBody, "utf-8"),
      });

      await expect(rowByName(page, initialFileName)).toBeVisible({ timeout: 30_000 });

      const initialFileRow = rowByName(page, initialFileName);
      await initialFileRow.click();
      await page.getByTitle("Rename").click();

      const renameDialog = page.getByRole("dialog").filter({ hasText: "Rename File" });
      await expect(renameDialog).toBeVisible();
      await renameDialog.getByPlaceholder("Enter new name").fill(renamedFileName);
      await renameDialog.getByRole("button", { name: "Rename" }).click();

      await expect(rowByName(page, renamedFileName)).toBeVisible({ timeout: 30_000 });
      await expect(rowByName(page, initialFileName)).toHaveCount(0);

      const renamedFileRow = rowByName(page, renamedFileName);
      await renamedFileRow.click();
      await page.getByTitle("Delete").click();

      const deleteFileDialog = page.getByRole("dialog").filter({ hasText: "Delete file?" });
      await expect(deleteFileDialog).toBeVisible();
      await deleteFileDialog.getByRole("button", { name: "Delete" }).click();

      await expect(rowByName(page, renamedFileName)).toHaveCount(0, { timeout: 30_000 });

      await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
      await expect(folderRow).toBeVisible({ timeout: 30_000 });

      await folderRow.locator("td").nth(1).click();
      await page.getByTitle("Delete").click();

      const deleteFolderDialog = page.getByRole("dialog").filter({ hasText: "Delete folder?" });
      await expect(deleteFolderDialog).toBeVisible();
      await deleteFolderDialog.getByRole("button", { name: "Delete" }).click();

      await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
    });
  }
});
