import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { promoService } from "../_shared/promo-service.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

async function deriveSecret(key: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function tg(method: string, body: unknown) {
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) console.error(`Telegram ${method} failed [${res.status}]: ${text}`);
  return text;
}

const mainKeyboard = {
  keyboard: [[{ text: "🎁 Получить промокод" }], [{ text: "📨 Моя заявка" }, { text: "❓ Помощь" }]],
  resize_keyboard: true,
};
const cancelKeyboard = { keyboard: [[{ text: "❌ Отмена" }]], resize_keyboard: true };
const confirmKeyboard = {
  keyboard: [[{ text: "✅ Получить ссылку" }], [{ text: "✏️ Изменить данные" }], [{ text: "❌ Отмена" }]],
  resize_keyboard: true,
};

const send = (chatId: number, text: string, keyboard: unknown = mainKeyboard) =>
  tg("sendMessage", { chat_id: chatId, text, reply_markup: keyboard });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PLAYER_ID_RE = /^[0-9]{4,20}$/;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!TELEGRAM_API_KEY || !LOVABLE_API_KEY) {
    console.error("Missing TELEGRAM_API_KEY or LOVABLE_API_KEY");
    return new Response("Not configured", { status: 500 });
  }

  const expected = await deriveSecret(TELEGRAM_API_KEY);
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const update = await req.json();
  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id as number | undefined;
  const from = message?.from;
  const text = (message?.text ?? "").trim();
  if (!chatId || !from?.id) return new Response(JSON.stringify({ ok: true }));

  const tgUserId = from.id as number;
  const username = from.username ?? null;

  const setStep = async (step: string, patch: Record<string, unknown> = {}) => {
    await supabase.from("bot_sessions").upsert(
      { telegram_user_id: tgUserId, step, ...patch },
      { onConflict: "telegram_user_id" },
    );
  };

  const { data: session } = await supabase
    .from("bot_sessions").select("*").eq("telegram_user_id", tgUserId).maybeSingle();

  const { data: existing } = await supabase
    .from("promo_requests").select("*").eq("telegram_user_id", tgUserId).maybeSingle();

  const step = session?.step ?? "idle";

  try {
    if (text === "/start") {
      await setStep("idle", { draft_player_id: null, draft_email: null });
      await send(chatId, "Привет! 👋\n\nЗдесь ты можешь получить персональную ссылку с промокодом для Standoff 2.\n\nДля получения промокода нажми кнопку ниже.");
      return new Response(JSON.stringify({ ok: true }));
    }

    if (text === "❓ Помощь" || text === "/help") {
      await send(chatId, "Как это работает:\n\n1. Нажми «🎁 Получить промокод»\n2. Введи свой ID игрока Standoff 2\n3. Введи email\n4. Подтверди данные\n\nСсылку с промокодом мы отправим на указанный email вручную — обычно в течение суток.");
      return new Response(JSON.stringify({ ok: true }));
    }

    if (text === "❌ Отмена") {
      await setStep("idle", { draft_player_id: null, draft_email: null });
      await send(chatId, "Отменено. Можешь начать заново.");
      return new Response(JSON.stringify({ ok: true }));
    }

    if (text === "📨 Моя заявка") {
      if (existing) {
        await send(chatId, `Ваша заявка:\n\n🎮 ID игрока: ${existing.player_id}\n📧 Email: ${existing.email}\n📅 Создана: ${new Date(existing.created_at).toLocaleString("ru-RU")}\n📌 Статус: ${existing.status}\n\nСсылка будет отправлена на указанный email.`);
      } else {
        await send(chatId, "Заявок пока нет. Нажми «🎁 Получить промокод», чтобы создать.");
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    if (text === "🎁 Получить промокод") {
      if (existing) {
        await send(chatId, `Для этого аккаунта персональная ссылка уже была создана.\n\n📧 Она будет отправлена на: ${existing.email}\n\nЕсли письмо не пришло — напиши в поддержку.`);
        return new Response(JSON.stringify({ ok: true }));
      }
      await setStep("await_player_id", { draft_player_id: null, draft_email: null });
      await send(chatId, "Введите ваш ID игрока в Standoff 2:\n\nНапример: 123456789", cancelKeyboard);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (step === "await_player_id") {
      if (!PLAYER_ID_RE.test(text)) {
        await send(chatId, "Похоже, ID указан некорректно. Введите только цифры, например: 123456789", cancelKeyboard);
        return new Response(JSON.stringify({ ok: true }));
      }
      await setStep("await_email", { draft_player_id: text });
      await send(chatId, "Введите ваш email, на который будет отправлена персональная ссылка:", cancelKeyboard);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (step === "await_email") {
      if (!EMAIL_RE.test(text) || text.length > 255) {
        await send(chatId, "Похоже, email указан некорректно. Пожалуйста, проверьте его и попробуйте ещё раз.", cancelKeyboard);
        return new Response(JSON.stringify({ ok: true }));
      }
      await setStep("await_confirm", { draft_email: text });
      await send(chatId, `Проверьте данные:\n\n🎮 ID игрока: ${session?.draft_player_id}\n📧 Email: ${text}\n\nЕсли всё верно, нажмите «Получить ссылку».`, confirmKeyboard);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (step === "await_confirm") {
      if (text === "✏️ Изменить данные") {
        await setStep("await_player_id", { draft_player_id: null, draft_email: null });
        await send(chatId, "Введите ваш ID игрока в Standoff 2:", cancelKeyboard);
        return new Response(JSON.stringify({ ok: true }));
      }
      if (text === "✅ Получить ссылку") {
        const playerId = session?.draft_player_id as string;
        const email = session?.draft_email as string;
        if (!playerId || !email) {
          await setStep("idle");
          await send(chatId, "Данные потерялись, начните заново.");
          return new Response(JSON.stringify({ ok: true }));
        }

        const { data: dup } = await supabase
          .from("promo_requests").select("email")
          .or(`player_id.eq.${playerId},email.eq.${email}`).maybeSingle();
        if (dup) {
          await setStep("idle", { draft_player_id: null, draft_email: null });
          await send(chatId, `Для этих данных персональная ссылка уже была создана.\n\n📧 Она будет отправлена на: ${dup.email}`);
          return new Response(JSON.stringify({ ok: true }));
        }

        const promo = await promoService.generatePromo(playerId, tgUserId);
        const { error } = await supabase.from("promo_requests").insert({
          telegram_user_id: tgUserId,
          telegram_username: username,
          player_id: playerId,
          email,
          token: promo.token,
          promo_code: promo.promoCode,
          personal_url: promo.personalUrl,
          status: "confirmed",
        });
        if (error) {
          console.error("Insert failed:", error.message);
          await setStep("idle");
          await send(chatId, "Не удалось сохранить заявку. Попробуйте ещё раз немного позже.");
          return new Response(JSON.stringify({ ok: true }));
        }

        await setStep("idle", { draft_player_id: null, draft_email: null });
        await send(chatId, `Готово! 🎉\n\nВаша заявка принята.\n\n📧 Персональная ссылка будет отправлена на: ${email}\n\nПроверяйте входящие и папку «Спам».`);
        return new Response(JSON.stringify({ ok: true }));
      }
      await send(chatId, "Выберите действие кнопкой ниже.", confirmKeyboard);
      return new Response(JSON.stringify({ ok: true }));
    }

    await send(chatId, "Не понял команду. Выберите действие кнопкой ниже.");
    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error("Handler error:", e instanceof Error ? e.message : String(e));
    await send(chatId, "Произошла ошибка. Попробуйте ещё раз немного позже.");
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
});
