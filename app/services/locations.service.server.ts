export async function getShopLocations(admin: any) {
  try {
    const response = await admin.graphql(
      `#graphql
      query GetLocations {
        locations(first: 50, query: "active:true") {
          edges {
            node {
              id
              name
            }
          }
        }
      }`
    );

    const { data } = await response.json();
    return data.locations.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
    }));
  } catch (error) {
    console.error("[getShopLocations] Failed to fetch locations:", error);
    return [];
  }
}
