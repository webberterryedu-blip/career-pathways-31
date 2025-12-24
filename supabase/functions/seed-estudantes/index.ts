import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nomes masculinos brasileiros
const nomesMasculinos = [
  "João", "Pedro", "Lucas", "Mateus", "Gabriel", "Rafael", "Daniel", "Carlos", 
  "Marcos", "Paulo", "André", "Felipe", "Tiago", "Bruno", "Leonardo", "Rodrigo", 
  "Fernando", "Gustavo", "Ricardo", "Eduardo", "Roberto", "Antônio", "José", 
  "Francisco", "Miguel", "Henrique", "Vinícius", "Thiago", "Alexandre", "Marcelo"
];

// Nomes femininos brasileiros
const nomesFemininos = [
  "Maria", "Ana", "Juliana", "Fernanda", "Camila", "Patrícia", "Mariana", "Beatriz", 
  "Carolina", "Amanda", "Gabriela", "Letícia", "Larissa", "Rafaela", "Isabela", 
  "Bruna", "Daniela", "Vanessa", "Priscila", "Renata", "Cláudia", "Sandra", 
  "Mônica", "Cristina", "Raquel", "Adriana", "Luciana", "Carla", "Paula", "Tatiana"
];

// Sobrenomes brasileiros
const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Lima", "Almeida", 
  "Ferreira", "Rodrigues", "Gomes", "Martins", "Araújo", "Ribeiro", "Carvalho", 
  "Nascimento", "Barbosa", "Moreira", "Nunes", "Vieira", "Dias", "Mendes", 
  "Andrade", "Rocha", "Freitas"
];

const estadosCivis = ["solteiro", "casado", "viuvo", "divorciado"];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  const ddd = randomInt(11, 99);
  const num1 = randomInt(90000, 99999);
  const num2 = randomInt(1000, 9999);
  return `(${ddd}) ${num1}-${num2}`;
}

function generateDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface Estudante {
  nome: string;
  sobrenome: string;
  genero: "masculino" | "feminino";
  privilegio: string;
  idade: number;
  email: string;
  telefone: string;
  data_nascimento: string;
  data_batismo: string | null;
  ativo: boolean;
  menor: boolean;
  estado_civil: string;
  chairman: boolean;
  pray: boolean;
  treasures: boolean;
  gems: boolean;
  reading: boolean;
  starting: boolean;
  following: boolean;
  making: boolean;
  explaining: boolean;
  talk: boolean;
}

function generateEstudante(
  genero: "masculino" | "feminino",
  privilegio: string,
  usedNames: Set<string>
): Estudante {
  const nomes = genero === "masculino" ? nomesMasculinos : nomesFemininos;
  
  // Gerar nome único
  let nome: string;
  let sobrenome: string;
  let fullName: string;
  do {
    nome = randomElement(nomes);
    sobrenome = randomElement(sobrenomes);
    fullName = `${nome} ${sobrenome}`;
  } while (usedNames.has(fullName));
  usedNames.add(fullName);

  // Determinar idade baseada no privilégio
  let minAge: number, maxAge: number;
  switch (privilegio) {
    case "anciao":
      minAge = 35; maxAge = 75;
      break;
    case "servo_ministerial":
      minAge = 23; maxAge = 55;
      break;
    case "pioneiro_regular":
      minAge = 18; maxAge = 65;
      break;
    case "publicador_batizado":
      minAge = 12; maxAge = 80;
      break;
    case "publicador_nao_batizado":
      minAge = 10; maxAge = 70;
      break;
    case "estudante_novo":
      minAge = 8; maxAge = 60;
      break;
    default:
      minAge = 18; maxAge = 60;
  }

  const data_nascimento = generateDate(
    new Date().getFullYear() - maxAge,
    new Date().getFullYear() - minAge
  );
  const idade = calculateAge(data_nascimento);
  const menor = idade < 18;

  // Data de batismo (apenas para batizados)
  let data_batismo: string | null = null;
  const isBatizado = ["anciao", "servo_ministerial", "pioneiro_regular", "publicador_batizado"].includes(privilegio);
  if (isBatizado) {
    const birthYear = new Date(data_nascimento).getFullYear();
    const baptismMinYear = birthYear + 10; // Mínimo 10 anos de idade
    const baptismMaxYear = Math.min(new Date().getFullYear(), birthYear + idade);
    if (baptismMaxYear >= baptismMinYear) {
      data_batismo = generateDate(baptismMinYear, baptismMaxYear);
    }
  }

  // Estado civil baseado na idade
  let estado_civil: string;
  if (idade < 18) {
    estado_civil = "solteiro";
  } else if (idade < 25) {
    estado_civil = Math.random() > 0.7 ? "casado" : "solteiro";
  } else {
    estado_civil = randomElement(estadosCivis);
  }

  // Qualificações baseadas em privilégio e gênero
  let chairman = false, pray = false, treasures = false, gems = false;
  let reading = false, starting = false, following = false;
  let making = false, explaining = false, talk = false;

  if (genero === "masculino") {
    switch (privilegio) {
      case "anciao":
        chairman = true; pray = true; treasures = true; gems = true;
        reading = true; starting = true; following = true;
        making = true; explaining = true; talk = true;
        break;
      case "servo_ministerial":
        chairman = Math.random() > 0.5; pray = true; treasures = Math.random() > 0.3;
        gems = Math.random() > 0.3; reading = true; starting = true;
        following = true; making = true; explaining = true; talk = true;
        break;
      case "pioneiro_regular":
      case "publicador_batizado":
        pray = Math.random() > 0.5; reading = true; starting = true;
        following = true; making = true; explaining = true; talk = true;
        break;
      case "publicador_nao_batizado":
        reading = Math.random() > 0.3; starting = true; following = true;
        making = Math.random() > 0.5; explaining = Math.random() > 0.5;
        break;
      case "estudante_novo":
        starting = true;
        break;
    }
  } else {
    // Feminino
    switch (privilegio) {
      case "pioneiro_regular":
      case "publicador_batizado":
        starting = true; following = true; making = true; explaining = true;
        break;
      case "publicador_nao_batizado":
        starting = true; following = Math.random() > 0.3;
        making = Math.random() > 0.5; explaining = Math.random() > 0.5;
        break;
      case "estudante_novo":
        starting = true;
        break;
    }
  }

  const emailNome = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const emailSobrenome = sobrenome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const email = `${emailNome}.${emailSobrenome}${randomInt(1, 99)}@exemplo.com`;

  return {
    nome,
    sobrenome,
    genero,
    privilegio,
    idade,
    email,
    telefone: generatePhone(),
    data_nascimento,
    data_batismo,
    ativo: true,
    menor,
    estado_civil,
    chairman,
    pray,
    treasures,
    gems,
    reading,
    starting,
    following,
    making,
    explaining,
    talk,
  };
}

function generateAllEstudantes(): Estudante[] {
  const estudantes: Estudante[] = [];
  const usedNames = new Set<string>();

  // Distribuição definida no plano
  // 5 Anciãos (masculino)
  for (let i = 0; i < 5; i++) {
    estudantes.push(generateEstudante("masculino", "anciao", usedNames));
  }

  // 8 Servos Ministeriais (masculino)
  for (let i = 0; i < 8; i++) {
    estudantes.push(generateEstudante("masculino", "servo_ministerial", usedNames));
  }

  // 15 Pioneiros Regulares (misto)
  for (let i = 0; i < 8; i++) {
    estudantes.push(generateEstudante("feminino", "pioneiro_regular", usedNames));
  }
  for (let i = 0; i < 7; i++) {
    estudantes.push(generateEstudante("masculino", "pioneiro_regular", usedNames));
  }

  // 40 Publicadores Batizados (misto)
  for (let i = 0; i < 20; i++) {
    estudantes.push(generateEstudante("feminino", "publicador_batizado", usedNames));
  }
  for (let i = 0; i < 20; i++) {
    estudantes.push(generateEstudante("masculino", "publicador_batizado", usedNames));
  }

  // 20 Publicadores Não Batizados (misto)
  for (let i = 0; i < 10; i++) {
    estudantes.push(generateEstudante("feminino", "publicador_nao_batizado", usedNames));
  }
  for (let i = 0; i < 10; i++) {
    estudantes.push(generateEstudante("masculino", "publicador_nao_batizado", usedNames));
  }

  // 12 Estudantes Novos (misto)
  for (let i = 0; i < 6; i++) {
    estudantes.push(generateEstudante("feminino", "estudante_novo", usedNames));
  }
  for (let i = 0; i < 6; i++) {
    estudantes.push(generateEstudante("masculino", "estudante_novo", usedNames));
  }

  return estudantes;
}

Deno.serve(async (req) => {
  console.log("seed-estudantes function called");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já existem estudantes
    const { count, error: countError } = await supabase
      .from('estudantes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting students:", countError);
      throw countError;
    }

    console.log(`Current student count: ${count}`);

    // Gerar 100 estudantes fictícios
    const estudantes = generateAllEstudantes();
    console.log(`Generated ${estudantes.length} students`);

    // Inserir em lotes de 20
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < estudantes.length; i += batchSize) {
      const batch = estudantes.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('estudantes')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }

      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}, total: ${inserted}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inserted} estudantes fictícios criados com sucesso!`,
        previousCount: count,
        newCount: (count || 0) + inserted,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in seed-estudantes:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
