const METRIKA_ENDPOINT = "https://metrika.run/api/v1/resources/search";
const DISCORD_INVITE_CODE = "t6nhzTvaY5";
const accounts = [
  { id: 1, social: "Twitch", platform: "twitch", identifier: "neekkros", type: "Seguidores" },
  { id: 2, social: "YouTube", platform: "youtube", identifier: "Neekkros", type: "Suscriptores" },
  { id: 3, social: "Instagram", platform: "instagram", identifier: "neekkros", type: "Seguidores" },
  { id: 4, social: "X", platform: "x", identifier: "neekkros", type: "Seguidores" },
  { id: 5, social: "TikTok", platform: "tiktok", identifier: "Neekkros", type: "Seguidores" },
];
const discord = { id: 6, social: "Discord", type: "Miembros" };

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

async function fetchMetrikaRows() {
  const response = await fetch(METRIKA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRequiredEnv("METRIKA_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resources: accounts.map(({ platform, identifier }) => ({
        platform,
        type: "account",
        identifier,
      })),
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Metrika respondió con HTTP ${response.status}.`);

  const payload = await response.json();
  const rows = [];
  const pending = [];

  for (const account of accounts) {
    const resource = payload.data?.find((item) => item.platform === account.platform);
    const metric = resource?.metrics?.followers;
    const amount = metric?.value;

    if (Number.isFinite(amount) && amount >= 0) {
      rows.push({ ...account, amount });
    } else if (resource?.status === "pending" || metric?.status === "pending") {
      pending.push(account.social);
    } else {
      console.warn(`Metrika no devolvió un recuento para ${account.social}; se conserva el valor anterior.`);
    }
  }

  if (pending.length) console.log(`Datos aún pendientes: ${pending.join(", ")}.`);
  return rows;
}

async function fetchDiscordRow() {
  const response = await fetch(
    `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
    { signal: AbortSignal.timeout(15000) },
  );

  if (!response.ok) throw new Error(`Discord respondió con HTTP ${response.status}.`);

  const invite = await response.json();
  const amount = invite.approximate_member_count;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Discord no devolvió el número aproximado de miembros.");
  }

  return { ...discord, amount };
}

async function saveRows(rows) {
  if (!rows.length) throw new Error("No hay recuentos válidos que guardar.");

  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool({
    host: getRequiredEnv("DB_HOST"),
    user: getRequiredEnv("DB_USER"),
    password: getRequiredEnv("DB_PASSWORD"),
    database: getRequiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  try {
    const placeholders = rows.map(() => "(?, ?, ?, ?)").join(", ");
    const values = rows.flatMap(({ id, social, amount, type }) => [id, social, amount, type]);
    await pool.execute(
      `INSERT INTO social_counts (id, social, amount, type) VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), type = VALUES(type)`,
      values,
    );
    console.log(`Recuentos guardados: ${rows.map(({ social }) => social).join(", ")}.`);
  } finally {
    await pool.end();
  }
}

async function main() {
  const [metrikaResult, discordResult] = await Promise.allSettled([
    fetchMetrikaRows(),
    fetchDiscordRow(),
  ]);
  const rows = [];
  const failures = [];

  if (metrikaResult.status === "fulfilled") rows.push(...metrikaResult.value);
  else failures.push(`Metrika: ${metrikaResult.reason.message}`);

  if (discordResult.status === "fulfilled") rows.push(discordResult.value);
  else failures.push(`Discord: ${discordResult.reason.message}`);

  if (rows.length) await saveRows(rows);
  if (failures.length) throw new Error(failures.join(" "));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
