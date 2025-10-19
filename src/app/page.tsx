import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Car, Home as HomeIcon, FileText, DollarSign, CheckCircle, Building2, Phone, Mail, MapPin } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-purple-700" />
            <span className="text-2xl font-bold text-purple-900">Nafinancuj</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#autouvery" className="text-gray-700 hover:text-purple-700 transition">Autoúvery</a>
            <a href="#poistenie" className="text-gray-700 hover:text-purple-700 transition">Poistenie</a>
            <a href="#hypoteky" className="text-gray-700 hover:text-purple-700 transition">Hypotéky</a>
            <a href="#poradenstvo" className="text-gray-700 hover:text-purple-700 transition">Daňové poradenstvo</a>
            <a href="#kontakt" className="text-gray-700 hover:text-purple-700 transition">Kontakt</a>
          </nav>
          <Link
            href="/sign-in"
            className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition"
          >
            Prihlásiť sa
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-6 leading-tight">
                Výhodné finančné riešenia pre vašu budúcnosť
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Uľahčite si život s odborníkmi na vašej strane. Spoľahnite sana naše skúsenosti a riešenia ktoré vám ušetria peniaze aj čas.
              </p>
              <div className="flex gap-4">
                <a
                  href="#kontakt"
                  className="bg-green-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-600 transition shadow-lg"
                >
                  Dohodnúť konzultáciu
                </a>
                <a
                  href="#sluzby"
                  className="bg-purple-100 text-purple-700 px-8 py-4 rounded-lg font-semibold hover:bg-purple-200 transition"
                >
                  Napísať správu
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-100 p-6 rounded-2xl">
                <Car className="h-12 w-12 text-purple-700 mb-3" />
                <h3 className="font-bold text-purple-900 mb-2">Výhodné hypotekárne úvery</h3>
              </div>
              <div className="bg-purple-600 p-6 rounded-2xl text-white">
                <h3 className="text-4xl font-bold mb-2">0%</h3>
                <p className="text-sm">Autoúvery s 0% akontáciou</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <DollarSign className="h-12 w-12 text-green-600 mb-3" />
                <p className="text-sm text-gray-600">Výhodné financovanie a flexibilný prenájom aut</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl text-white flex items-center justify-center">
                <div className="text-center">
                  <HomeIcon className="h-16 w-16 mx-auto mb-2" />
                  <p className="text-sm">Pôžička výhodná a bez čakania</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="sluzby" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-purple-900 mb-4">Naše služby</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Získajte autoúver bez akontácie, výhodnú hypotéku na bývanie či komplexné poistenie. Poskytujeme
              finančné riešenia a poradenstvo prispôsobené vašim potrebám.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div id="autouvery" className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition">
              <Car className="h-12 w-12 text-purple-700 mb-4" />
              <h3 className="text-2xl font-bold text-purple-900 mb-3">Autoúvery a prenájom vozidiel</h3>
              <p className="text-gray-600 mb-4">
                Výhodné financovanie a flexibilný prenájom aut bez starostí pre jednotlivcov aj firmy.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Autoúver na mieru</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Autoúver na mieru</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Autoúver na mieru</span>
                </li>
              </ul>
            </div>

            <div id="poistenie" className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition">
              <FileText className="h-12 w-12 text-purple-700 mb-4" />
              <h3 className="text-2xl font-bold text-purple-900 mb-3">Poistenie</h3>
              <p className="text-gray-600 mb-4">
                Komplexné poistenie na mieru vašim potrebám. Spoľahlivá ochrana pre vás, vaše vozidlo aj majetok.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Životné a úrazové poistenie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Poistenie podnikateľov a vozidiel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Poistenie nehnuteľností a domácností</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Povinné zmluvné poistenie</span>
                </li>
              </ul>
            </div>

            <div id="hypoteky" className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition">
              <HomeIcon className="h-12 w-12 text-purple-700 mb-4" />
              <h3 className="text-2xl font-bold text-purple-900 mb-3">Hypotekárne a spotrebné úvery</h3>
              <p className="text-gray-600 mb-4">
                Financovanie s nízkymi úrokmi a flexibilnými podmienkami. Nájdeme pre to vás najlepšie riešenie.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Hypotéky na bývanie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Financovanie na čokoľvek</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Podnikateľský úver</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Refinancovanie</span>
                </li>
              </ul>
            </div>

            <div id="poradenstvo" className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition">
              <DollarSign className="h-12 w-12 text-purple-700 mb-4" />
              <h3 className="text-2xl font-bold text-purple-900 mb-3">Daňové poradenstvo</h3>
              <p className="text-gray-600 mb-4">
                Optimalizujte svoje dane s profesionálnym poradenstvom. Pomôžeme vám využiť všetky dostupné možnosti, aby ste platili len to, čo naozaj musíte.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Daňová optimalizácia</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Poradenstvo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Strategické plánovanie</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-purple-700 mb-2">12</div>
              <p className="text-gray-600">Viac ako 12 rokov skúseností</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-700 mb-2">5</div>
              <p className="text-gray-600">5 členov v tíme</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-700 mb-2">200</div>
              <p className="text-gray-600">Viac ako 200 spokojných klientov</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-700 mb-2">120</div>
              <p className="text-gray-600">cez 120 vybavených hypotéк</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 mb-8">
            Spolupracujeme s vybranými bankami, poisťovňami a preverenými nebankovými poskytovateľmi pôžičiek. Analyzujeme poskytovateľov podľa na trhu.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">HOME CREDIT</div>
            <div className="text-2xl font-bold text-gray-400">Prima Banka</div>
            <div className="text-2xl font-bold text-gray-400">TATRA BANKA</div>
            <div className="text-2xl font-bold text-gray-400">UniCredit</div>
            <div className="text-2xl font-bold text-gray-400">365.bank</div>
            <div className="text-2xl font-bold text-gray-400">ČSOB</div>
            <div className="text-2xl font-bold text-gray-400">SLOVENSKÁ SPORITEĽŇA</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-800 to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Dohodnite si s námi konzultáciu</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Máte otázky ohľadom financovania, poistenia alebo daní? Sme pripravení vám pomôcť. Dohodnite si s nami konzultáciu a získajte odborné poradenstvo šité na mieru vašim potrebám.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#kontakt"
              className="bg-green-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-600 transition shadow-lg"
            >
              Zavolať
            </a>
            <a
              href="#kontakt"
              className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Napísať správu
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontakt" className="bg-purple-950 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-8 w-8" />
                <span className="text-2xl font-bold">Nafinancuj</span>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold mb-3">Adresa</h3>
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>Štúrovo námestie 132,<br />911 01 Trenčín, Slovakia</span>
                </p>
                <h3 className="font-semibold mb-3 mt-6">Kontakt</h3>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  +421 123 456 789
                </p>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  info@nafinancuj.sk
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Mapa stránok</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#autouvery" className="hover:text-white transition">Autoúvery</a></li>
                <li><a href="#hypoteky" className="hover:text-white transition">Hypotéky</a></li>
                <li><a href="#poistenie" className="hover:text-white transition">Poistenie</a></li>
                <li><a href="#poradenstvo" className="hover:text-white transition">Dane</a></li>
                <li><a href="#kontakt" className="hover:text-white transition">Kontakt</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Kontakt</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition">Ochrana osobných údajov</a></li>
                <li><a href="#" className="hover:text-white transition">Súbory cookie</a></li>
                <li><a href="#" className="hover:text-white transition">Podmienky používania</a></li>
                <li><a href="#" className="hover:text-white transition">Dokument</a></li>
              </ul>
            </div>

            <div className="bg-purple-900/50 p-6 rounded-lg">
              <div className="space-y-4">
                <div className="h-24 bg-purple-800 rounded"></div>
                <div className="h-16 bg-purple-700 rounded"></div>
                <div className="h-32 bg-purple-600 rounded"></div>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Nafinancuj.sk | všetky práva vyhradené</p>
        </div>
      </div>
      </footer>
    </div>
  );
}
