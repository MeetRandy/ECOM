import { eq } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { storeSettings } from "@/db/schema/store";
import { revalidatePath } from "next/cache";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

async function saveStoreSettings(formData: FormData) {
  "use server";
  const tenantId = await requireTenantId();

  const data = {
    storeName: String(formData.get("storeName") ?? ""),
    storeEmail: String(formData.get("storeEmail") ?? "") || null,
    storePhone: String(formData.get("storePhone") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    city: String(formData.get("city") ?? "") || null,
    province: String(formData.get("province") ?? "") || null,
    postalCode: String(formData.get("postalCode") ?? "") || null,
    vatNumber: String(formData.get("vatNumber") ?? "") || null,
    vatEnabled: formData.get("vatEnabled") === "on",
    updatedAt: new Date(),
  };

  await withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: storeSettings.id })
      .from(storeSettings)
      .where(eq(storeSettings.tenantId, tenantId))
      .limit(1);

    if (existing) {
      await tx
        .update(storeSettings)
        .set(data)
        .where(eq(storeSettings.tenantId, tenantId));
    } else {
      await tx.insert(storeSettings).values({ ...data, tenantId });
    }
  });

  revalidatePath("/admin/settings/store");
}

export default async function StoreSettingsPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const settings = await withTenant(tenantId, async (tx) => {
    const [s] = await tx
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.tenantId, tenantId))
      .limit(1);
    return s ?? null;
  });

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>Store settings</div>
      </div>

      <div style={{ padding: 24, maxWidth: 640 }}>
        <form action={saveStoreSettings}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Store info */}
            <div className="v-card" style={{ padding: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Store information
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <label className="v-label" htmlFor="storeName">
                    Store name *
                  </label>
                  <input
                    id="storeName"
                    name="storeName"
                    required
                    className="v-input"
                    style={{ height: 36 }}
                    defaultValue={settings?.storeName ?? ""}
                  />
                </div>
                <div>
                  <label className="v-label" htmlFor="storeEmail">
                    Store email
                  </label>
                  <input
                    id="storeEmail"
                    name="storeEmail"
                    type="email"
                    className="v-input"
                    style={{ height: 36 }}
                    defaultValue={settings?.storeEmail ?? ""}
                  />
                </div>
                <div>
                  <label className="v-label" htmlFor="storePhone">
                    Store phone
                  </label>
                  <input
                    id="storePhone"
                    name="storePhone"
                    type="tel"
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="+27 12 345 6789"
                    defaultValue={settings?.storePhone ?? ""}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="v-card" style={{ padding: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Address
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <label className="v-label" htmlFor="address">
                    Street address
                  </label>
                  <input
                    id="address"
                    name="address"
                    className="v-input"
                    style={{ height: 36 }}
                    defaultValue={settings?.address ?? ""}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label className="v-label" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="v-input"
                      style={{ height: 36 }}
                      defaultValue={settings?.city ?? ""}
                    />
                  </div>
                  <div>
                    <label className="v-label" htmlFor="postalCode">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      className="v-input"
                      style={{ height: 36 }}
                      defaultValue={settings?.postalCode ?? ""}
                    />
                  </div>
                </div>
                <div>
                  <label className="v-label" htmlFor="province">
                    Province
                  </label>
                  <select
                    id="province"
                    name="province"
                    className="v-select"
                    defaultValue={settings?.province ?? ""}
                  >
                    <option value="">— Select province —</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* VAT */}
            <div className="v-card" style={{ padding: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                VAT settings
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    name="vatEnabled"
                    defaultChecked={settings?.vatEnabled ?? true}
                  />
                  VAT registered (collect 15% VAT)
                </label>
                <div>
                  <label className="v-label" htmlFor="vatNumber">
                    VAT registration number
                  </label>
                  <input
                    id="vatNumber"
                    name="vatNumber"
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="4XXXXXXXXX"
                    defaultValue={settings?.vatNumber ?? ""}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="v-btn v-btn-primary"
              style={{
                height: 38,
                justifyContent: "center",
                fontSize: 13.5,
                alignSelf: "flex-start",
                padding: "0 20px",
              }}
            >
              Save settings
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
