import { expect, test } from "@playwright/test";
import { getConfiguredProviders } from "./providers";
import {
  randomId,
  rowByName,
  createAndConnectProfile,
  createFolder,
  uploadFile,
} from "./helpers";

const providers = getConfiguredProviders();

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

      // Create folder
      await createFolder(page, folderName);

      // Navigate into folder
      const folderRow = rowByName(page, folderName);
      await folderRow.getByRole("button", { name: folderName }).click();
      await expect(
        page.locator("[data-slot='breadcrumb-page']").getByText(folderName)
      ).toBeVisible();

      // Upload file
      await uploadFile(page, initialFileName, fileBody);

      // Rename file via properties panel
      const initialFileRow = rowByName(page, initialFileName);
      await initialFileRow.click();
      await page.getByTitle("Rename").click();

      const renameDialog = page.getByRole("dialog").filter({ hasText: "Rename File" });
      await expect(renameDialog).toBeVisible();
      await renameDialog.getByPlaceholder("Enter new name").fill(renamedFileName);
      await renameDialog.getByRole("button", { name: "Rename" }).click();

      await expect(rowByName(page, renamedFileName)).toBeVisible({ timeout: 30_000 });
      await expect(rowByName(page, initialFileName)).toHaveCount(0);

      // Delete file via properties panel
      const renamedFileRow = rowByName(page, renamedFileName);
      await renamedFileRow.click();
      await page.getByTitle("Delete").click();

      const deleteFileDialog = page.getByRole("dialog").filter({ hasText: "Delete file?" });
      await expect(deleteFileDialog).toBeVisible();
      await deleteFileDialog.getByRole("button", { name: "Delete" }).click();
      await expect(rowByName(page, renamedFileName)).toHaveCount(0, { timeout: 30_000 });

      // Navigate back to root and delete folder
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
