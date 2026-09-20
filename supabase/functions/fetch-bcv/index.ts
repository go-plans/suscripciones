// ============================================================
//  Supabase Edge Function: fetch-bcv
//  Obtiene la tasa oficial BCV (fuente: dolarapi.com) y la
//  guarda en public.tasas_cambio (una fila por fecha).
//
//  Despliegue:
//    supabase functions deploy fetch-bcv --no-verify-jwt
//  Ejecución manual:
//    curl -X POST https://xbmewcmpfnligeodggop.supabase.co/functions/v1/fetch-bcv \
//      -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const DENO_KV_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

Deno.serve(async (_req) => {
  try {
    const res = await fetch(DENO_KV_URL);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `dolarapi respondio ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    // La API de dolarapi devuelve: { fecha, promedio, promedio_real, ... }
    const tasa = Number(data.promedio_real ?? data.promedio);

    if (!tasa || tasa <= 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "tasa invalida devuelta por dolarapi" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("tasas_cambio")
      .upsert({ fecha: new Date().toISOString().slice(0, 10), tasa_bcv: tasa });

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, fecha: new Date().toISOString().slice(0, 10), tasa_bcv: tasa }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});