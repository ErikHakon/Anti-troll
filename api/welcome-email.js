import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }

  try {
    const data = await resend.emails.send({
      from: 'UnTroll <onboarding@resend.dev>',
      to: [email],
      subject: `¡Bienvenido a UnTroll, ${username}! Tu coach ya está listo`,
      html: `
        <div style="background-color: #0d0d1a; color: #c8c8c8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid rgba(200, 155, 60, 0.2);">
          <!-- Header -->
          <div style="background-color: #080810; padding: 30px; text-align: center;">
            <div style="width:56px; height:56px; background:#c89b3c; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto; font-size:32px; line-height:1;">⚡</div>
            <h1 style="color: #c89b3c; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: 2px;">UNTROLL</h1>
            <p style="color: #ffffff; font-size: 14px; margin: 5px 0 0; opacity: 0.8; letter-spacing: 1px;">Tu coach challenger personal de LoL</p>
          </div>
          
          <!-- Gold Separator -->
          <div style="height: 3px; background-color: #c89b3c;"></div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="font-size: 24px; font-weight: 800; color: #f0e6d2; margin-top: 0;">¡Hola, ${username}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #c8c8c8;">
              Bienvenido a <strong>UnTroll</strong>. Tu acceso a la mejor tecnología de análisis contextual para League of Legends ya está activo.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #c8c8c8;">
              A partir de ahora, ya no tenés que depender de estadísticas genéricas. Analizamos las dos composiciones en tiempo real para darte el <strong>game plan</strong> que realmente necesitás para ganar.
            </p>
            
            <!-- Tutorial Box -->
            <div style="background-color: #080810; border: 1px solid #c89b3c; border-radius: 12px; padding: 25px; margin: 30px 0; color: #ffffff;">
              <h3 style="color: #c89b3c; margin-top: 0; font-size: 18px;">¿Cómo empezar?</h3>
              <div style="font-size: 14px; line-height: 1.8;">
                <div style="margin-bottom: 8px;">• Entrá a la web y seleccioná los 10 campeones.</div>
                <div style="margin-bottom: 8px;">• Presioná <strong>"Generar Game Plan"</strong>.</div>
                <div>• Recibí consejos de nivel challenger en segundos.</div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://untroll.gg" style="background-color: #c89b3c; color: #080810; padding: 18px 35px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block;">
                IR AL COACH
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #080810; padding: 30px; text-align: center; font-size: 12px; color: #888888;">
            <p style="margin: 0 0 10px;">Analizá. Adaptate. Ganá.</p>
            <p style="margin: 0;">
              UnTroll © 2026 · 
              <a href="https://untroll.gg" style="color: #c89b3c; text-decoration: none; font-weight: 700;">untroll.gg</a>
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
