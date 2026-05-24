import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LandingHero from "@/components/LandingHero";
import { Users, CalendarDays, ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Cadastre seus estudantes",
    description:
      "Importe sua planilha ou adicione estudantes manualmente com privilégios, gênero e relacionamentos familiares. O sistema valida tudo conforme as diretrizes S-38.",
    icon: Users,
    bullets: ["Importação por Excel/CSV", "Cargos e privilégios", "Vínculos familiares"],
  },
  {
    number: "02",
    title: "Importe o programa da semana",
    description:
      "Carregue o PDF oficial da apostila Vida e Ministério ou use a sincronização automática com o JW.org. As partes ficam organizadas por seção e duração.",
    icon: CalendarDays,
    bullets: ["PDF oficial MWB", "Sincronização semanal", "Partes prontas para designar"],
  },
  {
    number: "03",
    title: "Gere e revise designações",
    description:
      "Em um clique, o sistema aplica todas as regras S-38: gênero, qualificações, intervalos e família. Você revisa, ajusta e compartilha com a congregação.",
    icon: ClipboardList,
    bullets: ["Algoritmo S-38 completo", "Edição manual", "Exportação em PDF"],
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <LandingHero />

      <section
        id="como-funciona"
        className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30"
        aria-labelledby="como-funciona-titulo"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-jw-blue/10 text-jw-blue mb-4">
              Passo a passo
            </span>
            <h2
              id="como-funciona-titulo"
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-jw-navy mb-4"
            >
              Como funciona em 3 passos
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Do cadastro à designação aprovada em poucos minutos por semana.
            </p>
          </div>

          <ol className="space-y-10 md:space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isReversed = index % 2 === 1;

              return (
                <li
                  key={step.number}
                  className={`flex flex-col ${
                    isReversed ? "md:flex-row-reverse" : "md:flex-row"
                  } items-center gap-6 md:gap-12`}
                >
                  {/* Visual side */}
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-br from-jw-blue/20 to-jw-gold/20 rounded-3xl blur-2xl" />
                      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br from-jw-navy to-jw-blue flex flex-col items-center justify-center text-white shadow-2xl">
                        <span className="text-5xl md:text-6xl font-extrabold opacity-30 absolute top-4 right-6">
                          {step.number}
                        </span>
                        <Icon className="w-16 h-16 md:w-20 md:h-20 text-jw-gold" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Text side */}
                  <div className="w-full md:w-1/2 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 text-jw-blue font-semibold mb-3">
                      <span className="text-sm tracking-wider">PASSO {step.number}</span>
                      {index < steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 hidden md:inline" />
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-jw-navy mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-base md:text-lg mb-5">
                      {step.description}
                    </p>
                    <ul className="space-y-2 inline-block text-left">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm md:text-base">
                          <CheckCircle2 className="w-5 h-5 text-jw-gold flex-shrink-0" />
                          <span className="text-foreground">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-16 text-center">
            <Button
              size="lg"
              className="bg-jw-blue hover:bg-jw-blue/90 text-white px-8 py-6 text-lg"
              onClick={() => navigate("/auth")}
            >
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Configuração completa em menos de 10 minutos
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Landing;
