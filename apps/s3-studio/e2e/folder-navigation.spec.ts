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

test.describe("Folder navigation", () => {
  if (providers.length === 0) {
    test("skip when no E2E provider env vars are configured", async () => {
      test.skip(true, "No provider config found.");
    });
    return;
  }

  const provider = providers[0];

  test("nested folder: create and navigate in/out", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Nav ${id}`;
    const parentFolder = `e2e-parent-${id}`;
    const childFolder = `e2e-child-${id}`;

    await createAndConnectProfile(page, provider, profileName);

    // Create parent folder and navigate in
    await createFolder(page, parentFolder);
    await rowByName(page, parentFolder).getByRole("button", { name: parentFolder }).click();
    await expect(
      page.locator("[data-slot='breadcrumb-page']").getByText(parentFolder)
    ).toBeVisible();

    // Create child folder inside
    await createFolder(page, childFolder);
    await rowByName(page, childFolder).getByRole("button", { name: childFolder }).click();
    await expect(
      page.locator("[data-slot='breadcrumb-page']").getByText(childFolder)
    ).toBeVisible();

    // Navigate back to parent via breadcrumb link
    await page.locator("nav").getByRole("link", { name: parentFolder }).click();
    await expect(
      page.locator("[data-slot='breadcrumb-page']").getByText(parentFolder)
    ).toBeVisible();
    await expect(rowByName(page, childFolder)).toBeVisible({ timeout: 15_000 });

    // Navigate to root via bucket button in breadcrumb
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await expect(rowByName(page, parentFolder)).toBeVisible({ timeout: 15_000 });

    // Cleanup: delete parent folder (and its contents)
    await rowByName(page, parentFolder).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, parentFolder)).toHaveCount(0, { timeout: 30_000 });
  });

  test("refresh button reloads file listing", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Refresh ${id}`;
    const folderName = `e2e-refresh-folder-${id}`;
    const fileName = `e2e-refresh-file-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, `refresh-test-${id}`);

    // Click the refresh button and confirm file is still visible
    await page.getByTitle("Refresh").click();
    await expect(rowByName(page, fileName)).toBeVisible({ timeout: 30_000 });

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("rename folder via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Rename Folder ${id}`;
    const originalName = `e2e-folder-orig-${id}`;
    const newName = `e2e-folder-renamed-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, originalName);

    // Right-click on folder row → Rename
    await rowByName(page, originalName).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Rename" }).click();

    const renameDialog = page.getByRole("dialog").filter({ hasText: "Rename" });
    await expect(renameDialog).toBeVisible();
    await renameDialog.locator("input").clear();
    await renameDialog.locator("input").fill(newName);
    await renameDialog.getByRole("button", { name: "Rename" }).click();

    await expect(rowByName(page, newName)).toBeVisible({ timeout: 30_000 });
    await expect(rowByName(page, originalName)).toHaveCount(0);

    // Cleanup
    await rowByName(page, newName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, newName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("view mode toggle switches between list and grid", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E View Mode ${id}`;

    await createAndConnectProfile(page, provider, profileName);

    // Default should be list view (table visible)
    await expect(page.locator("table")).toBeVisible();

    // Switch to grid view
    await page.getByRole("button", { name: "" }).filter({ has: page.locator("svg.lucide-layout-grid") }).click();
    await expect(page.locator("table")).not.toBeVisible({ timeout: 5_000 });

    // Switch back to list view
    await page.getByRole("button", { name: "" }).filter({ has: page.locator("svg.lucide-list") }).click();
    await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });
  });
});
