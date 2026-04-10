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
      subject: `¡Bienvenido a UnTroll, ${username}! ⚡`,
      html: `
        <div style="background-color: #080810; color: #c8c8c8; font-family: 'Outfit', sans-serif; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(200, 155, 60, 0.2);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #c89b3c, #785a28); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">⚡</div>
            <h1 style="color: #f0e6d2; font-size: 28px; font-weight: 900; margin-top: 20px; letter-spacing: -1px;">¡HOLA, ${username.toUpperCase()}!</h1>
          </div>
          
          <div style="line-height: 1.6; font-size: 16px;">
            <p>Bienvenido a <strong>UnTroll</strong>, tu nuevo coach personal de League of Legends impulsado por Inteligencia Artificial.</p>
            <p>A partir de ahora, ya no tenés que depender de estadísticas genéricas. UnTroll analiza la composición exacta de tu partida para darte el mejor <strong>game plan</strong>, <strong>builds</strong> y <strong>estrategia</strong> adaptada a lo que realmente está pasando en la Grieta.</p>
            
            <div style="background: rgba(200, 155, 60, 0.05); border: 1px solid rgba(200, 155, 60, 0.1); border-radius: 10px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #c89b3c; margin-top: 0;">¿Cómo empezar?</h3>
              <ul style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">Entrá a la web y seleccioná los 10 campeones de la partida.</li>
                <li style="margin-bottom: 10px;">Presioná "Generar Game Plan".</li>
                <li>Recibí consejos challenger en menos de 10 segundos.</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://untroll.gg" style="background: linear-gradient(135deg, #c89b3c, #a07830); color: #080810; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block;">IR AL COACH</a>
            </div>
          </div>
          
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #5b5a56;">
            <p>UnTroll · Tu coach challenger personal de LoL</p>
            <p><a href="https://untroll.gg" style="color: #c89b3c; text-decoration: none;">untroll.gg</a></p>
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
