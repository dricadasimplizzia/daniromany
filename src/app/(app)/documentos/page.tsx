import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DocumentosClient } from "@/components/documentos/DocumentosClient";
import type { Documento } from "@/lib/supabase/database.types";

export default async function DocumentosPage() {
  const profile = await requireProfile();
  requireAccess(profile.role, "documentos");

  const supabase = await createClient();
  const { data } = await supabase.from("documentos").select("*").order("data_upload", { ascending: false });

  return <DocumentosClient documentos={(data ?? []) as Documento[]} role={profile.role} />;
}
