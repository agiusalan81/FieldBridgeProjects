type AccessClient = {
  rpc: (name: "claim_invites") => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

/** Identity and invitation roles are resolved by the database, never account metadata. */
export async function initializeAccountAccess(client: AccessClient): Promise<number> {
  const { data, error } = await client.rpc("claim_invites");
  if (error) throw new Error(error.message);
  if (typeof data !== "number" || !Number.isInteger(data) || data < 0) {
    throw new Error("Could not confirm account access");
  }
  return data;
}