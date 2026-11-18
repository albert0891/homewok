/**
 * The Remote the app uses: Supabase, through the one client in src/lib/supabase.ts.
 *
 * Row-level security decides which rows come back, so nothing here filters by
 * household: the database only ever returns the signed-in person's rows.
 */
import { supabase } from '@/lib/supabase';

import { toRpcArgs } from './changes';
import { type Remote, RemoteError } from './household';
import { batchSchema, ingredientSchema, shoppingItemSchema } from './rows';

/** The columns to read are the fields the row checks know, so the two always match. */
function columnsOf(schema: { shape: object }): string {
  return Object.keys(schema.shape).join(',');
}

/** Reads every row of one table that the signed-in person may see. */
async function readTable(table: string, columns: string, signal: AbortSignal): Promise<unknown[]> {
  const { data, error, status, count } = await supabase
    .from(table)
    .select(columns, { count: 'exact' })
    .abortSignal(signal);

  if (error) {
    throw new RemoteError(status, error.message);
  }
  // The database sends at most 1,000 rows at a time. A household has far fewer, but
  // a row that did not arrive must be a failure, never a food that seems to be gone.
  if (count !== data.length) {
    throw new Error(`Only ${data.length} of ${count} rows arrived from ${table}.`);
  }
  return data;
}

export const supabaseRemote: Remote = {
  async load(signal) {
    const [ingredients, batches, items] = await Promise.all([
      readTable('ingredients', columnsOf(ingredientSchema), signal),
      readTable('batches', columnsOf(batchSchema), signal),
      readTable('shopping_items', columnsOf(shoppingItemSchema), signal),
    ]);
    return { ingredients, batches, items };
  },

  async send(changes) {
    const { error, status } = await supabase.rpc('apply_changes', toRpcArgs(changes));
    if (error) {
      throw new RemoteError(status, error.message);
    }
  },

  async signedInUserId() {
    const { data, error } = await supabase.auth.getSession();
    // Renewing an old sign-in fails without a connection, which says nothing about who
    // is signed in. It counts as no answer, so the change is tried again later.
    if (error) {
      throw new RemoteError(0, error.message);
    }
    return data.session?.user.id ?? null;
  },
};
