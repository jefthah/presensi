import nodemailer from "nodemailer";

const sendPresenceEmail = async (email, name, matkul, pertemuan) => {
  // Konfigurasi transporter untuk Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const message = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Presensi Berhasil untuk Mata Kuliah ${matkul}`,
    text: `Halo ${name},\n\nPresensi Anda untuk mata kuliah ${matkul} pada pertemuan ${pertemuan} berhasil.\n\nTerima kasih!\n\nJika Anda ingin memberikan feedback, silakan klik link berikut:\nhttps://forms.gle/h5fxJwoBUYvJdxjh8`,
    html: `<p>Halo <strong>${name}</strong>,</p>
           <p>Presensi Anda untuk mata kuliah <strong>${matkul}</strong> pada pertemuan <strong>${pertemuan}</strong> berhasil.</p>
           <p>Terima kasih!</p>
           <p>Jika Anda ingin memberikan feedback, silakan klik link berikut:</p>
           <p><a href="https://forms.gle/h5fxJwoBUYvJdxjh8" target="_blank">Isi Kuisioner</a></p>`, // Menambahkan link kuisioner
  };

  try {
    await transporter.sendMail(message);
    console.log("Email berhasil dikirim!");
  } catch (error) {
    console.error("Error mengirim email:", error);
    throw new Error("Gagal mengirim email.");
  }
};

export async function POST(req) {
  const { email, name, matkul, pertemuan } = await req.json();

  if (!email || !name || !matkul || !pertemuan) {
    return new Response(JSON.stringify({ message: "Missing required data" }), {
      status: 400,
    });
  }

  try {
    await sendPresenceEmail(email, name, matkul, pertemuan);
    return new Response(
      JSON.stringify({ message: "Email successfully sent" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to send email" }), {
      status: 500,
    });
  }
}
