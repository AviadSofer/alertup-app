export async function checkManagedBilling(admin: any) {
  try {
    const response = await admin.graphql(`
      #graphql
      query CheckBilling {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }
    `);
    
    const data = await response.json();
    
    const activeSubscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
    const hasActivePayment = activeSubscriptions.length > 0;
    
    return { hasActivePayment, subscriptions: activeSubscriptions };
  } catch (error) {
    console.error("Failed to check managed billing:", error);
    return { hasActivePayment: false, subscriptions: [] };
  }
}
