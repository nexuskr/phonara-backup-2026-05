// @ts-nocheck: Supabase Edge Function + VSCode Deno 설정 충돌 해결을 위한 임시 비활성화
// supabase/functions/auth-email-hook/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log(
      `[Auth Email Hook] Received event: ${payload.type || "unknown"}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auth email hook processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Auth Email Hook] Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
