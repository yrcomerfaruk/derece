'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden max-w-[100vw]">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold tracking-tight">
                <span className="text-black">DERECE</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-400 text-gradient-fix"> AI</span>
              </span>
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-500 to-black text-gradient-fix">Adım Adım</span> Ulaş.
              </h1>

              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Derece AI, kişisel hedeflerine göre optimize edilmiş ders programları ve 7/24 aktif AI koçun ile seni başarıya taşır.
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
                <Link href="#nasil-calisir" scroll={true}>
                  <button className="text-sm font-bold px-8 py-4 bg-gray-50 text-black rounded-full hover:bg-gray-100 transition-colors">
                    Nasıl Çalışır?
                  </button>
                </Link>
              </div>


              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-500">
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">Neden Derece AI?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sınav maratonunda ihtiyacın olan tüm araçlar, tek bir platformda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-32 h-32 relative mb-6">
                <Image src="/images/rocket-3d.png" alt="Kişisel Program" fill className="object-contain" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Kişisel Ders Programı</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hedeflerine, boş vakitlerine ve seviyene göre yapay zeka tarafından özel olarak hazırlanan dinamik program.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-32 h-32 relative mb-6">
                <Image src="/images/target-3d.png" alt="Hedef Odaklı" fill className="object-contain" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Hedef Odaklı İlerleme</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Konu eksiklerini tespit eder, sana en uygun çalışma stratejisini belirler ve sürekli rotanı günceller.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-32 h-32 relative mb-6">
                <Image src="/images/chat-3d.png" alt="7/24 Koç" fill className="object-contain" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">7/24 Koç Desteği</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Rehberlik, motivasyon veya strateji... Aklına takılan her soruyu AI koçuna sor, anında cevap al.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır Section */}
      <section id="nasil-calisir" className="py-24 bg-white relative z-10 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-black mb-2">Nasıl Çalışır?</h2>
            <p className="text-gray-500">3 adımda başarı yolculuğuna başla.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-0.5 bg-gray-100 -z-10"></div>

            {/* Step 1 */}
            <div className="flex-1 text-center max-w-xs">
              <div className="w-12 h-12 bg-white border-2 border-black text-black rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 z-10 relative">1</div>
              <h3 className="text-lg text-black font-bold mb-2">Kayıt Ol</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Hızlıca hesabını oluştur ve hedeflerini belirle.</p>
            </div>


            {/* Step 2 */}
            <div className="flex-1 text-center max-w-xs">
              <div className="w-12 h-12 bg-white border-2 border-black text-black rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 z-10 relative">2</div>
              <h3 className="text-lg text-black font-bold mb-2">Programını Al</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Yapay zeka sana özel programını hazırlasın.</p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center max-w-xs">
              <div className="w-12 h-12 bg-white border-2 border-black text-black rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 z-10 relative">3</div>
              <h3 className="text-lg text-black font-bold mb-2">Başla</h3>
              <p className="text-gray-600 text-xs leading-relaxed">Programına uy ve hedefine adım adım ulaş.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50/50 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-black mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-lg text-gray-500">Aklınıza takılan soruların cevapları burada.</p>
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
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
            Başarıya Giden Yolunu Şimdi Çiz
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Binlerce öğrenci gibi sen de potansiyelini keşfet. Kaybetmek için zamanın yok!
          </p>
          <Link href="/auth?tab=kayit">
            <button className="bg-white text-black hover:bg-gray-100 text-base font-bold px-8 py-4 inline-flex items-center gap-2 rounded-full transition-colors">
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
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-black">DERECE</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-400 text-gradient-fix"> AI</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Derece AI. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

    </div>
  );
}
