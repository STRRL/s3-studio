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

test.describe("Context menu operations", () => {
  if (providers.length === 0) {
    test("skip when no E2E provider env vars are configured", async () => {
      test.skip(true, "No provider config found.");
    });
    return;
  }

  const provider = providers[0];

  test("right-click folder: open via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Open ${id}`;
    const folderName = `e2e-ctx-open-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);

    // Right-click folder row → Open
    await rowByName(page, folderName).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Open" }).click();
    await expect(
      page.locator("[data-slot='breadcrumb-page']").getByText(folderName)
    ).toBeVisible();

    // Cleanup: navigate back and delete
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("right-click folder: delete via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Del Folder ${id}`;
    const folderName = `e2e-ctx-del-folder-${id}`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);

    // Right-click → Delete
    await rowByName(page, folderName).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("right-click file: rename via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Rename File ${id}`;
    const folderName = `e2e-ctx-rename-folder-${id}`;
    const originalName = `e2e-ctx-rename-src-${id}.txt`;
    const newName = `e2e-ctx-rename-dst-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, originalName, `content-${id}`);

    // Right-click file → Rename
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
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("right-click file: delete via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Del File ${id}`;
    const folderName = `e2e-ctx-del-file-folder-${id}`;
    const fileName = `e2e-ctx-del-file-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, `content-${id}`);

    // Right-click → Delete
    await rowByName(page, fileName).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("dialog").filter({ hasText: "Delete file?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, fileName)).toHaveCount(0, { timeout: 30_000 });

    // Cleanup folder
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("right-click file: download via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Download ${id}`;
    const folderName = `e2e-ctx-dl-folder-${id}`;
    const fileName = `e2e-ctx-download-${id}.txt`;

    await createAndConnectProfile(page, provider, profileName);
    await createFolder(page, folderName);
    await rowByName(page, folderName).getByRole("button", { name: folderName }).click();
    await uploadFile(page, fileName, `download-content-${id}`);

    // Right-click → Download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      (async () => {
        await rowByName(page, fileName).click({ button: "right" });
        await page.getByRole("menuitem", { name: "Download" }).click();
      })(),
    ]);
    expect(download.suggestedFilename()).toBe(fileName);

    // Cleanup
    await page.locator("nav").getByRole("button", { name: provider.bucket }).click();
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });

  test("right-click empty area: new folder via context menu", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E CTX Empty ${id}`;
    const folderName = `e2e-ctx-empty-folder-${id}`;

    await createAndConnectProfile(page, provider, profileName);

    // Right-click on the empty table area (outside rows)
    await page.locator("tbody").click({ button: "right", position: { x: 200, y: 50 } });
    await page.getByRole("menuitem", { name: "New Folder" }).click();

    const dialog = page.getByRole("dialog").filter({ hasText: "Create New Folder" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("Folder name").fill(folderName);
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(rowByName(page, folderName)).toBeVisible({ timeout: 30_000 });

    // Cleanup
    await rowByName(page, folderName).locator("td").nth(1).click();
    await page.getByTitle("Delete").click();
    await page.getByRole("dialog").filter({ hasText: "Delete folder?" }).getByRole("button", { name: "Delete" }).click();
    await expect(rowByName(page, folderName)).toHaveCount(0, { timeout: 30_000 });
  });
});
