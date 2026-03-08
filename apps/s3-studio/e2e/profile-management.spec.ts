import { expect, test } from "@playwright/test";
import { getConfiguredProviders } from "./providers";
import {
  randomId,
  createAndConnectProfile,
  openProfileSettings,
  deleteProfileViaSettings,
} from "./helpers";

const providers = getConfiguredProviders();

test.describe("Profile management", () => {
  if (providers.length === 0) {
    test("skip when no E2E provider env vars are configured", async () => {
      test.skip(true, "No provider config found.");
    });
    return;
  }

  const provider = providers[0];

  test("edit profile name", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const originalName = `E2E Profile ${id}`;
    const updatedName = `E2E Profile Updated ${id}`;

    await createAndConnectProfile(page, provider, originalName);

    // Open settings modal via sidebar dropdown
    await openProfileSettings(page, originalName);

    const modal = page.locator(".fixed.inset-0").filter({ hasText: "Edit Profile" });
    await expect(modal).toBeVisible();

    // Clear and fill new profile name
    const nameInput = modal.getByPlaceholder("My S3 Connection");
    await nameInput.clear();
    await nameInput.fill(updatedName);

    await modal.getByRole("button", { name: "Save Changes" }).click();

    // Verify updated name appears in sidebar
    await expect(page.locator("aside").getByText(updatedName)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("aside").getByText(originalName)).toHaveCount(0);

    // Cleanup: delete the profile
    await deleteProfileViaSettings(page, updatedName);
    await expect(page.locator("aside").getByText(updatedName)).toHaveCount(0, { timeout: 10_000 });
  });

  test("delete profile", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Delete Me ${id}`;

    await createAndConnectProfile(page, provider, profileName);

    // Open settings and delete
    await deleteProfileViaSettings(page, profileName);

    // Profile should be gone from sidebar
    await expect(page.locator("aside").getByText(profileName)).toHaveCount(0, { timeout: 10_000 });
  });

  test("disconnect hides file browser", async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const id = randomId();
    const profileName = `E2E Disconnect ${id}`;

    await createAndConnectProfile(page, provider, profileName);

    // Disconnect via sidebar dropdown
    const profileRow = page.locator("aside").getByText(profileName).locator("..");
    await profileRow.locator('button[title="Profile options"]').click();
    await page.getByRole("menuitem", { name: "Disconnect" }).click();

    // File browser toolbar should no longer be visible
    await expect(page.getByRole("button", { name: "New Folder" })).not.toBeVisible({ timeout: 10_000 });
    // No R2 data created — browser context resets between tests, no explicit cleanup needed
  });

  test("multiple profiles: create two and switch", async ({ page }) => {
    test.setTimeout(5 * 60_000);

    const id = randomId();
    const profileA = `E2E Multi A ${id}`;
    const profileB = `E2E Multi B ${id}`;

    // Create profile A via initial form
    await createAndConnectProfile(page, provider, profileA);

    // Add profile B via the sidebar "Add new profile" button (opens modal)
    await page.locator('button[title="Add new profile"]').click();
    const modal = page.locator(".fixed.inset-0").filter({ hasText: "New Profile" });
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await modal.getByPlaceholder("My S3 Connection").fill(profileB);
    await modal.getByPlaceholder("AKIAIOSFODNN7EXAMPLE").fill(provider.accessKeyId);
    await modal.getByPlaceholder("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY").fill(provider.secretAccessKey);
    await modal.getByPlaceholder("us-east-1").fill(provider.region);
    await modal.getByPlaceholder("my-bucket").fill(provider.bucket);
    await modal.getByPlaceholder("https://s3.example.com").fill(provider.endpoint);
    await modal.getByRole("button", { name: "Test Connection" }).click();
    await expect(modal.getByText("Connection successful")).toBeVisible({ timeout: 60_000 });
    await modal.getByRole("button", { name: "Create Profile" }).click();
    await expect(modal).not.toBeVisible({ timeout: 10_000 });
    // Wait for the connection to establish (same pattern as createAndConnectProfile)
    await expect(
      page.locator("nav").getByRole("button", { name: provider.bucket })
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: "New Folder" })).toBeVisible({ timeout: 30_000 });

    // Both profiles should appear in sidebar
    await expect(page.locator("aside").getByText(profileA)).toBeVisible();
    await expect(page.locator("aside").getByText(profileB)).toBeVisible();

    // Switch back to profile A by clicking it
    await page.locator("aside").getByText(profileA).click();
    // Wait for client re-init after profile switch
    await expect(
      page.locator("nav").getByRole("button", { name: provider.bucket })
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: "New Folder" })).toBeVisible({ timeout: 60_000 });

    // Cleanup both
    await deleteProfileViaSettings(page, profileA);
    await deleteProfileViaSettings(page, profileB);
  });
});
