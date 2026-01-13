
import { HumanizationMode, ModeConfig } from './types';

export const MODES: ModeConfig[] = [
  {
    id: HumanizationMode.HS_STUDENT,
    label: 'Estudante (Ensino Médio)',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: HumanizationMode.UNI_STUDENT,
    label: 'Estudante Universitário',
    icon: '🔵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: HumanizationMode.SIMPLE,
    label: 'Linguagem Simples',
    icon: '🟣',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: HumanizationMode.ACADEMIC,
    label: 'Académico Humano',
    icon: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: HumanizationMode.PROFESSIONAL,
    label: 'Profissional Natural',
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];

export const SYSTEM_PROMPT = `
Atue como um editor humano experiente, professor e revisor académico.
Receberás um texto originalmente gerado por IA e tua tarefa é humanizá-lo completamente, tornando-o indistinguível de um texto escrito por uma pessoa real.

O texto final deve soar natural, fluido, coerente e humano, mantendo o conteúdo correto, mas ajustando estilo, ritmo e vocabulário.

REGRAS DE HUMANIZAÇÃO (ESSENCIAIS):
1. Evite frases muito perfeitas ou simétricas.
2. Varie o tamanho das frases (curtas + médias + longas).
3. Use conectores naturais (“além disso”, “por outro lado”, “vale destacar”).
4. Evite repetições mecânicas de estrutura.
5. Substitua palavras genéricas por termos usados no dia a dia académico/profissional.
6. Use explicações humanas, não robóticas.
7. Mantenha um tom realista.

AJUSTE DE ESTILO:
- Parecer escrito manualmente, com variações naturais.
- Evitar listas excessivas; transformar em parágrafos fluídos.

ANTI-DETECTOR:
- Apresentar fluidez humana.
- Não seguir padrões repetitivos.
- Evitar excesso de precisão artificial.

PROIBIDO USAR:
- “É importante destacar que…”
- “Nesse contexto…”
- “De forma geral…”
`;

export const DETECTION_PROMPT = `
Analise o seguinte texto e determine a probabilidade de ele ter sido gerado por uma Inteligência Artificial (como ChatGPT, Claude ou Gemini).
Avalie a Perplexidade (variedade léxica) e Burstiness (variação no tamanho das sentenças).

Retorne APENAS um objeto JSON com o seguinte formato:
{
  "score": number (0 a 100, onde 100 é certeza absoluta de IA),
  "label": string ("Humano", "Misto" ou "IA"),
  "reasoning": string (uma breve explicação técnica em português)
}
`;

export const MODE_MAPPING: Record<HumanizationMode, string> = {
  [HumanizationMode.HS_STUDENT]: "🟢 Estudante do ensino médio",
  [HumanizationMode.UNI_STUDENT]: "🔵 Estudante universitário",
  [HumanizationMode.SIMPLE]: "🟣 Linguagem simples e natural",
  [HumanizationMode.ACADEMIC]: "🟠 Linguagem académica humana",
  [HumanizationMode.PROFESSIONAL]: "🔴 Linguagem profissional natural",
};
