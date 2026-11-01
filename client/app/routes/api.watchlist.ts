import { data } from "react-router";
import type { Route } from "./+types/api.watchlist";
import { cleanTickers, serializeSavedTickers } from "~/lib/watchlist.server";

// Saves the whole watchlist (repeated `tickers` fields) to the cookie. The
// pages' loaders then revalidate and pick it up.
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const saved = cleanTickers(form.getAll("tickers"));
  return data(
    { saved },
    { headers: { "Set-Cookie": await serializeSavedTickers(saved) } },
  );
}
