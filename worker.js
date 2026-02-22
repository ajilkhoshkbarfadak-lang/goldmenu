export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/menu") {
      const category = url.searchParams.get("category") || "";
      const items = await env.DB.prepare(
        "SELECT * FROM menu_items WHERE category=? ORDER BY id ASC"
      ).bind(category).all();
      return new Response(JSON.stringify(items.results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/admin/add_item" && request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO menu_items (category,name,price,image_url) VALUES (?,?,?,?)"
      ).bind(data.category,data.name,data.price,data.image_url).run();
      return new Response("آیتم اضافه شد ✅");
    }

    if (url.pathname === "/admin/delete_item" && request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare("DELETE FROM menu_items WHERE id=?")
        .bind(data.id).run();
      return new Response("آیتم حذف شد ✅");
    }

    if (url.pathname === "/scan") {
      const table = url.searchParams.get("table") || "0";
      await env.DB.prepare(
        "INSERT INTO scans (table_number) VALUES (?)"
      ).bind(table).run();
      await sendTelegram(env, `📌 اسکن جدید QR\nمیز: ${table}`);
      return Response.redirect("/menu");
    }

    if (url.pathname === "/feedback" && request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO feedback (rate, comment, table_number) VALUES (?,?,?)"
      ).bind(data.rate,data.comment,data.table || "0").run();
      const msg = `📝 نظر جدید\nامتیاز: ${data.rate}\nمیز: ${data.table || "0"}\nنظر: ${data.comment}`;
      await sendTelegram(env, msg);
      return new Response("نظر ثبت شد ✅");
    }

    return new Response("Not Found", {status:404});
  }
}

async function sendTelegram(env, message){
  return fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({chat_id:env.ADMIN_CHAT_ID,text:message})
  });
}