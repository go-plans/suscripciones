// ============================================================
//  Supabase Edge Function: fetch-bcv
//  Obtiene la tasa oficial del BCV raspando el SITIO OFICIAL
//  https://www.bcv.org.ve/seccionportal/tipo-de-cambio-oficial-del-bcv
//  y la guarda en public.tasas_cambio (una fila por fecha).
//
//  Fuente (única): sitio oficial del BCV (tipo de cambio de
//  referencia SMC, bloque "USD" de la página). No usa dolarapi.
//
//  Nota CORS: la página de BCV NO envía cabeceras CORS, por eso
//  el scrape se hace server-side aquí (Deno), nunca en el browser.
//
//  Despliegue:
//    supabase functions deploy fetch-bcv --no-verify-jwt
//  Ejecución manual:
//    curl -X POST https://xbmewcmpfnligeodggop.supabase.co/functions/v1/fetch-bcv \
//      -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const BCV_URL =
  "https://www.bcv.org.ve/seccionportal/tipo-de-cambio-oficial-del-bcv";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** Normaliza "849,56400000" -> 849.564 (tolerante a "1.234,56"). */
function parseBcvNum(raw: string): number {
  const clean = String(raw).replace(/\s+/g, "").replace(/\.(?=\d{3}\D)/g, "");
  const num = Number(clean.replace(/,/g, "."));
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Extrae la tasa USD del HTML del BCV.
 * La página (Drupal) muestra el bloque con <div id="dolar"> y dentro:
 *   <strong class="strong-tb"> 849,56400000</strong>
 */
function extraerTasaUsd(html: string): number {
  const idx = html.indexOf('id="dolar"');
  if (idx === -1) throw new Error("no se encontró el bloque #dolar en el HTML del BCV");
  const bloque = html.slice(idx, idx + 4000);
  const m = bloque.match(/strong-tb">\s*([0-9][0-9.,]*)\s*</);
  if (!m) throw new Error("no se encontró el valor USD dentro del bloque #dolar");
  const tasa = parseBcvNum(m[1]);
  if (!(tasa > 0)) throw new Error(`tasa USD inválida parseada del HTML: "${m[1]}"`);
  return tasa;
}

/** Extrae la "Fecha Valor" que publica el BCV (p. ej. 2026-09-21). */
function extraerFechaValor(html: string): string {
  const m = html.match(
    /property="dc:date"[^>]*content="(\d{4}-\d{2}-\d{2})/,
  );
  return m?.[1] ?? new Date().toISOString().slice(0, 10);
}

Deno.serve(async (_req) => {
  try {
    const res = await fetch(BCV_URL, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
    });
    if (!res.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `bcv.org.ve respondió ${res.status}`,
          fuente: "bcv.oficial",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const html = await res.text();
    const tasa = extraerTasaUsd(html);
    const fecha = extraerFechaValor(html);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("tasas_cambio")
      .upsert({ fecha, tasa_bcv: tasa });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        ok: true,
        fuente: "bcv.oficial",
        fecha,
        tasa_bcv: tasa,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err),
        fuente: "bcv.oficial",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});