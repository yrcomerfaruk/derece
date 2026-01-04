'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden max-w-[100vw]">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[50px]">
            <div className="flex items-center">
              <Image src="/logo.png" alt="Derece AI" width={0} height={40} className="h-[40px] w-auto" priority unoptimized />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth?tab=giris">
                <button className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Giriş Yap</button>
              </Link>
              <Link href="/auth?tab=kayit">
                <button className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-800 transition-colors">Başla</button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="z-10 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-sm text-gray-600 mb-6 font-medium">
                <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                Yapay Zeka Destekli YKS Koçluğu
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-black tracking-tight mb-8 leading-[1.1]">
                Hayallerindeki Üniversiteye <br className="hidden lg:block" />
                <span className="text-gray-700">Adım Adım</span> Ulaş.
              </h1>

              <p className="text-base md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Derece AI, kişisel hedeflerine göre optimize edilmiş ders programları <br className="hidden md:block" />
                ve 7/24 aktif AI koçun ile seni başarıya taşır.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link href="/auth?tab=kayit">
                  <button className="text-sm font-bold px-8 py-4 inline-flex items-center gap-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                    Ücretsiz Başla
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="#features" scroll={true}>
                  <button className="text-sm font-bold px-8 py-4 bg-gray-50 text-black rounded-full hover:bg-gray-100 transition-colors">
                    Nasıl Çalışır?
                  </button>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <Image src="/icon.svg" alt="" width={20} height={20} className="opacity-60" />
                  Kişisel Program
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/icon.svg" alt="" width={20} height={20} className="opacity-60" />
                  7/24 AI Koç
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/icon.svg" alt="" width={20} height={20} className="opacity-60" />
                  Anlık Analiz
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Background Icon */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.03]">
        <Image
          src="/icon.svg"
          alt="Background Icon"
          width={800}
          height={800}
          className="object-contain animate-pulse duration-[10000ms] w-[80vw] md:w-[600px]"
        />
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-black mb-4">Neden Derece AI?</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Sınav maratonunda ihtiyacın olan tüm araçlar, tek bir platformda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group">
              <div className="relative w-[100px] h-[100px] mb-6 transition-transform duration-500 group-hover:scale-110">
                <Image
                  src="/images/target-3d.png"
                  alt="Kişiye Özel Program"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Kişiye Özel Program</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hedeflerine ve seviyene göre şekillenen dinamik çalışma planı.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group">
              <div className="relative w-[100px] h-[100px] mb-6 transition-transform duration-500 group-hover:scale-110">
                <Image
                  src="/images/chat-3d.png"
                  alt="7/24 AI Koç"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">7/24 AI Koç</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sürekli yanında olan, seni takip eden ve motive eden yapay zeka.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group">
              <div className="relative w-[100px] h-[100px] mb-6 transition-transform duration-500 group-hover:scale-110">
                <Image
                  src="/images/rocket-3d.png"
                  alt="Hızlı İlerleme"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Hızlı İlerleme</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Verimini artıran stratejilerle hedefine en kısa yoldan ulaş.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50/50 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-extrabold text-black mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-base text-gray-500">Aklınıza takılan soruların cevapları burada.</p>
          </div>

          <div className="grid gap-6">
            <div className="bg-white rounded-2xl p-6 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-black mb-2">Program kişiye özel mi hazırlanıyor?</h3>
              <p className="text-gray-600">Evet, Derece AI kayıt olurken girdiğin hedefler, seviyen ve boş vakitlerine göre tamamen sana özel bir program oluşturur.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-black mb-2">AI Koç ile ne konuşabilirim?</h3>
              <p className="text-gray-600">Ders çalışma stratejileri, motivasyon, konu eksiklerin veya rehberlik ihtiyacın olan her konuda 7/24 soru sorabilirsin.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-black mb-2">Soru çözüm desteği var mı?</h3>
              <p className="text-gray-600">Şu an için görsel soru çözüm desteğimiz bulunmamaktadır. Ancak yapamadığın soruların konusuyla ilgili AI koçundan detaylı konu anlatımı ve çözüm stratejisi isteyebilirsin.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-black mb-2">Hangi cihazlarda kullanabilirim?</h3>
              <p className="text-gray-600">Derece AI tüm telefon, tablet ve bilgisayarlarda tarayıcı üzerinden sorunsuz çalışır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-6">
            Başarıya Giden Yolunu Şimdi Çiz
          </h2>
          <p className="text-base text-gray-300 mb-10 max-w-2xl mx-auto">
            Binlerce öğrenci gibi sen de potansiyelini keşfet. Kaybetmek için zamanın yok!
          </p>
          <Link href="/auth?tab=kayit">
            <button className="bg-white text-black hover:bg-gray-100 text-sm font-bold px-8 py-4 inline-flex items-center gap-2 rounded-full transition-colors">
              Ücretsiz Denemeye Başla
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Derece AI" width={0} height={35} className="h-[35px] w-auto" unoptimized />
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Derece AI. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
