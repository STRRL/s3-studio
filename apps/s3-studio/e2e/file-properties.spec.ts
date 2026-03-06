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

test.describe("File properties panel", () => {
  if (providers.length === 0) {
    test("skip when no E2E provider env vars are configured", async () => {
      test.skip(true, "No provider config found.");
    });
    return;
  }

  const provider = providers[0];

  test("clicking a file opens the properties panel", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Props ${id}`;
    const folderName = `e2e-props-folder-${id}`;
    const fileName = `e2e-props-file-${id}.txt`;
    const content = `hello-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);

    // Navigate into folder and upload a file
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, content);

    // Click the file row → properties panel should open
    await rowByName(page, fileName).click();
    const panel = page.locator("h3", { hasText: "Properties" });
    await expect(panel).toBeVisible();

    // Panel shows correct file name (exact match avoids collision with key-path row)
    await expect(page.locator(".flex.h-full.w-96").getByText(fileName, { exact: true })).toBeVisible();

    // Close panel with X button
    await page.locator(".flex.h-full.w-96").getByRole("button", { name: "" }).filter({ has: page.locator("svg") }).first().click();
    await expect(panel).not.toBeVisible();

    // Cleanup: go back to root and delete folder (with file inside)
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("properties panel shows correct file metadata", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Meta ${id}`;
    const folderName = `e2e-meta-folder-${id}`;
    const fileName = `e2e-meta-${id}.txt`;
    const content = `metadata-test-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, content);

    await rowByName(page, fileName).click();
    const panel = page.locator(".flex.h-full.w-96");
    await expect(panel.getByText("Properties")).toBeVisible();

    // Verify key path contains the folder and file name
    await expect(panel.getByText(folderName, { exact: false })).toBeVisible();
    await expect(panel.getByText(fileName, { exact: false })).toBeVisible();

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("rename file via properties panel", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Rename Panel ${id}`;
    const folderName = `e2e-rename-panel-folder-${id}`;
    const originalName = `e2e-rename-src-${id}.txt`;
    const newName = `e2e-rename-dst-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, originalName, `content-${id}`);

    // Open properties panel and rename
    await rowByName(page, originalName).click();
    await expect(page.getByText("Properties")).toBeVisible();
    await page.getByTitle("Rename").click();

    const renameDialog = page.getByRole("dialog").filter({ hasText: "Rename File" });
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByPlaceholder("Enter new name").fill(newName);
    await renameDialog.getByRole("button", { name: "Rename" }).click();

    await expect(rowByName(page, newName)).toBeVisible({ timeout: 30_000 });
    await expect(rowByName(page, originalName)).toHaveCount(0);

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("delete file via properties panel", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Del Panel ${id}`;
    const folderName = `e2e-del-panel-folder-${id}`;
    const fileName = `e2e-del-panel-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, `content-${id}`);

    // Open properties panel and delete
    await rowByName(page, fileName).click();
    await expect(page.getByText("Properties")).toBeVisible();
    await page.getByTitle("Delete").click();

    const deleteDialog = page.getByRole("dialog").filter({ hasText: "Delete file?" });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete" }).click();

    await expect(rowByName(page, fileName)).toHaveCount(0, { timeout: 30_000 });

    // Cleanup folder
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("text file preview renders content in properties panel", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Preview ${id}`;
    const folderName = `e2e-preview-folder-${id}`;
    const fileName = `e2e-preview-${id}.txt`;
    const content = `preview-content-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, content);

    // Click file → wait for preview to load (text content should appear in panel)
    await rowByName(page, fileName).click();
    await expect(page.getByText("Properties")).toBeVisible();
    await expect(page.locator(".flex.h-full.w-96").getByText(content, { exact: false })).toBeVisible({ timeout: 30_000 });

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("download file from properties panel", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Download ${id}`;
    const folderName = `e2e-dl-folder-${id}`;
    const fileName = `e2e-download-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, `download-me-${id}`);

    // Click file to open properties panel
    await rowByName(page, fileName).click();
    await expect(page.getByText("Properties")).toBeVisible();

    // Trigger download and verify filename
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(".flex.h-full.w-96").getByRole("button", { name: "Download" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(fileName);

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });
});
